# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
import tmdbsimple as tmdb

from uocciny import app, get_uf, save_uf
from database import Base, get_db, row2dict


class Movie(Base):
    __tablename__ = 'movies'

    imdb_id = Column(String, primary_key=True)
    tmdb_id = Column(Integer, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    poster = Column(String)
    genres = Column(String)
    actors = Column(String)
    director = Column(String)
    language = Column(String)
    released = Column(DateTime)
    runtime = Column(Integer)
    updated = Column(DateTime)

    def __init__(self, imdb_id):
        self.imdb_id = imdb_id

    def __repr__(self):
        return '<Movie %s - %s>' % (self.imdb_id, self.name if self.name else 'N/A')
    
    def is_old(self):
        if self.updated is None:
            return True
        age = (datetime.now() - self.updated).days
        if self.released is None:
            return age > 15
        if (datetime.now() - self.released).days <= 30:
            return age > 30
        if (datetime.now() - self.released).days > (15 * 365):
            return age > 180
        return age > 45

    
def read_from_uoccin(imdb_id):
    return get_uf().get('movies', {}).get(imdb_id, None)


def read_from_imdb(imdb_id):
    try:
        return tmdb.Movies(imdb_id).info(language='en', append_to_response='credits')
    except Exception as err:
        app.logger.debug('read_from_imdb: ' + str(err))
        return None

    
def update_from_tmdb(movie):
    app.logger.info('updating %r...' % movie)
    exists = movie.updated is not None
    db = get_db()
    try:
        obj = read_from_imdb(movie.imdb_id)
        if obj is None:
            raise Exception('IMDB error or movie not found')
        movie.tmdb_id = obj['id']
        movie.name = obj['title'] if obj['title'] else None
        movie.plot = obj['overview'] if obj['overview'] else None
        movie.poster = obj['poster_path'] if obj['poster_path'] else None
        movie.genres = ', '.join([g['name'] for g in obj['genres']]) if obj['genres'] else None
        movie.language = obj['original_language'] if obj['original_language'] else None
        movie.released = datetime.strptime(obj['release_date'], '%Y-%m-%d') if obj['release_date'] != '' else None
        movie.runtime = obj['runtime'] if obj['runtime'] else None
        movie.actors = ', '.join([a['name'] for a in obj['credits']['cast'] if a['gender'] > 0])
        movie.director = ', '.join([c['name'] for c in obj['credits']['crew'] if c['job'] == 'Director'])
        # done
        movie.updated = datetime.now()
        if not exists:
            db.add(movie)
        db.commit()
        app.logger.info('updated %r' % movie)
    except Exception as err:
        app.logger.error('update failed for %r: %s' % (movie, str(err)))
        db.rollback()
        movie.error = str(err)


def get_metadata(movie):
    mid = movie['imdb_id']
    rec = get_db().query(Movie).filter(Movie.imdb_id == mid).first()
    if rec is None:
        rec = Movie(mid)
    if rec.is_old():
        update_from_tmdb(rec)
    movie.update(row2dict(rec))
    return movie


def get_movie(imdb_id):
    app.logger.debug('get_movie: imdb_id=%s' % imdb_id)
    obj = read_from_uoccin(imdb_id)
    if obj is None:
        return []
    return [get_metadata(dict({'imdb_id': imdb_id}, **obj))]


def get_movie_list(watchlist=None, collected=None, watched=None):
    app.logger.debug('get_movie_list: watchlist=%s, collected=%s, watched=%s' % (watchlist, collected, watched))
    res = []
    for mid, itm in get_uf().get('movies', {}).iteritems():
        if ((watchlist is None or itm['watchlist'] == watchlist) and
            (collected is None or itm['collected'] == collected) and
            (watched is None or itm['watched'] == watched)):
            res.append(get_metadata(dict({'imdb_id': mid}, **itm)))
    return res


def set_movie(imdb_id, watchlist=None, collected=None, watched=None, rating=None):
    app.logger.debug('set_movie: imdb_id=%s, watchlist=%s, collected=%s, watched=%s, rating=%s' %
        (imdb_id, watchlist, collected, watched, rating))
    uf = get_uf()
    obj = read_from_uoccin(imdb_id)
    exists = obj is not None
    if not exists:
        obj = {
            'watchlist': False,
            'collected': {},
            'watched': {}
        }
    rec = get_metadata(dict({'imdb_id': imdb_id}, **obj))
    obj['name'] = rec['name']
    if watchlist is not None:
        obj['watchlist'] = watchlist
    if collected is not None:
        obj['collected'] = collected
    if watched is not None:
        obj['watched'] = watched
    if rating > 0:
        obj['rating'] = max(rating, 5)
    uf.setdefault('movies', {})[imdb_id] = obj
    save_uf(uf)
    rec = get_metadata(dict({'imdb_id': imdb_id}, **obj))
    return [rec]
