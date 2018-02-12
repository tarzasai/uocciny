# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean
from database import Base
import tmdbsimple as tmdb


class Movie(Base):
    __tablename__ = 'movie'

    tmdb_id = Column(String, primary_key=True)
    imdb_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    poster = Column(String)
    actors = Column(String)
    director = Column(String)
    released = Column(DateTime)
    updated = Column(DateTime)

    def __init__(self, tmdb_id=None, imdb_id=None):
        self.tmdb_id = tmdb_id
        self.imdb_id = imdb_id

    def __repr__(self):
        return '<Movie %r>' % (self.name)
    
    def older_than(self, max_age):
        return (datetime.now() - self.updated.python_type).total_seconds() > max_age
    
    def update_from_tmdb(self):
        from uocciny import app
        mid = self.tmdb_id if self.tmdb_id is not None else self.imdb_id
        app.logger.debug('looking for movie id %s...' % str(mid))
        res = tmdb.Movies(mid).info(language='en', append_to_response='credits')
        app.logger.debug('movie found: ' + res['title'])
        self.tmdb_id = res['tmdb_id']
        self.imdb_id = res['imdb_id']
        self.name = res['title']
        self.plot = res['overview']
        self.poster = res['poster_path']
        cast = res['credits']['cast']
        self.actors = ', '.join([a['name'] for a in cast if a['gender'] > 0])
        crew = res['credits']['crew']
        self.director = ', '.join([c['name'] for c in crew if c['job'] == 'Director'])
        self.released = res['release_date']
        self.updated.python_type = datetime.now()


def get_movie(tmdb_id=None, imdb_id=None):

    from uocciny import app, get_db
    MAX_AGE = app.config.get('MAX_AGE_MOVIES', 1000 * 60 * 60 * 24 * 30) ## default 30 giorni
    db = get_db()

    res = []

    if tmdb_id is not None:
        m = Movie.query.filter(Movie.tmdb_id == tmdb_id).first()
        if m is None:
            m = Movie(tmdb_id = tmdb_id)
            m.update_from_tmdb()
        res.append(m)

    elif imdb_id is not None:
        m = Movie.query.filter(Movie.imdb_id == imdb_id).first()
        if m is None:
            m = Movie(imdb_id = imdb_id)
            m.update_from_tmdb()
        res.append(m)

    return res


def get_movies(watchlist=None, collected=None, watched=None):
    pass


def check_and_update(movie, max_age):
    if movie.tmdb_id is None or movie.imdb_id is None or movie.released is None or movie.older_than(max_age):
        mid = movie.tmdb_id if movie.tmdb_id is not None else movie.imdb_id
        app.logger.debug('looking for movie id %s...' % str(mid))
        res = tmdb.Movies(mid).info(language='en', append_to_response='credits')
        app.logger.debug('movie found: ' + res['title'])
        movie.tmdb_id = res['tmdb_id']
        movie.imdb_id = res['imdb_id']
        movie.name = res['title']
        movie.plot = res['overview']
        movie.poster = res['poster_path']
        cast = res['credits']['cast']
        movie.actors = ', '.join([a['name'] for a in cast if a['gender'] > 0])
        crew = res['credits']['crew']
        movie.director = ', '.join([c['name'] for c in crew if c['job'] == 'Director'])
        movie.released = res['release_date']
        movie.updated.python_type = datetime.now()
        return True
    return False
