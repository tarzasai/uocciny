# encoding: utf-8
import json
import re
import requests

from uocciny import app, get_uf
from uocciny.movies import read_from_uoccin, set_movie


def import_imdb_watchlist():
    res = []
    for mid in get_imdb_ids():
        app.logger.debug('import_imdb_watchlist: checking title %s...', mid)
        if read_from_uoccin(mid) is None and mid not in get_uf().get('banned', []):
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
