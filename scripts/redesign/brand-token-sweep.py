#!/usr/bin/env python3
"""One-off sweep: replace raw Tailwind blue/orange utility families with the
ALO semantic tokens so the palette is themeable (light + dark) and provably
single-sourced.

Only *utility class* occurrences are touched; arbitrary values in style
objects, chart series and brand marks are left alone. Run with --dry-run to
preview counts before writing.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOTS = ['src/app', 'src/components']

# (family, replacement) — ordered most-specific first.
MAP: list[tuple[str, str]] = [
    # Blue family -> brand tokens
    ('bg-blue-50', 'bg-[var(--alo-brand-pale)]'),
    ('bg-blue-100', 'bg-[var(--alo-brand-pale)]'),
    ('bg-blue-600', 'bg-[var(--alo-brand)]'),
    ('bg-blue-700', 'bg-[var(--alo-brand-hover)]'),
    ('bg-blue-800', 'bg-[var(--alo-brand-deep)]'),
    ('bg-blue-900', 'bg-[var(--alo-brand-deep)]'),
    ('text-blue-100', 'text-[var(--alo-brand-pale)]'),
    ('text-blue-200', 'text-[var(--alo-brand-pale)]'),
    ('text-blue-500', 'text-[var(--alo-brand)]'),
    ('text-blue-600', 'text-[var(--alo-brand)]'),
    ('text-blue-700', 'text-[var(--alo-brand)]'),
    ('text-blue-800', 'text-[var(--alo-brand-deep)]'),
    ('text-blue-900', 'text-[var(--alo-brand-deep)]'),
    ('border-blue-50', 'border-[var(--alo-border)]'),
    ('border-blue-100', 'border-[var(--alo-border)]'),
    ('border-blue-200', 'border-[var(--alo-border)]'),
    ('border-blue-500', 'border-[var(--alo-brand)]'),
    ('border-blue-600', 'border-[var(--alo-brand)]'),
    ('ring-blue-500', 'ring-[var(--alo-brand)]'),
    ('ring-blue-600', 'ring-[var(--alo-brand)]'),
    # Orange family -> CTA tokens
    ('bg-orange-50', 'bg-[var(--alo-cta-soft)]'),
    ('bg-orange-100', 'bg-[var(--alo-cta-soft)]'),
    ('bg-orange-500', 'bg-[var(--alo-cta)]'),
    ('bg-orange-600', 'bg-[var(--alo-cta-hover)]'),
    ('text-orange-50', 'text-[var(--alo-cta-soft)]'),
    ('text-orange-500', 'text-[var(--alo-cta)]'),
    ('text-orange-600', 'text-[var(--alo-cta-active)]'),
    ('text-orange-700', 'text-[var(--alo-cta-active)]'),
    ('text-orange-800', 'text-[var(--alo-cta-active)]'),
    ('border-orange-100', 'border-[var(--alo-cta)]/25'),
    ('border-orange-200', 'border-[var(--alo-cta)]/25'),
    ('border-orange-500', 'border-[var(--alo-cta)]'),
]

# A class utility starts at a word boundary that is NOT part of a longer
# identifier (so `hover:bg-blue-50` matches the inner utility, and
# `bg-blue-500/20` keeps its opacity suffix untouched).
def pattern(family: str) -> re.Pattern[str]:
    escaped = re.escape(family)
    return re.compile(r'(?<![\w-])' + escaped + r'(?![\w-])')


def main() -> None:
    dry = '--dry-run' in sys.argv
    totals: dict[str, int] = {}
    touched = 0
    for root in ROOTS:
        for path in Path(root).rglob('*.tsx'):
            text = original = path.read_text(encoding='utf-8')
            for family, replacement in MAP:
                new, count = pattern(family).subn(replacement, text)
                if count:
                    totals[family] = totals.get(family, 0) + count
                    text = new
            if text != original:
                touched += 1
                if not dry:
                    path.write_text(text, encoding='utf-8')
    print(f'{"would touch" if dry else "touched"} {touched} files')
    for family, count in sorted(totals.items(), key=lambda kv: -kv[1]):
        print(f'  {family:20s} {count:5d}  -> {dict(MAP)[family]}')
    print(f'  total replacements: {sum(totals.values())}')


if __name__ == '__main__':
    main()
