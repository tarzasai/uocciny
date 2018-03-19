from tvdb_client import ApiV2Client

sid = 153021

tvdb = ApiV2Client(None, 'A74D017DA5F2C3B0', None, language='en')
tvdb.login()
show = tvdb.get_series(sid)['data']
print show['seriesName']


act = tvdb.get_series_actors(sid).get('data', [])
print ', '.join([a['name'] for a in act]) if act else None


pst = tvdb.get_series_images(sid, image_type='poster').get('data', [])
pst.sort(key=lambda x: x['ratingsInfo']['count'], reverse=True)
print pst[0]['fileName'] if pst else None


eps = tvdb.get_series_episodes(sid)
while eps['data']:
    for ep in eps['data']:
        if ep['airedSeason'] <= 0 or ep['airedEpisodeNumber'] <= 0:
            continue
        eid = int(ep['id'])
        ep = tvdb.get_episode(eid)['data']
        sn = ep['airedSeason']
        en = ep['airedEpisodeNumber']
        et = ep['episodeName']
        print 'S%02dE%02d: %s' % (sn, en, et)
    if eps['links']['next']:
        eps = tvdb.get_series_episodes(sid, page=eps['links']['next'])
    else:
        break

