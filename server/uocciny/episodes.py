# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
import tvdbsimple as tvdb

from uocciny import app, get_uf
from database import Base, get_db, row2dict

MAX_AGE = app.config.get('MAX_AGE_SERIES', 30) ## default 30 giorni

class Episode(Base):
    __tablename__ = 'episodes'
    
    tvdb_id = Column(String, primary_key=True)
    imdb_id = Column(String, unique=True)
    series = Column(String, ForeignKey('series.tvdb_id'), nullable=False)
    season = Column(Integer, nullable=False)
    episode = Column(Integer, nullable=False)
    title = Column(String)
    plot = Column(String)
    thumb = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    firstAired = Column(DateTime)
    updated = Column(DateTime)

    def __init__(self, series, season, episode):
        self.series = series
        self.season = season
        self.episode = episode

    def __repr__(self):
        return '<Episode %s.S%02dE%02d>' % (self.series, self.season, self.episode)
    
    def older_than(self, max_age):
        return self.updated is None or (datetime.now() - self.updated).days > max_age
    
    def update_from_tvdb(self, session):
        app.logger.info('updating metadata for episode %s...' % self.tvdb_id)
        try:
            exists = self.updated is not None
            # ...
            # done
            self.updated = datetime.now()
            if not exists:
                session.add(self)
            session.commit()
            app.logger.info('saved metadata for episode %s (%s)' % (self.tvdb_id, self.name))
        except Exception as err:
            app.logger.error('update failed for episode %s: %s' % (self.tvdb_id, str(err)))
            self.name = 'Update error'
            self.plot = str(err)

def fill_metadata(lst):
    '''db = get_db()
    for itm in lst:
        sid = itm['tvdb_id']
        rec = db.query(Series).filter(Series.tvdb_id == sid).first()
        if rec is None:
            rec = Series(sid)
        if rec.older_than(MAX_AGE):
            rec.update_from_tvdb(db)
        itm.update(row2dict(rec))'''
    return lst

def get_episode(tvdb_id):
    app.logger.debug('get_episode: tvdb_id=%s' % tvdb_id)
    # ...
    return None

def get_episode_list(series=None, season=None, episode=None, collected=None, watched=None):
    app.logger.debug('get_episode_list: series=%s, season=%s, episode=%s, collected=%s, watched=%s' %
        (series, season, episode, collected, watched))
    # ...
    return None

