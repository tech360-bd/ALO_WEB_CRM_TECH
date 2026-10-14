#!/usr/bin/env python3
"""Offline full text-occurrence index. No runtime imports, provider access or secret values.
Dependency engines are third-party compatibility metadata, not runtime selection.
Binary files receive classification/byte size only. No text-file size cutoff.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/runtime-standard'
files = sorted(set(subprocess.check_output(
    ['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=ROOT
).decode().split('\0')) - {''})
pattern = re.compile(
    r'VPS|Ubuntu|DigitalOcean|\bEC2\b|AWS VM|Docker VPS|Nginx|systemd|PM2|SSH deployment|\bscp\b|\brsync\b|'
    r'Node(?:\.js)?[ :v]+(?:16|18|20|21)\b|node:(?:16|18|20|21)\b|'
    r'NODE_VERSION[=:][\s\x22\x27]*(?:16|18|20|21)\b|node-version:[\s\x22\x27]*(?:16|18|20|21)\b|'
    r'\bnode(?:16|18|20|21)\b|\b(?:16|18|20|21)\.x\b|\b(?:bun|pnpm|yarn)\b', re.I)
records = []
scanned = binary = 0
for file in files:
    # This index/results are derived outputs, not recursively scanned application files.
    # docs/runtime-standard/LEGACY-CPANEL-GUIDE.md was retired on 2026-10-13, so the
    # whole directory is derived scan output again.
    if file.startswith('docs/runtime-standard/'):
        continue
    path = ROOT / file
    if not path.is_file():
        continue
    with path.open('rb') as stream:
        prefix = stream.read(8192)
    if b'\0' in prefix:
        binary += 1
        continue
    scanned += 1
    first = prefix.decode('utf-8', errors='replace')
    if file.startswith('.github/'):
        kind, reason = 'CI configuration', 'Ubuntu is a GitHub runner OS, not production hosting; Node setup remains 22.'
    elif file.startswith('tests/') or file.endswith(('package-lock.json', 'bun.lock', 'yarn.lock', 'pnpm-lock.yaml')):
        kind, reason = 'Test fixture/example', 'Negative test or third-party dependency compatibility metadata, not selected app runtime.'
    elif file.startswith(('docs/audit/', 'docs/functionality/', 'docs/deployment-ownership/', 'docs/production-reconciliation/', 'storage/', '.repair-backup', 'alo-education-web-crm-final/', 'deploy-build/')):
        kind, reason = 'Historical/legacy reference', 'Archived/exported content; not the root application or current deployment guidance.'
    elif any(marker in first for marker in ['LEGACY / NOT USED FOR CURRENT PRODUCTION', 'DEPLOYMENT OWNERSHIP QUARANTINE', "throw new Error('DISABLED:"]):
        kind, reason = 'Historical/legacy reference', 'Explicit legacy notice/refusal; obsolete configuration is not production authority.'
    elif path.suffix in ('.md', '.txt', '.csv', '.log') or file.startswith('docs/'):
        kind, reason = 'Documentation', 'Reference/evidence; runtime standard supersedes historical claims. Review guidance before use.'
    elif file.startswith(('prisma/', 'scripts/', 'backend/')):
        kind, reason = 'Test fixture/example', 'Operator utility, seed data, keyword matcher or diagnostic, not root CI build/start. Never execute against production merely to audit.'
    else:
        kind, reason = 'Active production configuration', 'Source/config reference; individual occurrence must be checked for policy conflict rather than treated as a runtime declaration.'
    # Rust regex scanner avoids Python backtracking on huge generated lines.
    scan = subprocess.run(['rg', '--no-config', '--text', '--only-matching', '--line-number',
                           '--no-heading', '--color', 'never', '-i', pattern.pattern, '--', str(path)],
                          capture_output=True, text=True, errors='replace')
    if scan.returncode not in (0, 1):
        raise RuntimeError(f'Cannot scan {file}: exit {scan.returncode}')
    by_line = {}
    for match in scan.stdout.splitlines():
        number, term = match.split(':', 1)
        by_line.setdefault(int(number), set()).add(term)
    # Individually reviewed non-runtime matches; do not mistake words for deployment mechanisms.
    overrides = {
        '.gitignore': ('Test fixture/example', 'Ignore patterns exclude package-manager caches; they do not select Yarn/pnpm.'),
        'FINAL-MERGE-MANIFEST.json': ('Historical/legacy reference', 'Historical merge manifest, not executable or a current policy declaration.'),
        'audit-and-create-alo-clean.sh': ('Test fixture/example', 'Offline local-tree inventory/copy utility; rsync uses local ROOT/NEW, no remote transport. Not a release tool.'),
        'deploy/alo_education_production.sql': ('Historical/legacy reference', 'Legacy SQL export/seed strings. Not current DB state; never auto-import.'),
        'src/lib/research/lead-enrichment-pipeline.ts': ('Documentation', 'Comment attributes an upstream reference project using pnpm; ALO does not invoke that package manager.'),
    }
    if file in overrides:
        kind, reason = overrides[file]
    hits = [{'line': n, 'terms': sorted(terms), 'classification': kind} for n, terms in by_line.items()]
    if hits:
        records.append({'file': file, 'classification': kind, 'reason': reason, 'occurrences': hits})
OUT.mkdir(exist_ok=True)
(OUT / 'occurrences.json').write_text(json.dumps(records, separators=(',', ':')) + '\n')
summary = {'textFilesFullyScanned': scanned, 'binaryFilesMetadataOnly': binary,
           'filesWithMatches': len(records), 'matchingLines': sum(len(r['occurrences']) for r in records),
           'scope': 'Tracked + nonignored additions; derived runtime report outputs excluded to avoid recursive scanning; no text size cutoff.',
           'note': 'Occurrence classification is not full business/source verification; source-level candidates require individual review.'}
(OUT / 'scan-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
