# encoding: utf-8
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Movie(Base):
    __tablename__ = 'movies'
    tmdb_id = Column(String, primary_key=True)
    imdb_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    year = Column(Integer)
    plot = Column(String)
    poster = Column(String)
    actors = Column(String)
    director = Column(String)
    released = Column(DateTime)
    updated = Column(DateTime)

    def __repr__(self):
        return '<Movie %r>' % (self.name)

class Series(Base):
    __tablename__ = 'series'
    tvdb_id = Column(Integer, primary_key=True)
    imdb_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    year = Column(Integer)
    plot = Column(String)
    poster = Column(String)
    banner = Column(String)
    actors = Column(String)
    network = Column(String)
    status = Column(String)
    updated = Column(DateTime)

    def __repr__(self):
        return '<Series %r>' % (self.name)

class Episode(Base):
    __tablename__ = 'episodes'
    tvdb_id = Column(Integer, primary_key=True)
    imdb_id = Column(String, unique=True)
    series = Column(Integer, ForeignKey('series.tvdb_id'), nullable=False)
    season = Column(Integer, nullable=False)
    episode = Column(Integer, nullable=False)
    title = Column(String)
    plot = Column(String)
    thumb = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    updated = Column(DateTime)

    def __repr__(self):
        return '<Episode S%02dE%02d>' % (self.season, self.episode)

def connect_db(filename):
    engine = create_engine('sqlite:///' + filename, convert_unicode=True)
    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    Base.query = db_session.query_property()
    Base.metadata.create_all(bind=engine)
    return db_session
