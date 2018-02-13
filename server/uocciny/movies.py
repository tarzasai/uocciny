# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean
from sqlalchemy.ext.declarative import declarative_base
import tmdbsimple as tmdb

from uocciny import app, get_uf
from database import Base, get_db, row2dict

MAX_AGE = app.config.get('MAX_AGE_MOVIES', 30) ## default 30 giorni

class Movie(Base):
    __tablename__ = 'movies'

    imdb_id = Column(String, primary_key=True)
    tmdb_id = Column(Integer, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    poster = Column(String)
    actors = Column(String)
    director = Column(String)
    released = Column(DateTime)
    updated = Column(DateTime)

    def __init__(self, imdb_id):
        self.imdb_id = imdb_id

    def __repr__(self):
        return '<Movie %r>' % (self.name)
    
    def older_than(self, max_age):
        return self.updated is None or (datetime.now() - self.updated).days > max_age
    
    def update_from_tmdb(self, session):
        app.logger.info('updating metadata for movie %s...' % self.imdb_id)
        try:
            exists = self.updated is not None
            res = tmdb.Movies(self.imdb_id).info(language='en', append_to_response='credits')
            self.tmdb_id = res['id']
            self.imdb_id = res['imdb_id']
            self.name = res['title']
            self.plot = res['overview']
            self.poster = res['poster_path']
            cast = res['credits']['cast']
            self.actors = ', '.join([a['name'] for a in cast if a['gender'] > 0])
            crew = res['credits']['crew']
            self.director = ', '.join([c['name'] for c in crew if c['job'] == 'Director'])
            reld = res.get('release_date', '')
            self.released = datetime.strptime(reld, '%Y-%m-%d') if reld != '' else None
            self.updated = datetime.now()
            if not exists:
                session.add(self)
            session.commit()
            app.logger.info('saved metadata for movie %s (%s)' % (self.imdb_id, res['title']))
        except Exception as err:
            app.logger.error('update failed for movie %s: %s' % (self.imdb_id, str(err)))
            self.name = 'Update error'
            self.plot = str(err)

def fill_metadata(lst):
    db = get_db()
    for itm in lst:
        mid = itm['imdb_id']
        rec = db.query(Movie).filter(Movie.imdb_id == mid).first()
        if rec is None:
            rec = Movie(mid)
        if rec.older_than(MAX_AGE):
            rec.update_from_tmdb(db)
        itm.update(row2dict(rec))
    return lst

def get_movie(imdb_id):
    app.logger.debug('get_movie: imdb_id=%s' % imdb_id)
    um = get_uf().get('movies', {}).get(imdb_id, None)
    if um is None:
        return []
    return fill_metadata([dict({'imdb_id': imdb_id}, **um)])

def get_movies(watchlist=None, collected=None, watched=None):
    app.logger.debug('get_movies: watchlist=%s, collected=%s, watched=%s' % (watchlist, collected, watched))
    lst = get_uf().get('movies', {})
    res = []
    for mid in lst.keys():
        itm = lst[mid]
        if ((watchlist is None or itm['watchlist'] == watchlist) and
            (collected is None or itm['collected'] == collected) and
            (watched is None or itm['watched'] == watched)):
            res.append(dict({'imdb_id': mid}, **itm))
    return fill_metadata(res)
