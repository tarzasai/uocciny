from tvdb_client import ApiV2Client

tvdb = ApiV2Client(None, 'A74D017DA5F2C3B0', None, language='en')
tvdb.login()
show = tvdb.get_series(83307)['data']

print show
