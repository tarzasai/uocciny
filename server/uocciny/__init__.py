# encoding: utf-8
import os
import sys
import json
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify, g
from flask_cors import CORS

from database import connect_db

# quando l'app gira in IIS è sempre in una directory virtuale, quindi
# bisogna gestire la porzione di path "non prevista" prima che le rule
# di werkzeug diano 404 perchè non sanno come mappare le richieste.
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

# creazione e configurazione servizio
app = Flask(__name__)
app.config.from_object('config')
app.config.from_envvar('UOCCINY', silent=True)
app.config.update(UOCCIN_PATH=os.environ.get("UOCCIN_PATH")) ## obbligatorio
if 'ISS_VIRTUALFOLDER' in app.config:
    app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix='/' + app.config['ISS_VIRTUALFOLDER'])
CORS(app, resources=r'/*')
logging.getLogger('flask_cors').level = logging.DEBUG


def get_uf():
    uf = getattr(g, '_uoccinfile', None)
    if uf is None:
        with open(os.path.join(app.config['UOCCIN_PATH'], 'uoccin.json')) as f:
            uf = g._uoccinfile = json.load(f)
    return uf

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_db(os.environ.get("UOCCINY_DB"))
    return db

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
        app.logger.debug(response.data)
    else:
        app.logger.debug(response)
    return response

#######################################################################################################################
## VIEWS
#######################################################################################################################

@app.route('/')
def index():
    return 'Uocciny server'

@app.route('/uof', methods=['GET', 'OPTIONS'])
def get_series():
    try:
        return jsonify({'status': 'success', 'result': get_uf()})
    except Exception as err:
        app.logger.error(err)
        return jsonify({'status': 'error', 'result': str(err)})


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
    app.run(port=8088, debug=fromShell)
