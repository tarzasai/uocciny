# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from tvdb_client import ApiV2Client

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
    genres = Column(String)
    updated = Column(DateTime)
    episodes = relationship('Episode', backref="parent", passive_deletes=True)

    def __repr__(self):
        return '<Series %s - %s>' % (self.tvdb_id, self.name if self.name else 'N/A')
    
    def is_old(self):
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
    
    def is_new(self):
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
        return '<Episode %s - %s.S%02dE%02d>' % (self.tvdb_id, self.series, self.season, self.episode)
    
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

Index('idx_episode_sse', Episode.series, Episode.season, Episode.episode)


def update_from_tvdb(series):
    app.logger.info('updating %r...' % series)
    exists = series.updated is not None
    try:
        db = get_db()
        tvdb = ApiV2Client(None, app.config['TVDB_API_KEY'], None, language='en')
        tvdb.login()
        sid = int(series.tvdb_id)
        show = tvdb.get_series(sid)['data']
        series.imdb_id = show['imdbId'] if show['imdbId'] else None
        series.name = show['seriesName']
        series.plot = show['overview'] if show['overview'] else None
        series.network = show['network'] if show['network'] else None
        series.status = show['status'] if show['status'] else None
        series.banner = show['banner'] if show['banner'] else None
        series.genres = ', '.join([g for g in show['genre']]) if show['genre'] else None
        series.firstAired = datetime.strptime(show['firstAired'], '%Y-%m-%d') if show['firstAired'] else None
        act = tvdb.get_series_actors(sid)['data']
        series.actors = ', '.join([a['name'] for a in act]) if act else None
        pst = tvdb.get_series_images(sid, image_type='poster')['data']
        if pst:
            pst.sort(key=lambda x: x['ratingsInfo']['count'], reverse=True)
        series.poster = pst[0]['fileName'] if pst else None
        series.updated = datetime.now()
        if not exists:
            db.add(series)
        # episodes
        db.query(Episode).filter(Episode.series == series.tvdb_id).delete()
        eps = tvdb.get_series_episodes(sid)
        while eps['data']:
            for ep in eps['data']:
                eid = int(ep['id'])
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
                    app.logger.info('updating %r...' % (episode))
                    ep = tvdb.get_episode(eid)['data']
                    episode.imdb_id = ep['imdbId'] if ep['imdbId'] else None
                    episode.writers = ', '.join(ep['writers']) if ep['writers'] else None
                    episode.director = ep['director'] if ep['director'] else None
                    episode.guestStars = ', '.join(ep['guestStars']) if ep['guestStars'] else None
                    episode.thumbnail = ep['filename'] if ep['filename'] else None
                    episode.thumbwidth = int(ep['thumbWidth']) if ep['thumbWidth'] else None
                    episode.thumbheight = int(ep['thumbHeight']) if ep['thumbHeight'] else None
                    episode.updated = datetime.now()
                    app.logger.debug('%r updated.' % (episode))
                except Exception as err:
                    app.logger.error('update failed for %r: %s' % (episode, str(err)))
            if eps['links']['next']:
                eps = tvdb.get_series_episodes(sid, page=eps['links']['next'])
            else:
                break
        # done
        db.commit()
        app.logger.info('%r updated.' % (series))
    except Exception as err:
        app.logger.error('update failed for %r: %s' % (series, str(err)))
        db.rollback()
        series.name = 'Update error'
        series.plot = str(err)


def get_metadata(series):
    sid = series['tvdb_id']
    rec = get_db().query(Series).filter(Series.tvdb_id == sid).first()
    if rec is None:
        rec = Series()
        rec.tvdb_id = sid
    if rec.is_old():
        update_from_tvdb(rec)
    series.update(row2dict(rec))
    series['new'] = rec.is_new()
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
    for rec in get_db().query(Episode).filter(Episode.series == sid).order_by(Episode.season, Episode.episode).all():
        ep = row2dict(rec)
        ep['collected'] = rec.collected()
        ep['watched'] = rec.watched()
        if rec.aired():
            series['episodes']['summary']['aired'] += 1
            series['episodes']['lastAired'] = ep
            if rec.missing():
                series['episodes']['summary']['missing'] += 1
                if series['episodes']['missing'] is None:
                    series['episodes']['missing'] = ep
            elif rec.collected() and not rec.watched():
                series['episodes']['summary']['available'] += 1
                if series['episodes']['available'] is None:
                    series['episodes']['available'] = ep
        elif series['episodes']['upcoming'] is None:
            series['episodes']['upcoming'] = ep
    return series


def get_series(tvdb_id):
    app.logger.debug('get_series: tvdb_id=%s' % tvdb_id)
    obj = get_uf().get('series', {}).get(tvdb_id, None)
    if obj is None:
        return []
    return [get_metadata(dict({'tvdb_id': tvdb_id}, **obj))]


def get_series_list(watchlist=None, collected=None, missing=None, available=None):
    app.logger.debug('get_series_list: watchlist=%s, collected=%s, missing=%s, available=%s' %
        (watchlist, collected, missing, available))
    if available == True:
        collected = True
    res = []
    for sid, itm in get_uf().get('series', {}).iteritems():
        if ((watchlist is None or watchlist == itm['watchlist']) and
            (collected is None or collected == (len(itm['collected']) > 0))):
            obj = get_metadata(dict({'tvdb_id': sid}, **itm))
            if ((missing is None or missing == (obj['episodes']['summary']['missing'] > 0)) and
                (available is None or available == (obj['episodes']['summary']['available'] > 0))):
                res.append(obj)
    return res


def get_episode(tvdb_id):
    app.logger.debug('get_episode: tvdb_id=%s' % tvdb_id)
    rec = get_db().query(Episode).filter(Episode.tvdb_id == tvdb_id).first()
    return dict({'collected':rec.collected(), 'watched':rec.watched()}, **row2dict(rec))


def get_episode_list(series, season=None, episode=None, collected=None, watched=None):
    app.logger.debug('get_episode_list: series=%s, season=%s, episode=%s, collected=%s, watched=%s' %
        (series, season, episode, collected, watched))
    res = []
    for rec in get_db().query(Episode).filter(Episode.series == series).order_by(Episode.season, Episode.episode).all():
        if (season is None or (rec.season == season and (episode is None or rec.episode == episode))) and\
            (collected is None or rec.collected() == collected) and (watched is None or rec.watched() == watched):
            res.append(dict({'collected':rec.collected(), 'watched':rec.watched()}, **row2dict(rec)))
    return res
