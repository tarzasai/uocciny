# encoding: utf-8
import os
from datetime import datetime
from flask import g
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        fn = os.environ.get("UOCCINY_DB")
        engine = create_engine('sqlite:///' + fn, convert_unicode=True)
        if not os.path.exists(fn):
            Base.metadata.create_all(bind=engine)
        g._database = db = scoped_session(sessionmaker(
            autocommit=False, autoflush=False, bind=engine))
    return db


def row2dict(row):
    d = {}
    for col in row.__table__.columns:
        v = getattr(row, col.name)
        d[col.name] = v if v is None or type(v) in [int, float, bool]\
            else v.isoformat() if type(v) == datetime else unicode(v)
        '''
        if v is None:
            d[col.name] = None
        elif type(v) in [int, float, bool]:
            d[col.name] = v
        elif type(v) == datetime:
            d[col.name] = v.isoformat()
        else:
            d[col.name] = unicode(v)
        '''
    return d
