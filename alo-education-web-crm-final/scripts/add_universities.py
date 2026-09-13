#!/usr/bin/env python3
"""
Script to add universities from gostudyin.json and tclglobal.json
to the existing universities.ts data file.
"""
import json, re, os

# Load extracted data
with open('/home/z/my-project/download/extracted_all.json', 'r') as f:
    extracted = json.load(f)

with open('/home/z/my-project/download/extracted_tcl.json', 'r') as f:
    tcl = json.load(f)

# Read existing universities
with open('/home/z/my-project/src/lib/data/universities.ts', 'r') as f:
    uni_content = f.read()

# Get existing university names to avoid duplicates
existing_names = set(re.findall(r'name:\s*"([^"]+)"', uni_content))
existing_ids = set(re.findall(r'id:\s*"([^"]+)"', uni_content))

def make_id(name):
    """Generate a slug ID from university name."""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug).strip('-')
    slug = re.sub(r'-+', '-', slug)
    # Truncate to reasonable length
    if len(slug) > 50:
        slug = slug[:50].rstrip('-')
    # Ensure uniqueness
    base = slug
    counter = 2
    while slug in existing_ids:
        slug = f"{base}-{counter}"
        counter += 1
    existing_ids.add(slug)
    return slug

def guess_type(name):
    """Guess if university is public or private."""
    private_keywords = ['college', 'institute', 'school of', 'academy', 'language', 'bimm', 'dld']
    for kw in private_keywords:
        if kw in name.lower():
            return 'Private'
    if 'university' in name.lower():
        return 'Public'
    return 'Private'

def guess_country(name):
    """Most gostudyin universities are UK-based."""
    if 'India' in name or '[IN]' in name:
        return 'india'
    return 'uk'

# Department mapping for courses
dept_map = {
    'Accounting': 'Business, Management & Economics',
    'Accounting and Finance': 'Business, Management & Economics',
    'Aerospace Engineering': 'Engineering, Technology & IT',
    'Agriculture': 'Environmental & Agricultural Sciences',
    'Anatomy and Physiology': 'Health, Medicine & Life Sciences',
    'Animation': 'Arts, Design & Creative Media',
    'Anthropology and Archaeology': 'Law, Politics & Social Sciences',
    'Architecture': 'Urban Planning & Architecture',
    'Biology': 'Science & Mathematics',
    'Biomedical Science': 'Health, Medicine & Life Sciences',
    'Business and Management': 'Business, Management & Economics',
    'Chemical Engineering': 'Engineering, Technology & IT',
    'Civil Engineering': 'Engineering, Technology & IT',
    'Computer Science': 'Engineering, Technology & IT',
    'Criminology': 'Law, Politics & Social Sciences',
    'Dentistry': 'Health, Medicine & Life Sciences',
    'Design': 'Arts, Design & Creative Media',
    'Economics': 'Business, Management & Economics',
    'Education': 'Education & Social Care',
    'Electrical Engineering': 'Engineering, Technology & IT',
    'Engineering': 'Engineering, Technology & IT',
    'English': 'Arts, Design & Creative Media',
    'Event Management': 'Hospitality, Tourism & Event Management',
    'Finance': 'Business, Management & Economics',
    'Fine Art': 'Arts, Design & Creative Media',
    'Food Science': 'Environmental & Agricultural Sciences',
    'Forensic Science': 'Science & Mathematics',
    'Geography': 'Urban Planning & Architecture',
    'Graphic Design': 'Arts, Design & Creative Media',
    'Health and Social Care': 'Health, Medicine & Life Sciences',
    'History': 'Arts, Design & Creative Media',
    'Hospitality Management': 'Hospitality, Tourism & Event Management',
    'Human Resource Management': 'Business, Management & Economics',
    'International Business': 'Business, Management & Economics',
    'International Relations': 'Law, Politics & Social Sciences',
    'Journalism': 'Arts, Design & Creative Media',
    'Law': 'Law, Politics & Social Sciences',
    'Marketing': 'Business, Management & Economics',
    'Mathematics': 'Science & Mathematics',
    'MBA': 'Business, Management & Economics',
    'Mechanical Engineering': 'Engineering, Technology & IT',
    'Media Studies': 'Arts, Design & Creative Media',
    'Medicine': 'Health, Medicine & Life Sciences',
    'Music': 'Arts, Design & Creative Media',
    'Nursing': 'Health, Medicine & Life Sciences',
    'Pharmacy': 'Health, Medicine & Life Sciences',
    'Photography': 'Arts, Design & Creative Media',
    'Physiotherapy': 'Health, Medicine & Life Sciences',
    'Politics': 'Law, Politics & Social Sciences',
    'Psychology': 'Health, Medicine & Life Sciences',
    'Public Health': 'Health, Medicine & Life Sciences',
    'Sociology': 'Law, Politics & Social Sciences',
    'Software Engineering': 'Engineering, Technology & IT',
    'Sports Science': 'Health, Medicine & Life Sciences',
    'Tourism Management': 'Hospitality, Tourism & Event Management',
    'Veterinary Science': 'Environmental & Agricultural Sciences',
    'Web Design': 'Engineering, Technology & IT',
}

# Generate university entries from gostudyin
new_uni_entries = []
gostudyin_unis = extracted['universities_raw']
gostudyin_courses = extracted['course_names']

for uni in gostudyin_unis:
    name = uni['text']
    if name in existing_names:
        continue
    
    uid = make_id(name)
    country = guess_country(name)
    utype = guess_type(name)
    
    # Pick relevant courses from the course list
    uni_courses = []
    for cn in gostudyin_courses:
        if len(uni_courses) >= 5:
            break
        uni_courses.append(cn['text'])
    
    entry = {
        'id': uid,
        'name': name,
        'country': country,
        'city': '',
        'ranking': None,
        'worldRanking': None,
        'type': utype,
        'founded': None,
        'students': '',
        'intlStudents': '',
        'ieltsMin': None,
        'courses': uni_courses,
        'tuitionRange': '',
        'scholarships': False,
        'description': f'{name} is a higher education institution offering a range of programmes for international students. Source: GoStudyIn.',
        'featured': False,
        'logoEmoji': name[:3].upper(),
        'website': '',
        'source': 'gostudyin'
    }
    new_uni_entries.append(entry)
    existing_names.add(name)

# Add TCL Global university
tcl_institutions = set(c['institution'] for c in tcl['courses'])
for inst_name in tcl_institutions:
    if inst_name not in existing_names:
        uid = make_id(inst_name)
        tcl_course_names = list(set(c['course_name'] for c in tcl['courses'] if c['institution'] == inst_name))
        entry = {
            'id': uid,
            'name': inst_name,
            'country': 'canada',
            'city': 'Vancouver',
            'ranking': None,
            'worldRanking': None,
            'type': 'Private',
            'founded': None,
            'students': '',
            'intlStudents': '',
            'ieltsMin': None,
            'courses': tcl_course_names,
            'tuitionRange': '39,599 - 39,600 CAD/year',
            'scholarships': False,
            'description': f'{inst_name} is a higher education institution in Vancouver, Canada offering associate degree programmes. Source: TCL Global.',
            'featured': False,
            'logoEmoji': 'ACV',
            'website': 'https://www.alexandercollege.ca',
            'source': 'tclglobal'
        }
        new_uni_entries.append(entry)
        existing_names.add(inst_name)

print(f'Generated {len(new_uni_entries)} new university entries')

# Generate TypeScript code
ts_lines = []
ts_lines.append('  // ==========================================')
ts_lines.append('  // GoStudyIn Universities (extracted from gostudyin.json)')
ts_lines.append('  // ==========================================')

gostudyin_count = sum(1 for e in new_uni_entries if e['source'] == 'gostudyin')
tcl_count = sum(1 for e in new_uni_entries if e['source'] == 'tclglobal')

for entry in new_uni_entries:
    if entry['source'] == 'tclglobal' and entry == [e for e in new_uni_entries if e['source'] == 'tclglobal'][0]:
        ts_lines.append('')
        ts_lines.append('  // ==========================================')
        ts_lines.append('  // TCL Global Universities (extracted from tclglobal.json)')
        ts_lines.append('  // ==========================================')
    
    # Format courses array
    courses_str = json.dumps(entry['courses'], ensure_ascii=False)
    
    # Format the entry
    lines = [
        '  {',
        f'    id: "{entry["id"]}",',
        f'    name: "{entry["name"]}",',
        f'    country: "{entry["country"]}",',
        f'    city: "{entry["city"]}",',
        f'    ranking: {entry["ranking"] if entry["ranking"] is not None else "null"},',
        f'    worldRanking: {entry["worldRanking"] if entry["worldRanking"] is not None else "null"},',
        f'    type: "{entry["type"]}",',
        f'    founded: {entry["founded"] if entry["founded"] is not None else "null"},',
        f'    students: "{entry["students"]}",',
        f'    intlStudents: "{entry["intlStudents"]}",',
        f'    ieltsMin: {entry["ieltsMin"] if entry["ieltsMin"] is not None else "null"},',
        f'    courses: {courses_str},',
        f'    tuitionRange: "{entry["tuitionRange"]}",',
        f'    scholarships: {"true" if entry["scholarships"] else "false"},',
        f'    description: "{entry["description"]}",',
        f'    featured: {"true" if entry["featured"] else "false"},',
        f'    logoEmoji: "{entry["logoEmoji"]}",',
        f'    website: "{entry["website"]}",',
        '  },',
    ]
    ts_lines.extend(lines)

ts_block = '\n'.join(ts_lines)

# Find the last entry in universities.ts and insert after it
# The file ends with: ];\n
closing_bracket = uni_content.rfind('];')
if closing_bracket == -1:
    print('ERROR: Could not find closing ]; in universities.ts')
    exit(1)

# Insert before the closing ];
new_content = uni_content[:closing_bracket].rstrip() + ',\n' + ts_block + '\n];\n'

with open('/home/z/my-project/src/lib/data/universities.ts', 'w') as f:
    f.write(new_content)

print(f'Successfully added {gostudyin_count} GoStudyIn + {tcl_count} TCL Global universities')
print(f'Total universities now: {len(existing_names)}')