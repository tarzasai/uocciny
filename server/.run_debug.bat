@echo off

rem working environment:
set UOCCINY_DB=C:\Workspace\uocciny\test\data.db
set UOCCIN_PATH=C:\Workspace\uocciny\test\uoccin_path
set TVDB_API_KEY=A74D017DA5F2C3B0
set TMDB_API_KEY=4cb75e343ed38c533e19f547c44cf5d0
set IMDB_USER_ID=ur31826272

python uocciny\__init__.py DEBUG
