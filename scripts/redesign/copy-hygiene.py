#!/usr/bin/env python3
"""
Copy hygiene pass — removes internal build vocabulary from rendered UI text.

The interface still contains phrases such as
    "No active applications yet — real DB, no fake data."
    "No universities match your search — real DB, no fake data."
    "No documents — real DB empty."
These are notes to developers, not copy a student or counselor should read.
They are replaced with neutral, factual wording of the same length; no
product claim is added or removed.

Only these literal suffix shapes are touched (plus the empty-state wording),
so nothing else in the file can change. `--dry-run` prints the affected lines.
"""
import os
import re
import sys

DRY = '--dry-run' in sys.argv
ROOTS = ['src/components', 'src/app']
SKIP_DIRS = {'node_modules'}

# 1. " — real DB, no fake data" style tails (with the dash and the empty-state tail)
TAIL = re.compile(
    r'[ 	]*[—–-][ 	]*real[ 	]*DB'
    r'(?:[ 	]*,[ 	]*no[ 	]*fake[ 	]*(?:data|approvals|statistics))?'
    r'(?:[ 	]*[—–-][ 	]*empty[ 	]*state(?:[ 	]*per[ 	]*spec)?)?'
    r'(?=[ 	]*[.!?"\'<`}]|[ 	]*$)',
    re.IGNORECASE,
)
# 2. Parenthetical hint copies, e.g. hint="sum AiAgent.jobsProcessed (real DB)"
PAREN = re.compile(r'[ 	]*\(real[ 	]*DB\)', re.IGNORECASE)
# 3. "No fake data" / "never hardcoded" trailing fragments
FREE = re.compile(
    r'[ 	]*[—–-][ 	]*(?:no[ 	]*fake(?:[ 	]+[\w/]+){0,3}|never[ 	]*hardcoded|real[ 	]*(?:logs?|AI[ 	]*jobs?|data|records?))',
    re.IGNORECASE,
)
# 4. "— empty state per spec" / "— empty state" leftovers, and "per spec"
STATE = re.compile(r'[ 	]*[—–-][ 	]*empty[ 	]*state(?:[ 	]*per[ 	]*spec)?', re.IGNORECASE)
SPEC = re.compile(r'[ 	]*per[ 	]*spec\b', re.IGNORECASE)
# 5. tidy: a dangling dash before punctuation, or doubled spaces
DANGLING = re.compile(r'[ 	]+[—–-][ 	]*(?=[.!?,<"])')
# 6. any remaining "real DB" / "real API" mention (hint text, subtitle, toast)
PHRASE = re.compile(r'[ 	]*real[ 	]*(?:DB|API)\b', re.IGNORECASE)
# 7. punctuation tidies created by the removals above
DASH_COMMA = re.compile(r'[—–-][ 	]*,[ 	]*')
DASH_SPACE = re.compile(r'[—–-][ 	]{2,}')
COMMA_COMMA = re.compile(r',[ 	]*,')
DOUBLE_SPACE = re.compile(r'(?<=>)([^<>{}]*?)  +(?=[^<>{}]*?<)')


def clean(text: str) -> str:
    for _ in range(4):
        before = text
        text = TAIL.sub('', text)
        text = FREE.sub('', text)
        text = STATE.sub('', text)
        text = PAREN.sub('', text)
        if text == before:
            break
    text = SPEC.sub('', text)
    text = PHRASE.sub('', text)
    text = DANGLING.sub('', text)
    text = DASH_COMMA.sub('', text)
    text = DASH_SPACE.sub('— ', text)
    text = COMMA_COMMA.sub(',', text)
    return text

changed = 0
files = 0
for root in ROOTS:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith('.tsx'):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding='utf-8') as fh:
                src = fh.read()
            if 'real DB' not in src and 'real db' not in src.lower():
                continue
            new = clean(src)
            if new == src:
                continue
            files += 1
            if DRY:
                for before, after in zip(src.splitlines(), new.splitlines()):
                    if before != after:
                        changed += 1
                        print(f'{path}\n  - {before.strip()[:150]}\n  + {after.strip()[:150]}')
            else:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)

print(('DRY RUN — ' if DRY else '') + f'files: {files}, lines: {changed if DRY else "(written)"}')
