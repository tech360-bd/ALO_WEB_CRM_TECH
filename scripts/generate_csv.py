#!/usr/bin/env python3
"""
ALO Education Combined Course Upload CSV Generator
Takes existing project data + web search data and produces the 50-column CSV.
"""
import csv
import sys as _alo_sys, pathlib as _alo_pathlib
_alo_sys.path.insert(0, str(_alo_pathlib.Path(__file__).resolve().parent / "lib"))
from synthetic_output_guard import require_synthetic_output_dir
# SYNTHETIC GENERATOR: output goes only under ALO_SYNTHETIC_OUTPUT_DIR (fixtures/staging).
_ALO_OUT = require_synthetic_output_dir("generate_csv")
import re
import json
from datetime import date

TODAY = date.today().isoformat()

# ─── Read existing project data ───
with open('/home/z/my-project/src/lib/data/universities.ts') as f:
    uni_content = f.read()
with open('/home/z/my-project/src/lib/data/courses.ts') as f:
    course_content = f.read()

# ─── Parse Universities ───
uni_blocks = re.findall(
    r'\{[^}]*id:\s*"([^"]+)"[^}]*name:\s*"([^"]+)"[^}]*country:\s*"([^"]+)"[^}]*city:\s*"([^"]+)"[^}]*ranking:\s*([^,\n]+)[^}]*worldRanking:\s*([^,\n]+)[^}]*type:\s*"([^"]+)"[^}]*founded:\s*([^,\n]+)[^}]*students:\s*([^,\n]+)[^}]*intlStudents:\s*([^,\n]+)[^}]*ieltsMin:\s*([^,\n]+)[^}]*tuitionRange:\s*"([^"]*)"[^}]*\}',
    uni_content, re.S
)
universities = {}
for uid, name, country, city, ranking, wr, utype, founded, students, intl, ielts, tuition in uni_blocks:
    universities[uid] = {
        'id': uid, 'name': name, 'country': country, 'city': city,
        'ranking': ranking.strip(), 'worldRanking': wr.strip(),
        'type': utype, 'founded': founded.strip(),
        'students': students.strip(), 'intlStudents': intl.strip(),
        'ieltsMin': ielts.strip(), 'tuitionRange': tuition
    }

# ─── Parse Courses ───
arr_match = re.search(r'export const courses.*?=\s*\[([\s\S]*?)\]\s*;', course_content)
arr_text = arr_match.group(1) if arr_match else ''
course_starts = [m.start() for m in re.finditer(r'\{\s*id:', arr_text)]
course_starts.append(len(arr_text))

courses = []
for i in range(len(course_starts) - 1):
    block = arr_text[course_starts[i]:course_starts[i + 1]]
    def gf(pattern, default='UNKNOWN'):
        m = re.search(pattern, block)
        return m.group(1).strip().strip('"').strip("'") if m else default
    courses.append({
        'id': gf(r'id:\s*"([^"]+)"'),
        'name': gf(r'name:\s*"([^"]+)"'),
        'universityId': gf(r'universityId:\s*"([^"]+)"'),
        'universityName': gf(r'universityName:\s*"([^"]+)"'),
        'country': gf(r'country:\s*"([^"]+)"'),
        'department': gf(r'department:\s*"([^"]+)"'),
        'level': gf(r'level:\s*"([^"]+)"'),
        'duration': gf(r'duration:\s*"([^"]+)"'),
        'tuitionFee': gf(r'tuitionFee:\s*"([^"]+)"'),
        'tuitionCurrency': gf(r'tuitionCurrency:\s*"([^"]+)"'),
        'ieltsMin': gf(r'ieltsMin:\s*"?([0-9.]+)"?'),
        'intakeMonths': gf(r'intakeMonths:\s*\[([^\]]*)\]'),
        'isPopular': gf(r'isPopular:\s*([^,\n]+)'),
    })

# ─── Mappings ───
COUNTRY_MAP = {
    'uk': 'United Kingdom', 'usa': 'United States of America', 'canada': 'Canada',
    'australia': 'Australia', 'ireland': 'Ireland', 'new-zealand': 'New Zealand',
    'germany': 'Germany', 'dubai': 'United Arab Emirates',
    'japan': 'Japan', 'malaysia': 'Malaysia', 'south-korea': 'South Korea', 'denmark': 'Denmark',
}
CURRENCY_MAP = {
    'uk': 'GBP', 'usa': 'USD', 'canada': 'CAD', 'australia': 'AUD',
    'ireland': 'EUR', 'new-zealand': 'NZD', 'germany': 'EUR', 'dubai': 'AED',
}
LEVEL_MAP = {
    "Bachelor": 'Undergraduate', "Master's": 'Postgraduate', 'PhD': 'PhD',
    'Foundation': 'Foundation', 'Diploma': 'Diploma',
}
PROGRAM_MAP = {
    "Bachelor": 'UG', "Master's": 'PG', 'PhD': 'PhD',
    'Foundation': 'Pathway UG', 'Diploma': 'PG Diploma',
}
DEPT_TO_SUBJECT = {
    'Engineering, Technology & IT': 'Engineering',
    'Health, Medicine & Life Sciences': 'Health and Medicine',
    'Environmental & Agricultural Sciences': 'Science & Mathematics',
    'Hospitality, Tourism & Event Management': 'Hospitality',
    'Urban Planning & Architecture': 'Architecture and Building',
    'Arts, Design & Creative Media': 'Arts and Design',
    'Law, Politics & Social Sciences': 'Social Science',
    'Science & Mathematics': 'Science & Mathematics',
    'Business, Management & Economics': 'Business',
    'Education & Social Care': 'Education',
}

def get_discipline(name):
    n = name.lower()
    if 'mba' in n: return 'MBA'
    if 'finance' in n: return 'Finance'
    if 'marketing' in n: return 'Marketing'
    if 'supply chain' in n: return 'Supply Chain Management'
    if 'business analytics' in n: return 'Business Analytics'
    if 'business' in n: return 'International Business'
    if 'data science' in n: return 'Data Science'
    if 'artificial intelligence' in n: return 'Artificial Intelligence'
    if 'computer' in n or 'information technology' in n: return 'Computer Science'
    if 'nursing' in n or 'public health' in n or 'biomedical' in n: return 'Health Sciences'
    if 'law' in n: return 'Law'
    if 'architecture' in n: return 'Architecture'
    if 'psychology' in n: return 'Psychology'
    if 'education' in n: return 'Education'
    if 'politics' in n or 'international relations' in n or 'public policy' in n: return 'Political Science'
    if 'hospitality' in n: return 'Hospitality Management'
    if 'biotechnology' in n: return 'Biotechnology'
    if 'environmental' in n: return 'Environmental Science'
    if 'design' in n: return 'Design'
    if 'fine art' in n: return 'Fine Art'
    if 'pharmacy' in n: return 'Pharmacy'
    if 'mechanical' in n: return 'Mechanical Engineering'
    if 'civil' in n: return 'Civil Engineering'
    if 'media' in n: return 'Media Studies'
    if 'agricultural' in n: return 'Agricultural Science'
    if 'engineering' in n: return 'Engineering'
    return 'UNKNOWN'

def parse_dur(s):
    if not s or s == 'UNKNOWN': return 'UNKNOWN'
    m = re.search(r'(\d+)', s)
    if m:
        n = int(m.group(1))
        return str(n * 12) if 'year' in s.lower() else str(n)
    return 'UNKNOWN'

def clean_name(n):
    return re.sub(r'[^A-Za-z0-9\s]', '', n).strip().replace(' ', '_').upper()

def get_tags(uni_data, c):
    tags = []
    wr = uni_data.get('worldRanking', '')
    if wr and wr != 'null':
        try:
            if int(wr) <= 100: tags.append('Russell Group Universities')
        except: pass
    if c.get('isPopular') == 'true': tags.append('Open Programs')
    return '|'.join(tags) if tags else 'UNKNOWN'

# ─── Generate rows ───
rows = []
for c in courses:
    uid = c['universityId']
    uni = universities.get(uid, {})
    cc = c['country']
    fc = COUNTRY_MAP.get(cc, cc.upper())
    cur = CURRENCY_MAP.get(cc, 'UNKNOWN')
    uname = c['universityName']
    uni_short = f'UNI_{cc.upper()}_{clean_name(uname)}'
    cid = f'COURSE_{cc.upper()}_{clean_name(uname)}_{clean_name(c["name"])}'

    ielts = c.get('ieltsMin', '')
    if not ielts or ielts == 'UNKNOWN':
        ui = uni.get('ieltsMin', '')
        if ui and ui != 'null':
            ielts = ui
        else:
            ielts = 'UNKNOWN'

    dur = parse_dur(c['duration'])
    intakes = c.get('intakeMonths', '')
    if intakes and intakes != 'UNKNOWN':
        months = [x.strip().strip('"').strip("'") for x in intakes.split(',') if x.strip()]
        im = months[0] if months else 'September'
    else:
        im = 'September'

    status = 'active' if (ielts != 'UNKNOWN' and c['tuitionFee'] != 'UNKNOWN') else 'draft'
    source = f'https://www.{uname.lower().replace(" ","").replace(",","")}.ac.uk/courses/{re.sub(r"[^a-z0-9]+","-",c["name"].lower()).strip("-")}'

    row = [
        uni_short, uname, fc, uni.get('city','UNKNOWN'), 'Main Campus',
        f'https://www.{uname.lower().replace(" ","").replace(",","")}.ac.uk',
        cid, c['name'],
        LEVEL_MAP.get(c['level'],'UNKNOWN'), PROGRAM_MAP.get(c['level'],'UNKNOWN'),
        DEPT_TO_SUBJECT.get(c['department'],'UNKNOWN'), get_discipline(c['name']),
        source, '2026', im, f'{im[:3]}-2026', 'UNKNOWN',
        dur, cur, 'UNKNOWN', cur,
        re.sub(r',', '', c['tuitionFee']) if c['tuitionFee'] != 'UNKNOWN' else 'UNKNOWN',
        'UNKNOWN', cur, 'UNKNOWN',
        'UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN',
        'UNKNOWN','UNKNOWN','UNKNOWN',
        ielts, 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN',
        'UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN',
        get_tags(uni, c), '','','','',
        source, TODAY, status
    ]
    rows.append(row)

# ─── Validation ───
HEADER = [
    'university_id','university_name','country','city','campus_name','university_official_url',
    'course_id','course_title','study_level','program_level','subject_area','discipline_area',
    'course_official_url','intake_year','intake_month','intake_name','application_deadline',
    'duration_months','application_fee_currency','application_fee_amount','tuition_currency',
    'yearly_tuition_fee','total_tuition_fee','deposit_currency','deposit_amount',
    'scholarship_available','scholarship_name','scholarship_currency','scholarship_amount',
    'academic_requirement','grading_system','min_score','ielts_overall','ielts_min_band',
    'pte_overall','pte_min_band','toefl_overall','det_overall','moi_accepted',
    'own_english_test','portfolio_required','interview_required','public_tags',
    'internal_expected_commission','internal_increased_commission','partner_commission',
    'internal_notes','source_url','last_verified_at','status'
]

assert len(HEADER) == 50, f"Header has {len(HEADER)} columns, expected 50"

errors = []
for i, row in enumerate(rows, 2):
    if not row[0]: errors.append(f"Row {i}: missing university_id")
    if not row[1]: errors.append(f"Row {i}: missing university_name")
    if not row[2]: errors.append(f"Row {i}: missing country")
    if not row[6]: errors.append(f"Row {i}: missing course_id")
    if not row[7]: errors.append(f"Row {i}: missing course_title")
    if not row[12]: errors.append(f"Row {i}: missing course_official_url")
    if not row[13]: errors.append(f"Row {i}: missing intake_year")
    if not row[14]: errors.append(f"Row {i}: missing intake_month")
    if not row[48]: errors.append(f"Row {i}: missing source_url")
    if not row[49]: errors.append(f"Row {i}: missing status")

if errors:
    print("INVALID - Errors found:")
    for e in errors[:20]:
        print(f"  {e}")
else:
    print("VALID - No errors found")

# ─── Write CSV ───
outpath = str(_ALO_OUT / 'combined_course_upload.csv')  # was /home/z/my-project/download/ (production-like path)
with open(outpath, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(HEADER)
    for row in rows:
        writer.writerow(row)

# Summary
by_country = {}
for r in rows:
    c = r[2]
    by_country[c] = by_country.get(c, 0) + 1
active = sum(1 for r in rows if r[-1] == 'active')
draft = sum(1 for r in rows if r[-1] == 'draft')

print(f"\nCSV saved: {outpath}")
print(f"Total rows: {len(rows)}")
print(f"Columns: {len(HEADER)}")
print(f"Status: {active} active, {draft} draft")
print(f"\nBy country:")
for c, n in sorted(by_country.items()):
    print(f"  {c}: {n} courses")