# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean
from sqlalchemy.ext.declarative import declarative_base
import tvdbsimple as tvdb

from uocciny import app, get_uf
from database import Base, get_db, row2dict

MAX_AGE = app.config.get('MAX_AGE_SERIES', 30) ## default 30 giorni

class Series(Base):
    __tablename__ = 'series'

    tvdb_id = Column(Integer, primary_key=True)
    imdb_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    poster = Column(String)
    banner = Column(String)
    actors = Column(String)
    status = Column(String)
    network = Column(String)
    firstAired = Column(DateTime)
    updated = Column(DateTime)

    def __init__(self, tvdb_id):
        self.tvdb_id = tvdb_id

    def __repr__(self):
        return '<Series %r>' % (self.tvdb_id)
    
    def older_than(self, max_age):
        return self.updated is None or (datetime.now() - self.updated).days > max_age
    
    def update_from_tvdb(self, session):
        app.logger.info('updating metadata for series %d...' % self.tvdb_id)
        try:
            exists = self.updated is not None
            res = tvdb.Series(self.tvdb_id).info(language='en') #, append_to_response='credits')
            self.tmdb_id = res['id']
            self.tvdb_id = res['tvdb_id']
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
            app.logger.info('saved metadata for series %d (%s)' % (self.tvdb_id, res['title']))
        except Exception as err:
            app.logger.error('update failed for series %d: %s' % (self.tvdb_id, str(err)))
            self.name = 'Update error'
            self.plot = str(err)

def fill_metadata(lst):
    db = get_db()
    for itm in lst:
        sid = itm['tvdb_id']
        rec = db.query(Series).filter(Series.tvdb_id == sid).first()
        if rec is None:
            rec = Series(sid)
        if rec.older_than(MAX_AGE):
            rec.update_from_tvdb(db)
        itm.update(row2dict(rec))
    return lst
