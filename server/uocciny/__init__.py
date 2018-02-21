# encoding: utf-8
import os
import sys
import json
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify, g
from flask_cors import CORS

#from throttle import throttle


# questa classe serve solo in IIS
class PrefixMiddleware(object):
    def __init__(self, wsgi_app, prefix=''):
        self.app = wsgi_app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            environ['SCRIPT_NAME'] = self.prefix
            return self.app(environ, start_response)
        else:
            start_response('404', [('Content-Type', 'text/plain')])
            return ["This url does not belong to the app.".encode()]


# creazione servizio
app = Flask(__name__)

# la configurazione può essere definita in tanti modi
# app.config.from_object('config')
app.config.from_envvar('UOCCINY', silent=True)
app.config.update(UOCCINY_DB=os.environ.get("UOCCINY_DB"))
app.config.update(UOCCIN_PATH=os.environ.get("UOCCIN_PATH"))
app.config.update(TVDB_API_KEY=os.environ.get("TVDB_API_KEY"))
app.config.update(TMDB_API_KEY=os.environ.get("TMDB_API_KEY"))

# di solito non mi interessa fare debug dal browser
app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False

# quando il servizio gira in IIS è sempre in una directory virtuale, quindi bisogna gestire la porzione di path "non
# prevista" prima che le rule di werkzeug diano 404 perchè non sanno come mappare le richieste.
if 'ISS_VIRTUALFOLDER' in app.config:
    app.wsgi_app = PrefixMiddleware(
        app.wsgi_app, prefix='/' + app.config['ISS_VIRTUALFOLDER'])

# CORS forse dovrebbe essere opzionale, cmq...
CORS(app, resources=r'/*')
logging.getLogger('flask_cors').level = logging.DEBUG


def get_uf():
    uf = getattr(g, '_uoccinfile', None)
    if uf is None:
        with open(os.path.join(app.config['UOCCIN_PATH'], 'uoccin.json')) as f:
            uf = g._uoccinfile = json.load(f)
    return uf


###@throttle(10)

def save_uf():
    with open(os.path.join(app.config['UOCCIN_PATH'], 'uoccin.json'), 'w+') as f:
        json.dump(get_uf(), f, indent=4, separators=(',', ': '), sort_keys=True)


@app.teardown_appcontext
def teardown_db(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


@app.before_request
def before_request():
    app.logger.debug(request)


@app.after_request
def after_request(response):
    if response.status_code == 200:
        app.logger.debug(len(response.data))
    else:
        app.logger.warning(response)
    return response


@app.errorhandler(500)
def handle_internal_error(err):
    app.logger.error(err)
    return jsonify({'status': 500, 'result': str(err)}), 200


from movies import get_movie, get_movie_list, set_movie
from series import get_series, get_series_list, get_episode, get_episode_list, set_series, set_season, set_episode


@app.route('/')
def index():
    return 'Uocciny server'


@app.route('/movies', methods=['GET', 'OPTIONS'])
def view_movies():
    imdb_id = request.args.get('imdb_id', None)
    res = get_movie(imdb_id) if imdb_id\
        else get_movie_list(
            watchlist=prm2bool(request.args, 'watchlist'),
            collected=prm2bool(request.args, 'collected'),
            watched=prm2bool(request.args, 'watched'),
        )
    return jsonify({'status': 200, 'result': res})


@app.route('/series', methods=['GET', 'OPTIONS'])
def view_series():
    tvdb_id = prm2int(request.args, 'tvdb_id')
    res = get_series(tvdb_id) if tvdb_id\
        else get_series_list(
            watchlist=prm2bool(request.args, 'watchlist'),
            collected=prm2bool(request.args, 'collected'),
            missing=prm2bool(request.args, 'missing'),
            available=prm2bool(request.args, 'available'),
        )
    return jsonify({'status': 200, 'result': res})


@app.route('/episodes', methods=['GET', 'OPTIONS'])
def view_episodes():
    tvdb_id = prm2int(request.args, 'tvdb_id')
    res = get_episode(tvdb_id) if tvdb_id\
        else get_episode_list(
            int(request.args['series']), ## obbligatorio
            season=prm2int(request.args, 'season'),
            episode=prm2int(request.args, 'episode'),
            watched=prm2bool(request.args, 'watched'),
            collected=prm2bool(request.args, 'collected'),
        )
    return jsonify({'status': 200, 'result': res})


@app.route('/uoccinfile', methods=['GET', 'OPTIONS'])
def view_uof():
    return jsonify({'status': 200, 'result': get_uf()})


@app.route('/movie', methods=['POST'])
def upd_movie():
    prms = json.loads(request.data) ## arriva come stringa.
    set_movie(
        int(prms['imdb_id']),
        watchlist=prm2bool(prms, 'watchlist'),
        collected=prm2bool(prms, 'collected'),
        watched=prm2bool(prms, 'watched'),
        rating=prm2int(prms, 'rating')
    )
    return jsonify({'status': 200, 'result': 'OK'})


@app.route('/series', methods=['POST'])
def upd_series():
    prms = json.loads(request.data) ## arriva come stringa.
    set_series(
        int(prms['tvdb_id']),
        watchlist=prm2bool(prms, 'watchlist'),
        rating=prm2int(prms, 'rating')
    )
    return jsonify({'status': 200, 'result': 'OK'})


@app.route('/season', methods=['POST'])
def upd_season():
    prms = json.loads(request.data) ## arriva come stringa.
    set_season(
        int(prms['tvdb_id']),
        int(prms['season']),
        collected=prm2bool(prms, 'collected'),
        watched=prm2bool(prms, 'watched')
    )
    return jsonify({'status': 200, 'result': 'OK'})


@app.route('/episode', methods=['POST'])
def upd_episode():
    prms = json.loads(request.data) ## arriva come stringa.
    set_episode(
        int(prms['tvdb_id']),
        int(prms['season']),
        int(prms['episode']),
        collected=prm2bool(prms, 'collected'),
        watched=prm2bool(prms, 'watched')
    )
    return jsonify({'status': 200, 'result': 'OK'})


def prm2bool(args, name):
    if name not in args:
        return None
    if args[name] == '1':
        return True
    if args[name] == '0':
        return False
    raise Exception('Invalid value for parameter "%s": "%s"' % (name, args[name]))


def prm2int(args, name):
    if name not in args:
        return None
    try:
        return int(args[name])
    except Exception:
        raise Exception('Invalid value for parameter "%s": "%s"' % (name, args[name]))


if __name__ == '__main__':
    # il debugger di VSCode non funziona se app.debug=True, ma i messaggi di debug vengono registrati
    # solo in quel caso, quindi il log su file lo usiamo solo quando l'app viene lanciata da prompt.
    fromShell = len(sys.argv) > 1
    if fromShell:
        logfmt = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        logrfh = RotatingFileHandler('uocciny.log', maxBytes=5*1024*1024, backupCount=2)
        logrfh.setLevel(logging.DEBUG if sys.argv[1] == 'DEBUG' else logging.INFO)
        logrfh.setFormatter(logfmt)
        app.logger.addHandler(logrfh)
    app.run(port=5000, debug=fromShell)
