from datetime import datetime
import operator
import tmdbsimple as tmdb

tmdb.API_KEY = '4cb75e343ed38c533e19f547c44cf5d0'
res = tmdb.Movies('tt0092086').info(language='en', append_to_response='credits,images')

print ', '.join([g['name'] for g in res['genres']]) if res['genres'] else None
print datetime.strptime(res['release_date'], '%Y-%m-%d') if res['release_date'] != '' else None

cast = res['credits']['cast']
print ', '.join([a['name'] for a in cast if a['gender'] > 0])

crew = res['credits']['crew']
print ', '.join([c['name'] for c in crew if c['job'] == 'Director'])

imgs = res.get('images', {}).get('posters', [])

sorted(imgs, key=itemgetter('vote_count'), reverse=True)


print res['production_countries']
print res['original_language']
print res['spoken_languages']
print res['vote_count']
print res['vote_average']
print res['popularity']
print res['runtime']

