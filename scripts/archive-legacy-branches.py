#!/usr/bin/env python3
"""Preserve reviewed legacy branch deltas as inert, credential-scrubbed references.

Uses pinned Git objects only; never checks out a donor, executes its scripts,
changes the live application, or downloads anything. See the archive README.
"""
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess

BASELINE = '809fd425cc8be33ff56ac26a1faa6e7e7cccbeb9'
DONORS = {
    'ai-builder-verified': ('integration/ai-builder-alo-verified-20261013', '5b27f58b68e34b73223b4a55107ffc7852a828f3'),
    'ai-builder-full': ('integration/ai-builder-full-20261013', '9b99840ebcec2a0d67a0f89603b8db824bf9c217'),
    'other-ai-builder': ('other-ai-builder-2026-09-13', 'b22a18ae282452049686c8f3251b7680c6cdb523'),
}
ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'imports' / 'legacy-branch-references'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def tree(commit):
    result = {}
    for row in git('ls-tree', '-rz', commit).split(b'\0'):
        if not row:
            continue
        meta, name = row.split(b'\t', 1)
        mode, kind, oid = meta.decode().split()
        result[name.decode()] = (mode, kind, oid)
    return result


# Deliberately conservative: archival text is not executable code, so removing
# an entire suspect line is preferable to retaining a legacy embedded secret.
SUSPECT = re.compile(
    r'(?i)(?:mysql|postgres(?:ql)?|mongodb(?:\+srv)?|redis)://[^\s/]+:[^\s@]+@'
    r'|\b(?:ghp_|github_pat_|xox[baprs]-|AIza|sk-)[A-Za-z0-9_-]{16,}'
    r'|password|passwd|db[_-]?pass|smtp[_-]?pass|secret|api[_-]?key|access[_-]?token|private[_-]?key'
    r'|(?:mysql|mysqldump|psql|pg_dump)[^\n]*\s-p\S{6,}'
)


def sanitize(text):
    output, redacted, in_key = [], [], False
    for number, line in enumerate(text.splitlines(keepends=True), 1):
        if re.search(r'-----BEGIN .*PRIVATE KEY', line):
            in_key = True
        if in_key or SUSPECT.search(line):
            output.append('[REDACTED: potential embedded credential in legacy reference]\n')
            redacted.append(number)
        else:
            output.append(line)
        if re.search(r'-----END .*PRIVATE KEY', line):
            in_key = False
    normalized = '\n'.join(line.rstrip() for line in ''.join(output).splitlines()).rstrip()
    return (normalized + '\n' if normalized else '').encode(), redacted


def main():
    existing = {}
    for name, (mode, kind, oid) in tree(BASELINE).items():
        if kind == 'blob' and mode != '120000':
            existing.setdefault(oid, name)
    manifest = {'version': 1, 'baselineCommit': BASELINE, 'runtimeEnabled': False, 'branches': []}
    for label, (branch, commit) in DONORS.items():
        parents = git('rev-list', '--parents', '-n', '1', commit).decode().split()[1:]
        paths = git('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', commit).split(b'\0')
        donor_tree = tree(commit)
        record = {'branch': branch, 'commit': commit, 'parents': parents, 'scope': 'commit-delta' if parents else 'root-snapshot', 'entries': []}
        for raw_path in sorted(p for p in paths if p):
            source = raw_path.decode()
            if PurePosixPath(source).is_absolute() or '..' in PurePosixPath(source).parts:
                raise ValueError('Unsafe donor path')
            if source not in donor_tree:
                record['entries'].append({'sourcePath': source, 'kind': 'deleted-in-donor'})
                continue
            mode, kind, oid = donor_tree[source]
            entry = {'sourcePath': source, 'sourceBlob': oid, 'sourceMode': mode}
            if kind != 'blob' or mode == '120000':
                entry.update(kind='object-reference-only', reason='Do not materialize submodules or symbolic links')
            elif source.startswith(('storage/', 'public/uploads/')) or source.endswith(('.pid', '.db', '.sqlite', '.sqlite3')):
                entry.update(kind='omitted-runtime-artifact', reason='Private uploads, database files and process state must not be republished')
            elif oid in existing:
                entry.update(kind='existing-identical-blob', existingPath=existing[oid])
            else:
                data = git('cat-file', 'blob', oid)
                try:
                    text = data.decode('utf-8')
                    if '\0' in text:
                        raise UnicodeError('binary data')
                    data, redactions = sanitize(text)
                    suffix = '.txt'
                except UnicodeError:
                    redactions, suffix = [], '.asset'
                relative = Path(label) / (source + suffix)
                dest = ARCHIVE / relative
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                dest.chmod(0o644)
                entry.update(kind='archived', archivePath=relative.as_posix(), sha256=hashlib.sha256(data).hexdigest(), redactedLines=redactions)
            record['entries'].append(entry)
        manifest['branches'].append(record)
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    (ARCHIVE / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Archived branch deltas; details in imports/legacy-branch-references/manifest.json')


if __name__ == '__main__':
    main()
