from setuptools import setup

setup(
    name='uocciny',
    packages=['uocciny'],
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_cors',
        'flipflop',
        'sqlalchemy',
        'tmdbsimple',
        'tvdb_client'
    ],
)
