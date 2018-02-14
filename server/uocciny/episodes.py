# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean
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
            app.logger.info('saved metadata for series %s (%s)' % (self.tvdb_id, self.name))
        except Exception as err:
            app.logger.error('update failed for series %s: %s' % (self.tvdb_id, str(err)))
            self.name = 'Update error'
            self.plot = str(err)

