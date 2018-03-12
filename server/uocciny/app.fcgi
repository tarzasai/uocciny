# encoding: utf-8
#!c:\python27\python.exe
from flipflop import WSGIServer
from uocciny import app

if __name__ == '__main__':
    WSGIServer(app).run()
