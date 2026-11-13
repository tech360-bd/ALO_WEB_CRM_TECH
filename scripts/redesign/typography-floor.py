#!/usr/bin/env python3
"""
Typography floor pass (Master §04).

The interface contains ~1,700 occurrences of 8px/9px/10px text, mostly inside
dense CRM panels. The master spec sets 11-13px metadata as the floor and
forbids shrinking type to fit content, so every 8/9/10px utility is raised to
11px (still compact — 11px is already used 1,200+ times across the app, so the
existing layouts are already designed for it).

Only literal Tailwind arbitrary-size utilities are touched:
    text-[8px] -> text-[11px]
    text-[9px]  -> text-[11px]
    text-[10px] -> text-[11px]
Nothing else in the file changes.
"""
import os
import re

ROOTS = ['src/components', 'src/app']
SKIP_DIRS = {'node_modules'}
changed_files = 0
changed_occurrences = 0

PATTERN = re.compile(r'text-\[(?:8|9|10)px\]')

for root in ROOTS:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(('.tsx', '.ts')):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding='utf-8') as fh:
                original = fh.read()
            matches = PATTERN.findall(original)
            if not matches:
                continue
            updated = PATTERN.sub('text-[11px]', original)
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(updated)
            changed_files += 1
            changed_occurrences += len(matches)

print(f'files changed: {changed_files}')
print(f'occurrences raised to 11px: {changed_occurrences}')
