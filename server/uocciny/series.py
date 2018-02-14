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

    tvdb_id = Column(String, primary_key=True)
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
        app.logger.info('updating metadata for series %s...' % self.tvdb_id)
        try:
            exists = self.updated is not None
            show = tvdb.Series(self.tvdb_id)
            res = show.info(language='en')
            self.imdb_id = res['imdbId'] if res['imdbId'] else None
            self.name = res['seriesName']
            self.plot = res['overview'] if res['overview'] else None
            self.banner = res['banner'] if res['banner'] else None
            reld = res.get('firstAired', '')
            self.released = datetime.strptime(reld, '%Y-%m-%d') if reld else None
            # actors
            res = show.actors(language='en')
            self.actors = ', '.join([a['name'] for a in res]) if res else None
            # poster
            res = tvdb.Series_Images(self.tvdb_id).poster(language='en')
            if res:
                res.sort(key=lambda x: x['ratingsInfo']['count'], reverse=True)
            self.poster = res[0]['fileName'] if res else None
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

def get_series(tvdb_id):
    app.logger.debug('get_series: tvdb_id=%s' % tvdb_id)
    obj = get_uf().get('series', {}).get(tvdb_id, None)
    if obj is None:
        return []
    return fill_metadata([dict({'tvdb_id': tvdb_id}, **obj)])

def get_series_list(watchlist=None, collected=None):
    app.logger.debug('get_series_list: watchlist=%s, collected=%s' % (watchlist, collected))
    lst = get_uf().get('series', {})
    res = []
    for sid in lst.keys():
        itm = lst[sid]
        if ((watchlist is None or itm['watchlist'] == watchlist) and
            (collected is None or itm['collected'])):
            res.append(dict({'tvdb_id': sid}, **itm))
    return fill_metadata(res)
