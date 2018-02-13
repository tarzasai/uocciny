# encoding: utf-8
import os
from flask import g
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        fn = os.environ.get("UOCCINY_DB")
        engine = create_engine('sqlite:///' + fn, convert_unicode=True)
        #if not os.path.exists(fn):
        Base.metadata.create_all(bind=engine)
        g._database = db = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    return db

row2dict = lambda r: {c.name: unicode(getattr(r, c.name)) for c in r.__table__.columns}

'''
def row2dict(row):
    d = {}
    for column in row.__table__.columns:
        #d[column.name] = str(getattr(row, column.name))
        d[column.name] = unicode(getattr(row, column.name))
    return d
'''

'''
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
    status = Column(String)
    network = Column(String)
    firstAired = Column(DateTime)
    updated = Column(DateTime)

    def __repr__(self):
        return '<Series %r>' % (self.name)

class Episode(Base):
    __tablename__ = 'episode'
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
    firstAired = Column(DateTime)
    updated = Column(DateTime)

    def __repr__(self):
        return '<Episode S%02dE%02d>' % (self.season, self.episode)

def connect_db(filename):
    engine = create_engine('sqlite:///' + filename, convert_unicode=True)
    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    Base.query = db_session.query_property()
    Base.metadata.create_all(bind=engine)
    return db_session
'''