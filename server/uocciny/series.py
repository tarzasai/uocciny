# encoding: utf-8
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from tvdb_client import ApiV2Client

from uocciny import app, get_uf, save_uf
from database import Base, get_db, row2dict


class Series(Base):
    __tablename__ = 'series'

    tvdb_id = Column(Integer, primary_key=True)
    imdb_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    plot = Column(String)
    actors = Column(String)
    genres = Column(String)
    status = Column(String)
    network = Column(String)
    airsDay = Column(Integer)
    runtime = Column(Integer)
    firstAired = Column(DateTime)
    poster = Column(String)
    banner = Column(String)
    updated = Column(DateTime)
    episodes = relationship('Episode', backref="parent", passive_deletes=True)

    def __repr__(self):
        return '<Series %d - %s>' % (self.tvdb_id, self.name if self.name else 'N/A')
    
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
    
    series = Column(Integer, ForeignKey('series.tvdb_id', ondelete='CASCADE'), nullable=False)
    tvdb_id = Column(Integer, primary_key=True)
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
        return '<Episode %d.S%02dE%02d (%d)>' % (self.series, self.season, self.episode, self.tvdb_id)
    
    def aired(self):
        return self.firstAired is not None and (datetime.now() - self.firstAired).days > 0
    
    def collected(self):
        series = read_from_uoccin(self.series)
        return series is not None and (str(self.episode) in series.get('collected', {}).get(str(self.season), {}))
    
    def watched(self):
        series = read_from_uoccin(self.series)
        return series is not None and (self.episode in series['watched'].get(str(self.season), []))
    
    def missing(self):
        series = read_from_uoccin(self.series)
        return series is not None and self.aired() and not (self.collected() or self.watched())
    
    def subtitles(self):
        series = read_from_uoccin(self.series)
        return series['collected'].get(str(self.season), {}).get(str(self.episode), []) if series else None

Index('idx_episode_sse', Episode.series, Episode.season, Episode.episode)

    
def read_from_uoccin(series):
    return get_uf().get('series', {}).get(str(series), None)


def read_from_tvdb(tvdb_id):
    tvdb = ApiV2Client(None, app.config['TVDB_API_KEY'], None, language='en')
    tvdb.login()
    show = tvdb.get_series(tvdb_id)
    app.logger.debug('find_series: ' + (show['data']['seriesName'] if 'data' in show else show['message']))
    return tvdb, show.get('data', None)


def update_from_tvdb(series):
    app.logger.info('updating %r...' % series)
    exists = series.updated is not None
    db = get_db()
    try:
        tvdb, show = read_from_tvdb(series.tvdb_id)
        if show is None:
            raise Exception('series %s not found on TVDB' % series.tvdb_id)
        series.imdb_id = show['imdbId'] if show['imdbId'] else None
        series.name = show['seriesName']
        series.plot = show['overview'] if show['overview'] else None
        series.status = show['status'] if show['status'] else None
        series.banner = show['banner'] if show['banner'] else None
        series.genres = ', '.join([g for g in show['genre']]) if show['genre'] else None
        series.network = show['network'] if show['network'] else None
        series.firstAired = datetime.strptime(show['firstAired'], '%Y-%m-%d') if show['firstAired'] else None
        act = tvdb.get_series_actors(series.tvdb_id).get('data', [])
        series.actors = ', '.join([a['name'] for a in act]) if act else None
        pst = tvdb.get_series_images(series.tvdb_id, image_type='poster').get('data', [])
        if pst:
            pst.sort(key=lambda x: x['ratingsInfo']['count'], reverse=True)
        series.poster = pst[0]['fileName'] if pst else None
        series.updated = datetime.now()
        if not exists:
            db.add(series)
        # episodes
        db.query(Episode).filter(Episode.series == series.tvdb_id).delete()
        eps = tvdb.get_series_episodes(series.tvdb_id)
        while eps['data']:
            for ep in eps['data']:
                eid = int(ep['id'])
                if ep['airedSeason'] == 0 or ep['airedEpisodeNumber'] == 0:
                    continue
                episode = Episode()
                episode.series = series.tvdb_id
                episode.tvdb_id = ep['id'] ## tvdb_id
                episode.season = ep['airedSeason']
                episode.episode = ep['airedEpisodeNumber']
                episode.title = ep['episodeName'] if ep['episodeName'] else None
                episode.plot = ep['overview'] if ep['overview'] else None
                episode.firstAired = datetime.strptime(ep['firstAired'], '%Y-%m-%d') if ep['firstAired'] else None
                db.add(episode)
                try:
                    app.logger.info('updating %r...' % episode)
                    ep = tvdb.get_episode(eid)['data']
                    episode.imdb_id = ep['imdbId'] if ep['imdbId'] else None
                    episode.writers = ', '.join(ep['writers']) if ep['writers'] else None
                    episode.director = ep['director'] if ep['director'] else None
                    episode.guestStars = ', '.join(ep['guestStars']) if ep['guestStars'] else None
                    episode.thumbnail = ep['filename'] if ep['filename'] else None
                    episode.thumbwidth = int(ep['thumbWidth']) if ep['thumbWidth'] else None
                    episode.thumbheight = int(ep['thumbHeight']) if ep['thumbHeight'] else None
                    episode.updated = datetime.now()
                    app.logger.debug('%r updated.' % episode)
                except Exception as err:
                    app.logger.error('update failed for %r: %s' % (episode, str(err)))
            if eps['links']['next']:
                eps = tvdb.get_series_episodes(series.tvdb_id, page=eps['links']['next'])
            else:
                break
        # done
        db.commit()
        app.logger.info('%r updated.' % series)
    except Exception as err:
        app.logger.error('update failed for %r: %s' % (series, str(err)))
        db.rollback()
        series.error = str(err)


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
    series['rating'] = series.get('rating', 0)
    # season list
    series['seasons'] = []
    for rec in get_db().query(Episode).filter(Episode.series == sid)\
        .distinct(Episode.season).group_by(Episode.season).all():
        series['seasons'].append(rec.season)
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
        ep['subtitles'] = rec.subtitles()
        if rec.aired() or rec.collected():
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
    if series['collected'] and series['episodes']['summary']['available'] <= 0:
        n = 0
        for s in series['collected']:
            for e in series['collected'][s]:
                if int(e) not in series.get('watched', {}).get(s, []):
                    n += 1
        series['episodes']['summary']['available'] = n
    return series


def get_series(tvdb_id):
    app.logger.debug('get_series: tvdb_id=%s' % tvdb_id)
    obj = read_from_uoccin(tvdb_id)
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
            obj = get_metadata(dict({'tvdb_id': int(sid)}, **itm))
            if ((missing is None or (obj['watchlist'] and missing == (obj['episodes']['summary']['missing'] > 0))) and
                (available is None or available == (obj['episodes']['summary']['available'] > 0))):
                res.append(obj)
    return res


def get_episode(tvdb_id):
    app.logger.debug('get_episode: tvdb_id=%d' % tvdb_id)
    rec = get_db().query(Episode).filter(Episode.tvdb_id == tvdb_id).first()
    return dict({'collected':rec.collected(), 'watched':rec.watched()}, **row2dict(rec))


def get_episode_list(series, season=None, episode=None, collected=None, watched=None):
    app.logger.debug('get_episode_list: series=%s, season=%s, episode=%s, collected=%s, watched=%s' %
        (series, season, episode, collected, watched))
    res = []
    for rec in get_db().query(Episode).filter(Episode.series == series).order_by(Episode.season, Episode.episode).all():
        if (season is None or (rec.season == season and (episode is None or rec.episode == episode))) and\
            (collected is None or rec.collected() == collected) and (watched is None or rec.watched() == watched):
            res.append(dict({'collected':rec.collected(), 'watched':rec.watched(), 'subtitles':rec.subtitles()},
                **row2dict(rec)))
    return res


def set_series(tvdb_id, watchlist=None, rating=None):
    app.logger.debug('set_series: watchlist=%s, rating=%s' % (watchlist, rating))
    serobj = read_from_uoccin(tvdb_id)
    if serobj is None:
        serobj = {
            'watchlist': False,
            'collected': {},
            'watched': {},
            'rating': 0
        }
    serrec = get_metadata(dict({'tvdb_id': tvdb_id}, **serobj))
    serobj['name'] = serrec['name']

    if watchlist is not None:
        serrec['watchlist'] = serobj['watchlist'] = watchlist
    if rating is not None:
        serrec['rating'] = serobj['rating'] = rating if rating <= 5 else 5
    
    uf = get_uf()
    uf.setdefault('series', {})[str(tvdb_id)] = serobj

    if serrec['rating'] < 0:
        uf.setdefault('banned', []).append(tvdb_id)
        del uf['series'][str(tvdb_id)]
        serrec['banned'] = True
    elif tvdb_id in uf.get('banned', []):
        uf['banned'].remove(tvdb_id)

    save_uf(uf)
    return [serrec]


def set_season(tvdb_id, season, collected=None, watched=None):
    app.logger.debug('set_season: tvdb_id=%s, season=%s, collected=%s, watched=%s' %
        (tvdb_id, season, collected, watched))
    return []


def set_episode(tvdb_id, season, episode, collected=None, watched=None):
    app.logger.debug('set_episode: tvdb_id=%s, season=%s, episode=%s, collected=%s, watched=%s' %
        (tvdb_id, season, episode, collected, watched))
    serobj = read_from_uoccin(tvdb_id)
    if serobj is None:
        serobj = {
            'watchlist': False,
            'collected': {},
            'watched': {},
            'rating': 0
        }
    serrec = get_metadata(dict({'tvdb_id': tvdb_id}, **serobj))
    serobj['name'] = serrec['name']

    if get_db().query(Episode).filter(Episode.series == tvdb_id, Episode.season == season,
        Episode.episode == episode).first() is not None:
        if collected is not None:
            coll = serobj['collected'].setdefault(str(season), {})
            if collected:
                coll.setdefault(str(episode), [])
            elif str(episode) in coll:
                del coll[str(episode)]
                if not serobj['collected'][str(season)]:
                    del serobj['collected'][str(season)]
        if watched is not None:
            seen = serobj['watched'].setdefault(str(season), [])
            if watched:
                seen.append(episode)
            elif episode in seen:
                seen.remove(episode)
                if not serobj['watched'][str(season)]:
                    del serobj['watched'][str(season)]
        serrec = get_metadata(dict({'tvdb_id': tvdb_id}, **serobj))
    
    uf = get_uf()
    uf.setdefault('series', {})[str(tvdb_id)] = serobj
    save_uf(uf)
    return [serrec]
