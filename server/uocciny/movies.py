# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
import tmdbsimple as tmdb

from uocciny import app, get_uf
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
    
    def update_from_tmdb(self, session):
        app.logger.info('updating %r...' % self)
        try:
            exists = self.updated is not None
            res = tmdb.Movies(self.imdb_id).info(language='en', append_to_response='credits')
            self.tmdb_id = res['id']
            self.name = res['title'] if res['title'] else None
            self.plot = res['overview'] if res['overview'] else None
            self.poster = res['poster_path'] if res['poster_path'] else None
            self.genres = ', '.join([g['name'] for g in res['genres']]) if res['genres'] else None
            self.language = res['original_language'] if res['original_language'] else None
            self.released = datetime.strptime(res['release_date'], '%Y-%m-%d') if res['release_date'] != '' else None
            self.runtime = res['runtime'] if res['runtime'] else None
            self.actors = ', '.join([a['name'] for a in res['credits']['cast'] if a['gender'] > 0])
            self.director = ', '.join([c['name'] for c in res['credits']['crew'] if c['job'] == 'Director'])
            # done
            self.updated = datetime.now()
            if not exists:
                session.add(self)
            session.commit()
            app.logger.info('updated %r' % self)
        except Exception as err:
            app.logger.error('update failed for %r: %s' % (self, str(err)))
            self.name = 'Update error'
            self.plot = str(err)


def fill_metadata(lst):
    db = get_db()
    for itm in lst:
        mid = itm['imdb_id']
        rec = db.query(Movie).filter(Movie.imdb_id == mid).first()
        if rec is None:
            rec = Movie(mid)
        if rec.is_old():
            rec.update_from_tmdb(db)
        itm.update(row2dict(rec))
    return lst


def get_movie(imdb_id):
    app.logger.debug('get_movie: imdb_id=%s' % imdb_id)
    obj = get_uf().get('movies', {}).get(imdb_id, None)
    if obj is None:
        return []
    return fill_metadata([dict({'imdb_id': imdb_id}, **obj)])


def get_movie_list(watchlist=None, collected=None, watched=None):
    app.logger.debug('get_movie_list: watchlist=%s, collected=%s, watched=%s' % (watchlist, collected, watched))
    res = []
    for mid, itm in get_uf().get('movies', {}).iteritems():
        if ((watchlist is None or itm['watchlist'] == watchlist) and
            (collected is None or itm['collected'] == collected) and
            (watched is None or itm['watched'] == watched)):
            res.append(dict({'imdb_id': mid}, **itm))
    return fill_metadata(res)


def set_movie(imdb_id, watchlist=None, collected=None, watched=None, rating=None):
    app.logger.debug('get_movie: imdb_id=%s, watchlist=%s, collected=%s, watched=%s, rating=%s' %
        (imdb_id, watchlist, collected, watched, rating))
