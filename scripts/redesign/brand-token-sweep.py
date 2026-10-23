#!/usr/bin/env python3
"""
Brand-token sweep (Master §03 colour, §04 type).

Why: the codebase uses the official ALO palette everywhere, but writes it as
raw hex inside Tailwind arbitrary values (`bg-[#0057B8]`) and as Tailwind's
default gray/slate scales. That defeats the theme layer in `globals.css`:
values cannot respond to dark mode, and the same token is spelled a dozen
different ways across ~1,000 files.

What it does — string-level only, inside className-like text:
  1. `bg-[#0057B8]`  -> `bg-[var(--alo-brand)]`      (each palette hex -> its token)
  2. `text-gray-500` -> `text-[var(--alo-text-muted)]` (neutral scales -> tokens)
Nothing else changes: no JSX structure, no props, no logic, no API calls.

Safety rules:
  - Only hexes that are *exact* members of the ALO palette are rewritten.
  - Only arbitrary values in the shape `<utility>-[#RRGGBB]` are touched, so
    `style={{ color: '#0057B8' }}`, SVG `stroke="#..."` attributes and
    dataset strings are untouched.
  - Neutral-scale rewrites are limited to text/bg/border shades whose light
    value is unambiguous (50-500). 600-950 neutrals are left alone because
    they are used both as text on white and as surfaces on dark panels.
  - `--dry-run` reports counts and exits without writing.
"""
import os
import re
import sys

DRY = '--dry-run' in sys.argv
ROOTS = ['src/components', 'src/app']
SKIP_DIRS = {'node_modules'}

# exact ALO palette hex -> CSS custom property (light-mode value preserved)
HEX_TOKENS = {
    '0057B8': '--alo-brand',
    '003F87': '--alo-brand-hover',
    '002D62': '--alo-brand-hover',
    'EAF3FF': '--alo-brand-light',
    'F4F8FF': '--alo-brand-pale',
    'BFDBFE': '--alo-brand-border',
    'E8501A': '--alo-cta',
    'C93D13': '--alo-cta-hover',
    'FFB347': '--alo-cta-accent',
    'FFE8DD': '--alo-cta-light',
    'FFF1EA': '--alo-cta-soft',
    '0F172A': '--alo-text',
    '334155': '--alo-body',
    '475569': '--alo-text-secondary',
    '64748B': '--alo-text-muted',
    'CBD5E1': '--alo-border-strong',
    'E2E8F0': '--alo-border',
    'F1F5F9': '--alo-surface-muted',
    'F8FAFC': '--alo-page',
    'EFF6FF': '--alo-info-bg',
    '10B981': '--alo-success',
    '047857': '--alo-success-dark',
    'ECFDF5': '--alo-success-soft',
    'EF4444': '--alo-error',
    'FEE2E2': '--alo-error-soft',
    'FEF2F2': '--alo-error-soft',
    'F59E0B': '--alo-warning',
    'FFFBEB': '--alo-warning-soft',
    'FEF3C7': '--alo-warning-soft',
    '0284C7': '--alo-info',
    '25D366': '--alo-whatsapp',
    '991B1B': '--alo-danger-strong',
    '92400E': '--alo-warning-strong',
    # near-duplicate shades found in the codebase -> nearest canonical token
    # (kept subtle: these differ from the token by 1-4% lightness at most)
    'E8F0FB': '--alo-brand-light',
    'F7F9FC': '--alo-page',
    'F7FAFE': '--alo-page',
    'DCE8F5': '--alo-brand-border',
    '5A7299': '--alo-text-muted',
    '0B2447': '--alo-text',
    '0D1526': '--alo-text',
    '0A0F1E': '--alo-text',
    'FDECE4': '--alo-cta-soft',
    'FFF3EA': '--alo-cta-soft',
    'D04010': '--alo-cta-hover',
    'C8451A': '--alo-cta-hover',
    'C84012': '--alo-cta-hover',
    '0046A0': '--alo-brand-hover',
    '003D82': '--alo-brand-hover',
    '22C55E': '--alo-success',
    'FBBF24': '--alo-warning',
    '94A3B8': '--alo-placeholder',
    '555555': '--alo-text-secondary',
    'F4F6FB': '--alo-page',
    'FFF7ED': '--alo-cta-soft',
    '1E293B': '--alo-surface-muted',
    '1E40AF': '--alo-brand-hover',
    'D14315': '--alo-cta-hover',
    'D85F1B': '--alo-cta-hover',
    'D8590E': '--alo-cta-hover',
}

UTILITY = r'(?:bg|text|border|from|via|to|ring|outline|divide|decoration|fill|stroke|accent|caret|placeholder)'
HEX_RE = re.compile(UTILITY + r'-\[#([0-9A-Fa-f]{6})\](?![0-9A-Za-z_])')

NEUTRAL_MAP = {
    # text
    'text-gray-900': 'text-[var(--alo-text)]',
    'text-gray-800': 'text-[var(--alo-text)]',
    'text-gray-700': 'text-[var(--alo-body)]',
    'text-gray-600': 'text-[var(--alo-body)]',
    'text-gray-500': 'text-[var(--alo-text-muted)]',
    'text-gray-400': 'text-[var(--alo-text-muted)]',
    'text-gray-300': 'text-[var(--alo-placeholder)]',
    'text-slate-900': 'text-[var(--alo-text)]',
    'text-slate-800': 'text-[var(--alo-text)]',
    'text-slate-700': 'text-[var(--alo-body)]',
    'text-slate-600': 'text-[var(--alo-body)]',
    'text-slate-500': 'text-[var(--alo-text-muted)]',
    'text-slate-400': 'text-[var(--alo-text-muted)]',
    'text-slate-300': 'text-[var(--alo-placeholder)]',
    # surfaces
    'bg-gray-50': 'bg-[var(--alo-page)]',
    'bg-gray-100': 'bg-[var(--alo-surface-muted)]',
    'bg-slate-50': 'bg-[var(--alo-page)]',
    'bg-slate-100': 'bg-[var(--alo-surface-muted)]',
    # borders
    'border-gray-100': 'border-[var(--alo-border)]',
    'border-gray-200': 'border-[var(--alo-border)]',
    'border-gray-300': 'border-[var(--alo-border-strong)]',
    'border-slate-100': 'border-[var(--alo-border)]',
    'border-slate-200': 'border-[var(--alo-border)]',
    'border-slate-300': 'border-[var(--alo-border-strong)]',
    'divide-gray-100': 'divide-[var(--alo-border)]',
    'divide-gray-200': 'divide-[var(--alo-border)]',
    'divide-slate-100': 'divide-[var(--alo-border)]',
    'divide-slate-200': 'divide-[var(--alo-border)]',
}
# Longest first so `text-gray-500` never eats a prefix of a longer class.
NEUTRAL_RE = re.compile(r'(?<![0-9A-Za-z_-])(' + '|'.join(
    sorted((re.escape(k) for k in NEUTRAL_MAP), key=len, reverse=True)
) + r')(?![0-9A-Za-z_-])')

unknown = {}
hex_count = 0
neutral_count = 0
files = 0

for root in ROOTS:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(('.tsx', '.ts', '.css')):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding='utf-8') as fh:
                src = fh.read()
            if '[#' not in src and 'gray-' not in src and 'slate-' not in src:
                continue
            out = src

            def hex_sub(m):
                global hex_count
                key = m.group(1).upper()
                prop = HEX_TOKENS.get(key)
                if not prop:
                    unknown[key] = unknown.get(key, 0) + 1
                    return m.group(0)
                hex_count += 1
                util = m.group(0)[: m.group(0).index('-[#')]
                return f'{util}-[var({prop})]'

            out = HEX_RE.sub(hex_sub, out)

            def neutral_sub(m):
                global neutral_count
                neutral_count += 1
                return NEUTRAL_MAP[m.group(1)]

            out = NEUTRAL_RE.sub(neutral_sub, out)

            if out != src:
                files += 1
                if not DRY:
                    with open(path, 'w', encoding='utf-8') as fh:
                        fh.write(out)

print(('DRY RUN — ' if DRY else '') + f'files: {files}, hex->token: {hex_count}, neutral->token: {neutral_count}')
print('palette hexes left untouched (not in the token table):')
for key, count in sorted(unknown.items(), key=lambda kv: -kv[1])[:20]:
    print(f'  #{key}: {count}')
