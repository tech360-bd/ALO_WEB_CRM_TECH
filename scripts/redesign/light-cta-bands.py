#!/usr/bin/env python3
"""Public CTA bands: near-black block -> pale-orange conversion panel.

Master §02 forbids black-background sections and §11 reserves pale orange
(#FFF1EA) for conversion content. These three public views ended their page
with `<section className="bg-[var(--alo-text)]">` — literally the text token
as a background — and white body copy on top of it.

Run:  python3 scripts/redesign/light-cta-bands.py
"""
import pathlib

FILES = [
    'src/components/alo/views/public-about.tsx',
    'src/components/alo/views/public-visa-support.tsx',
    'src/components/alo/views/public-admission-requirements.tsx',
]

REPLACEMENTS = [
    ('<section className="bg-[var(--alo-text)]">',
     '<section className="bg-[var(--alo-cta-soft)]">'),
    ('className="text-3xl font-black text-white"',
     'className="text-3xl font-black text-[var(--alo-text)]"'),
    ('className="mt-3 text-base leading-relaxed text-white/80"',
     'className="mt-3 text-base leading-relaxed text-[var(--alo-text-secondary)]"'),
    ('className="h-12 bg-[var(--alo-cta)] px-6 text-white hover:bg-[var(--alo-cta-hover)]"',
     'className="h-12 bg-alo-cta-solid px-6 text-white hover:bg-alo-cta-solid-hover"'),
    ('className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10"',
     'className="h-12 border-[var(--alo-border-strong)] bg-white px-6 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]"'),
]


def main() -> None:
    for rel in FILES:
        p = pathlib.Path(rel)
        src = p.read_text()
        out = src
        for old, new in REPLACEMENTS:
            out = out.replace(old, new)
        if out == src:
            print(f'  unchanged: {rel}')
            continue
        p.write_text(out)
        print(f'  patched:   {rel}')


if __name__ == '__main__':
    main()
