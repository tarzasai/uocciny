from tvdb_client import ApiV2Client

sid = 121361

tvdb = ApiV2Client(None, 'A74D017DA5F2C3B0', None, language='en')
tvdb.login()
show = tvdb.get_series(sid)['data']

print show['seriesName']

summ = tvdb.get_series_episodes_summary(sid)

seasons = sorted([int(s) for s in summ['data']['airedSeasons'] if int(s) > 0])

eps = tvdb.get_series_episodes(sid, aired_season=6)

