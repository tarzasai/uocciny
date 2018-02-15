# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from tvdb_client import ApiV2Client as tvdb

from uocciny import app, get_uf
from database import Base, get_db, row2dict

MAX_AGE = app.config.get('MAX_AGE_SERIES', 30) ## default 30 giorni


class Series(Base):
    __tablename__ = 'series'

    tvdb_id = Column(String, primary_key=True)
    imdb_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    network = Column(String)
    status = Column(String)
    actors = Column(String)
    firstAired = Column(DateTime)
    poster = Column(String)
    banner = Column(String)
    updated = Column(DateTime)
    episodes = relationship('Episode', backref="parent", passive_deletes=True)

    def __repr__(self):
        return '<Series %r>' % (self.tvdb_id)
    
    def outdated(self):
        if self.updated is None:
            return True
        age = (datetime.now() - self.updated).days
        if self.firstAired is None:
            return age > 7
        if (datetime.now() - self.firstAired).days <= 30:
            return age > 15
        if (datetime.now() - self.firstAired).days > (15 * 365):
            return age > 180
        return age > 30
    
    def brandnew(self):
        return self.updated is not None and (self.firstAired is None or (datetime.now() - self.firstAired).days <= 30)


class Episode(Base):
    __tablename__ = 'episodes'
    
    series = Column(String, ForeignKey('series.tvdb_id', ondelete='CASCADE'), nullable=False)
    tvdb_id = Column(String, primary_key=True)
    imdb_id = Column(String, unique=True)
    season = Column(Integer, nullable=False)
    episode = Column(Integer, nullable=False)
    firstAired = Column(DateTime)
    title = Column(String)
    plot = Column(String)
    writers = Column(String)
    director = Column(String)
    guestStars = Column(String)
    thumbnail = Column(String)
    thumbwidth = Column(Integer)
    thumbheight = Column(Integer)
    updated = Column(DateTime)

    def __repr__(self):
        return '<Episode %s.S%02dE%02d>' % (self.series, self.season, self.episode)
    
    def aired(self):
        return self.firstAired is not None and (datetime.now() - self.firstAired).days > 0
    
    def collected(self):
        series = get_uf().get('series', {}).get(self.series, None)
        return series is not None\
            and series['collected'].get(str(self.season), {}).get(str(self.episode), None) is not None
    
    def watched(self):
        series = get_uf().get('series', {}).get(self.series, None)
        return series is not None and self.aired() and (self.episode in series['watched'].get(str(self.season), []))
    
    def missing(self):
        series = get_uf().get('series', {}).get(self.series, None)
        return series is not None and self.aired() and not (self.collected() or self.watched())


def update_from_tvdb(series):
    app.logger.info('updating metadata for series %s...' % series.tvdb_id)
    try:
        db = get_db()
        exists = series.updated is not None
        show = tvdb.Series(series.tvdb_id)
        res = show.info(language='en')
        series.imdb_id = res['imdbId'] if res['imdbId'] else None
        series.name = res['seriesName']
        series.plot = res['overview'] if res['overview'] else None
        series.network = res['network'] if res['network'] else None
        series.status = res['status'] if res['status'] else None
        series.banner = res['banner'] if res['banner'] else None
        series.firstAired = datetime.strptime(res['firstAired'], '%Y-%m-%d') if res['firstAired'] else None
        act = show.actors(language='en')
        series.actors = ', '.join([a['name'] for a in act]) if act else None
        pst = tvdb.Series_Images(series.tvdb_id).poster(language='en')
        if pst:
            pst.sort(key=lambda x: x['ratingsInfo']['count'], reverse=True)
        series.poster = pst[0]['fileName'] if pst else None
        series.updated = datetime.now()
        if not exists:
            db.add(series)
        # episodes
        db.query(Episode).filter(Episode.series == series.tvdb_id).delete()
        for ep in show.Episodes.all():
            if ep['airedSeason'] == 0 or ep['airedEpisodeNumber'] == 0:
                continue
            episode = Episode()
            episode.series = series.tvdb_id
            episode.tvdb_id = ep['id'] # tvdb_id
            episode.season = ep['airedSeason']
            episode.episode = ep['airedEpisodeNumber']
            episode.title = ep['episodeName'] if ep['episodeName'] else None
            episode.plot = ep['overview'] if ep['overview'] else None
            episode.firstAired = datetime.strptime(ep['firstAired'], '%Y-%m-%d') if ep['firstAired'] else None
            db.add(episode)
            try:
                ep = tvdb.Episode(episode.tvdb_id).info(language='en')
                episode.imdb_id = ep['imdbId'] if ep['imdbId'] else None
                episode.writers = ', '.join(ep['writers']) if ep['writers'] else None
                episode.director = ep['director'] if ep['director'] else None
                episode.guestStars = ', '.join(ep['guestStars']) if ep['guestStars'] else None
                episode.thumbnail = ep['filename'] if ep['filename'] else None
                episode.thumbwidth = int(ep['thumbWidth']) if ep['thumbWidth'] else None
                episode.thumbheight = int(ep['thumbHeight']) if ep['thumbHeight'] else None
                episode.updated = datetime.now()
                app.logger.debug('updated metadata for episode %s (S%02dE%02d)' %
                    (episode.tvdb_id, episode.season, episode.episode))
            except Exception as err:
                app.logger.error('update failed for episode %s: %s' % (episode.tvdb_id, str(err)))
        # done
        db.commit()
        app.logger.info('updated metadata for series %s (%s)' % (series.tvdb_id, series.name))
    except Exception as err:
        app.logger.error('update failed for series %s: %s' % (series.tvdb_id, str(err)))
        db.rollback()
        series.name = 'Update error'
        series.plot = str(err)


def get_metadata(series):
    sid = series['tvdb_id']
    rec = get_db().query(Series).filter(Series.tvdb_id == sid).first()
    if rec is None:
        rec = Series()
        rec.tvdb_id = sid
    if rec.outdated():
        update_from_tvdb(rec)
    series.update(row2dict(rec))
    # episodes
    series['episodes'] = {
        'summary': {
            'aired': 0,
            'missing': 0,
            'available': 0,
        },
        'lastAired': None,
        'upcoming': None,
        'missing': None,
        'available': None,
    }
    eplist = get_db().query(Episode).filter(Episode.series == sid).order_by(Episode.season, Episode.episode).all()
    for ep in eplist:
        ejson = row2dict(ep)
        if ep.aired():
            series['episodes']['summary']['aired'] += 1
            series['episodes']['lastAired'] = ejson
            if ep.missing():
                series['episodes']['summary']['missing'] += 1
                if series['episodes']['missing'] is None:
                    series['episodes']['missing'] = ejson
            elif ep.collected() and not ep.watched():
                series['episodes']['summary']['available'] += 1
                if series['episodes']['available'] is None:
                    series['episodes']['available'] = ejson
        elif series['episodes']['upcoming'] is None:
            series['episodes']['upcoming'] = ejson

    return series


def get_series(tvdb_id):
    app.logger.debug('get_series: tvdb_id=%s' % tvdb_id)
    obj = get_uf().get('series', {}).get(tvdb_id, None)
    if obj is None:
        return []
    return [get_metadata(dict({'tvdb_id': tvdb_id}, **obj))]


def get_series_list(watchlist=None, collected=None):
    app.logger.debug('get_series_list: watchlist=%s, collected=%s' % (watchlist, collected))
    lst = get_uf().get('series', {})
    res = []
    for sid in lst.keys():
        itm = lst[sid]
        if ((watchlist is None or itm['watchlist'] == watchlist) and
            (collected is None or itm['collected'])):
            res.append(get_metadata(dict({'tvdb_id': sid}, **itm)))
    return res


def get_episode(tvdb_id):
    app.logger.debug('get_episode: tvdb_id=%s' % tvdb_id)
    # ...
    return None


def get_episode_list(series=None, season=None, episode=None, collected=None, watched=None):
    app.logger.debug('get_episode_list: series=%s, season=%s, episode=%s, collected=%s, watched=%s' %
        (series, season, episode, collected, watched))
    # ...
    return None
