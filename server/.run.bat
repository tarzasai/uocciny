@echo off

set FLASK_APP=uocciny
set FLASK_DEBUG=true

rem working environment:
set UOCCINY_DB=C:\Workspace\uocciny\test\data.db
set UOCCIN_PATH=C:\Workspace\uocciny\test\uoccin_path

pip install -e .
flask run
