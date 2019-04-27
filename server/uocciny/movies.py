# encoding: utf-8
import operator
from datetime import datetime
import Queue as queue
import threading
from sqlalchemy import Column, Integer, String, DateTime
import tmdbsimple as tmdb

from uocciny import app, get_uf, save_uf
from uocciny.database import Base, get_db, row2dict

'''
https://stackoverflow.com/questions/14384739/how-can-i-add-a-background-thread-to-flask

shutting_down = False
movie_queue = queue.Queue()

def update_movies():
    while not shutting_down:
        try:
            movie = movie_queue.get(True, 30)
            update_from_tmdb(movie)
        except queue.Empty:
            pass

threading.Thread(target=update_movies).start()
'''

class Movie(Base):
    __tablename__ = 'movies'

    imdb_id = Column(String, primary_key=True)
    tmdb_id = Column(Integer, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    genres = Column(String)
    actors = Column(String)
    director = Column(String)
    language = Column(String)
    poster = Column(String)
    posterWidth = Column(Integer)
    posterHeight = Column(Integer)
    released = Column(DateTime)
    runtime = Column(Integer)
    updated = Column(DateTime)

    def __init__(self, imdb_id):
        self.imdb_id = imdb_id

    def __repr__(self):
        return '<Movie %s>' % self.imdb_id

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


def update_from_tmdb(movie):
    app.logger.info('updating %r...', movie)
    exists = movie.updated is not None
    db = get_db()
    try:
        obj = tmdb.Movies(movie.imdb_id).info(language='en', append_to_response='credits,images')
        if obj is None:
            raise Exception('IMDB error or movie not found')
        movie.tmdb_id = obj['id']
        movie.name = obj['title'] if obj['title'] else None
        movie.plot = obj['overview'] if obj['overview'] else None
        movie.genres = ', '.join([g['name'] for g in obj['genres']]) if obj['genres'] else None
        movie.language = obj['original_language'] if obj['original_language'] else None
        movie.released = datetime.strptime(obj['release_date'], '%Y-%m-%d') if obj['release_date'] != '' else None
        movie.runtime = obj['runtime'] if obj['runtime'] else None
        movie.actors = ', '.join([a['name'] for a in obj['credits']['cast'] if a['gender'] > 0])
        movie.director = ', '.join([c['name'] for c in obj['credits']['crew'] if c['job'] == 'Director'])
        #
        movie.poster = obj['poster_path'] if obj['poster_path'] else None
        movie.posterWidth = 780
        movie.posterHeight = 1170
        imgs = obj.get('images', {}).get('posters', [])
        if len(imgs): #pylint: disable=C1801
            imgs = sorted(imgs, key=operator.itemgetter('vote_average'), reverse=True)
            movie.poster = imgs[0]['file_path']
            movie.posterWidth = imgs[0]['width']
            movie.posterHeight = imgs[0]['height']
        # done
        movie.updated = datetime.now()
        if not exists:
            db.add(movie)
        db.commit()
        app.logger.info('updated %r', movie)
    except Exception as err:
        app.logger.error('update failed for %r: %r', movie, err)
        db.rollback()
        movie.error = str(err)


def get_metadata(movie, forceRefresh=False):
    mid = movie['imdb_id']
    rec = get_db().query(Movie).filter(Movie.imdb_id == mid).first()
    if rec is None:
        rec = Movie(mid)
    if forceRefresh or rec.is_old():
        update_from_tmdb(rec)
    '''
    if (forceRefresh or rec.is_old()) and ((next((m for m in movie_queue if m.imdb_id == mid), None)) is None):
        movie_queue.put(rec)
    '''
    movie.update(row2dict(rec))
    movie['rating'] = movie.get('rating', 0)
    movie['missing'] = movie['watchlist'] and rec.released is not None and not movie['collected']\
        and not movie['watched'] and datetime.now() > rec.released
    return movie


def get_movie(imdb_id, forceRefresh):
    app.logger.debug('get_movie: imdb_id=%s', imdb_id)
    obj = read_from_uoccin(imdb_id)
    if obj is None:
        return []
    return [get_metadata(dict({'imdb_id': imdb_id}, **obj), forceRefresh)]


def get_movlst(watchlist=None, collected=None, missing=None, watched=None):
    app.logger.debug('get_movlst: watchlist=%s, collected=%s, missing=%s, watched=%s',
        watchlist, collected, missing, watched)
    res = []
    for mid, itm in get_uf().get('movies', {}).iteritems():
        if ((watchlist is None or itm['watchlist'] == watchlist) and
            (collected is None or itm['collected'] == collected) and
                (watched is None or itm['watched'] == watched)):
            obj = get_metadata(dict({'imdb_id': mid}, **itm))
            if (missing is None or obj['missing'] == missing):
                res.append(obj)
    return res


def set_movie(imdb_id, watchlist=None, collected=None, watched=None, rating=None):
    app.logger.debug('set_movie: imdb_id=%s, watchlist=%s, collected=%s, watched=%s, rating=%s',
        imdb_id, watchlist, collected, watched, rating)
    movobj = read_from_uoccin(imdb_id)
    if movobj is None:
        movobj = {
            'watchlist': False,
            'collected': False,
            'watched': False,
            'rating': 0
        }
    movrec = get_metadata(dict({'imdb_id': imdb_id}, **movobj))
    movobj['name'] = movrec['name']

    if watchlist is not None:
        movrec['watchlist'] = movobj['watchlist'] = watchlist
        if watchlist:
            movrec['watched'] = movobj['watched'] = False
            movrec['rating'] = movobj['rating'] = 0
    if collected is not None:
        movrec['collected'] = movobj['collected'] = collected
        if collected:
            movrec['watchlist'] = movobj['watchlist'] = False
        else:
            movrec['subtitles'] = movobj['subtitles'] = []
    if watched is not None:
        movrec['watched'] = movobj['watched'] = watched
        if watched:
            movrec['watchlist'] = movobj['watchlist'] = False
        else:
            movrec['rating'] = movobj['rating'] = 0
    if rating is not None:
        movrec['rating'] = movobj['rating'] = rating if rating <= 5 else 5

    uf = get_uf()
    uf.setdefault('movies', {})[imdb_id] = movobj

    if not (movrec['watchlist'] or movrec['collected'] or movrec['watched']):
        del uf['movies'][imdb_id]
    elif movrec['rating'] < 0:
        uf.setdefault('banned', []).append(imdb_id)
        del uf['movies'][imdb_id]
        movrec['banned'] = True
    elif imdb_id in uf.get('banned', []):
        uf['banned'].remove(imdb_id)

    save_uf(uf)
    return [movrec]

def cleanup_movies():
    app.logger.debug('cleanup_movies...')
    db = get_db()
    uf = get_uf()
    try:
        purge = []
        for mid, mobj in uf.setdefault('movies', {}).iteritems():
            if not (mobj['watchlist'] or mobj['collected'] or mobj['watched']):
                purge.append(mid)
        for mrec in db.query(Movie).all():
            if mrec.imdb_id not in purge and uf.get('movies', {}).get(mrec.imdb_id, None) is None:
                purge.append(mrec.imdb_id)
        if not purge:
            return 0
        for mid in purge:
            db.query(Movie).filter(Movie.imdb_id == mid).delete()
            try:
                del uf['movies'][mid]
            except Exception:
                pass
        db.commit()
        save_uf(uf)
        app.logger.info('cleanup_movies done: %d deleted titles', len(purge))
        return len(purge)
    except Exception as err:
        app.logger.error('cleanup_movies failed: %r', err)
        db.rollback()
        raise err
