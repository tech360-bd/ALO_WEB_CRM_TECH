"""Read-only HTTP checks against a running ALO build. Never submits a lead."""
import json
import sys
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import urlopen

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:3211'
SLUGS = ['ielts', 'ielts-ukvi', 'pte-academic', 'oietc', 'toefl-ibt', 'duolingo', 'languagecert', 'kaplan', 'oet', 'cambridge-english', 'gre', 'gmat', 'sat', 'act']
results = []
def read(path):
    with urlopen(BASE + quote(path, safe='/?=&'), timeout=60) as response:
        assert response.status == 200, (path, response.status)
        return response.read().decode()

def check(name, condition):
    assert condition, name
    results.append(name)

landing = read('/language-prep')
check('landing server renders the requested heading', 'English tests for university entry' in landing)
check('all fourteen dedicated links are rendered', all(f'href="/language-prep/{slug}"' in landing for slug in SLUGS))
check('landing contains photos and a complete comparison', '/images/landing/' in landing and 'University &amp; visa acceptance' in landing)
for slug in SLUGS:
    html = read('/language-prep/' + slug)
    check('dedicated page server renders: ' + slug, '<h1' in html and 'Preparation' in html and '/images/landing/' in html)
    payload = json.loads(read('/api/language-prep/tests/' + slug))
    check('dedicated API: ' + slug, payload.get('success') and payload.get('test', {}).get('slug') == slug)
comparison = json.loads(read('/api/language-prep/comparison'))
check('comparison API covers fourteen test families with cost', set(SLUGS).issubset({row['slug'] for row in comparison['comparison']}) and all(row.get('cost') for row in comparison['comparison']))
check('comparison route renders', '<h1' in read('/language-prep/comparison'))
for alias in ['cae', 'cpe']:
    check('Cambridge alias resolves: ' + alias, 'Cambridge' in read('/language-prep/' + alias))
try:
    read('/language-prep/unknown-not-a-real-test')
    raise AssertionError('unknown slug should return 404')
except HTTPError as error:
    check('unknown slug returns 404', error.code == 404)
print(json.dumps({'base_url': BASE, 'passed': len(results), 'checks': results, 'scope': 'Read-only HTTP and SSR checks. Browser interaction, database persistence and lead delivery are not verified.'}, indent=2))
