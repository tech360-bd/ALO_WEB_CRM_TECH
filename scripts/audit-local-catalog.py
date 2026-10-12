"""Read-only local CSV audit. No DB, requests or synthetic data creation.
Status strings and plausible URLs are claims, never verification evidence.
"""
import csv, json, hashlib, re
from pathlib import Path
from collections import Counter

roots = [Path('data'), Path('docs/import-templates/package-verified')]
results = []
for root in roots:
    for path in sorted(root.glob('*.csv')):
        statuses, fields, flags = Counter(), Counter(), Counter()
        count = 0
        with path.open(encoding='utf-8-sig', newline='') as stream:
            for row in csv.DictReader(stream):
                count += 1
                for key, value in row.items():
                    if not isinstance(value, str): continue
                    if key and 'verification_status' in key: statuses[value or 'BLANK'] += 1
                    if not value.strip(): fields[key] += 1
                text = ' '.join(v for v in row.values() if isinstance(v, str))
                for name, regex in [
                    ('generic_modules', r'Core Module [123]'),
                    ('standard_faculty', r'Standard Faculty Structure'),
                    ('generic_description', r'Study programme in .+ covering core concepts'),
                    ('guessed_curriculum_suffix', r'https?://[^\s,]+/curriculum'),
                    ('future_calendar_not_published', r'2027 calendar not published'),
                    ('template_url_admitted', r'Template-generated|UNVERIFIED_TEMPLATE_URL'),
                ]:
                    if re.search(regex, text, re.I): flags[name] += 1
        results.append({'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'rows': count,
                        'claimedVerificationStatuses': dict(statuses), 'suspiciousPatternRowCounts': dict(flags),
                        'blankFieldCounts': dict(fields), 'publicationDecision': 'QUARANTINE_PENDING_FIELD_EVIDENCE'})
report = {'date': '2026-10-10', 'scope': 'local CSVs in data/ and docs/import-templates/package-verified/; JSON/ZIP/legacy copies and live DB not reviewed by this script',
          'method': 'streaming CSV parse, counts and template-pattern flags; not official verification',
          'verifiedByThisAudit': 0, 'files': results}
Path('AUDIT/local-catalog-quality-2026-10-10.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps([{k: v for k, v in r.items() if k in ['file','rows','claimedVerificationStatuses','suspiciousPatternRowCounts']} for r in results], indent=2))
