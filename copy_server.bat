copy \\STORAGE\uocciny\server\web.config server\
del \\STORAGE\uocciny\server\*.* /q
copy server\web.config \\STORAGE\uocciny\server\
copy server\dist\uocciny-0.0.0-py2-none-any.whl \\STORAGE\uocciny\server\uoccin.whl