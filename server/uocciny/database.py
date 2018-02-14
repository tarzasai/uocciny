# encoding: utf-8
import os
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
        #if not os.path.exists(fn):
        Base.metadata.create_all(bind=engine)
        g._database = db = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    return db

row2dict = lambda r: {c.name: unicode(getattr(r, c.name)) for c in r.__table__.columns}

'''
def row2dict(row):
    d = {}
    for column in row.__table__.columns:
        #d[column.name] = str(getattr(row, column.name))
        d[column.name] = unicode(getattr(row, column.name))
    return d
'''
