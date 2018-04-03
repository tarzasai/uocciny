# encoding: utf-8
import json
import re
import requests
from tvdb_client import ApiV2Client

from uocciny import app, get_uf
from uocciny.series import read_from_uoccin as series_from_uoccin
from uocciny.movies import read_from_uoccin as movie_from_uoccin, set_movie


def search_tvdb_series(text):
    tvdb = ApiV2Client(None, app.config['TVDB_API_KEY'], None, language='en')
    tvdb.login()
    res = tvdb.search_series(name=text)
    if 'data' not in res:
        if res.get('code', 0) == 404:
            return []
        raise Exception(res.get('message', 'Unknown TVDB error'))
    uf = get_uf()
    for itm in res['data']:
        ser = series_from_uoccin(itm['id']) or {}
        itm['watchlist'] = ser.get('watchlist', False)
        itm['banned'] = int(itm['id']) in uf.get('banned', [])
    return res['data']


def import_imdb_watchlist():
    res = []
    for mid in get_imdb_ids():
        app.logger.debug('import_imdb_watchlist: checking title %s...', mid)
        if movie_from_uoccin(mid) is None and mid not in get_uf().get('banned', []):
            res.extend(set_movie(mid, watchlist=True))
    return res


def get_imdb_ids():
    headers = {'Accept-Language': 'en-us'}
    url = 'http://www.imdb.com/user/%s/watchlist' % app.config['IMDB_USER_ID']
    params = {'view': 'detail'}
    page = requests.get(url, params=params, headers=headers)
    if page.status_code != 200:
        raise Exception('HTTP error %d on %s' % (page.status_code, url))
    try:
        json_vars = json.loads(re.search(r'IMDbReactInitialState.push\((.+?)\);\n', page.text).group(1))
    except (TypeError, AttributeError, ValueError) as e:
        raise Exception('Unable to get imdb list from imdb react widget. Original error: %s.' % str(e))
    imdb_ids = []
    for item in json_vars.get('list', {}).get('items', {}):
        if is_valid_imdb_title_id(item.get('const')):
            imdb_ids.append(item['const'])
    return imdb_ids


def is_valid_imdb_title_id(value):
    if not isinstance(value, basestring):
        raise TypeError("is_valid_imdb_title_id expects a string but got {0}".format(type(value)))
    # IMDB IDs for titles have 'tt' followed by 7 digits
    return re.match(r'tt[\d]{7}', value) is not None
