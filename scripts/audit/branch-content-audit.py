#!/usr/bin/env python3
"""Tree-level audit of remote branches against origin/main.

origin/main is a single squashed snapshot commit with **no common ancestor** to
any branch, so `git merge-base` returns nothing and a literal `git merge` would be
an unrelated-histories merge (full-tree conflict). The meaningful question is
therefore: does a branch carry content that main does not have?

We answer it by diffing the two trees (works without a merge base) and reporting
file counts in three buckets, then listing the branch-only paths for the most
recent branches so they can be inspected by hand.
"""
import subprocess
import sys

RECENT_DETAIL = 6  # how many of the newest branches get a path listing


def git(*args: str) -> str:
    r = subprocess.run(['git', *args], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ''


def main() -> None:
    branches = [
        b for b in git('branch', '-r', '--format=%(refname:short)').splitlines()
        if not b.endswith('/HEAD') and b != 'origin/main'
    ]
    info = []
    for b in branches:
        name_status = git('diff', '--name-status', 'origin/main', b).splitlines()
        only_branch = [l.split('\t', 1)[1] for l in name_status if l.startswith('A')]
        only_main = [l.split('\t', 1)[1] for l in name_status if l.startswith('D')]
        modified = [l.split('\t', 1)[1] for l in name_status if l.startswith('M')]
        date = git('log', '-1', '--format=%cs', b)
        info.append({
            'branch': b, 'date': date,
            'only_branch': only_branch, 'only_main': only_main, 'modified': modified,
        })
    info.sort(key=lambda r: r['date'], reverse=True)

    print(f'branches: {len(info)}  (origin/main is 1 squashed commit, no shared ancestor)\n')
    print(f"{'branch':52s} {'last commit':11s} {'branch-only':>11s} {'main-only':>9s} {'modified':>8s}")
    for r in info:
        print(f"{r['branch']:52s} {r['date']:11s} {len(r['only_branch']):11d} "
              f"{len(r['only_main']):9d} {len(r['modified']):8d}")

    print(f"\n--- newest {RECENT_DETAIL} branches: files that exist only on the branch ---")
    for r in info[:RECENT_DETAIL]:
        print(f"\n{r['branch']}  ({r['date']})  branch-only={len(r['only_branch'])}")
        for p in r['only_branch'][:15]:
            print(f'    {p}')
        if len(r['only_branch']) > 15:
            print(f'    … +{len(r["only_branch"]) - 15} more')


if __name__ == '__main__':
    sys.exit(main())
