#!/usr/bin/env python3
"""Convert the remaining near-black "dark console" screens to the light CRM canvas.

Context
-------
A dozen admin, portal and AI screens were built on `bg-[var(--alo-text)]` —
i.e. the *text* token (#000000, now #0F172A) used as a page background — with
white body copy, `border-white/10` hairlines and translucent `bg-white/5`
rows. That is a black-background section, which the master design system
forbids (§02) and which also broke the moment `--alo-text` became the navy
text colour rather than pure black.

This script re-surfaces those files onto the approved CRM canvas
(`--alo-page` #F8FAFC with white cards and the §03 text hierarchy) while
leaving markup structure, behaviour and copy untouched.

It is deliberately conservative:
  * it only touches the files listed in DARK_FILES;
  * it only rewrites colour utilities, never class order or layout;
  * it never invents data, headings or copy.

Run:  python3 scripts/redesign/dark-surface-to-light.py
"""
import pathlib
import re

DARK_FILES = [
    'src/app/admin/ai-monitor/page.tsx',
    'src/app/admin/document-security/page.tsx',
    'src/app/admin/import-center/students/page.tsx',
    'src/app/admin/sla-monitor/page.tsx',
    'src/app/admin/university-data/page.tsx',
    'src/app/admin/university-data/updates/page.tsx',
    'src/app/admin/whatsapp-analytics/page.tsx',
    'src/app/admin/whatsapp-followup/page.tsx',
    'src/app/admin/whatsapp-numbers/page.tsx',
    'src/app/student/ai-interview/page.tsx',
    'src/app/student/layout.tsx',
    'src/app/student/login/page.tsx',
    'src/app/student/visa-checklist/page.tsx',
    'src/app/student/visa/page.tsx',
    'src/components/admin/EnhancedSuperAdminControlCenter.tsx',
    'src/components/admin/StudentIntakeControlPanel.tsx',
    'src/components/ai/WebChatWidget.tsx',
    'src/components/student/StudentApplications.tsx',
    'src/components/student/StudentDocuments.tsx',
    'src/components/alo/views/csv-import-center.tsx',
    'src/components/alo/views/nexabroad-dashboard.tsx',
]

# Ordered longest-first so `bg-white/10` is not eaten by a `bg-white` rule.
REPLACEMENTS = [
    # ── canvas ────────────────────────────────────────────────────────────
    ('bg-[var(--alo-text)]', 'bg-[var(--alo-page)]'),

    # ── text on the light canvas ──────────────────────────────────────────
    ('text-white/90', 'text-[var(--alo-text)]'),
    ('text-white/80', 'text-[var(--alo-text-secondary)]'),
    ('text-white/70', 'text-[var(--alo-text-secondary)]'),
    ('text-white/65', 'text-[var(--alo-text-muted)]'),
    ('text-white/60', 'text-[var(--alo-text-muted)]'),
    ('text-white/50', 'text-[var(--alo-text-muted)]'),
    ('text-white', 'text-[var(--alo-text)]'),

    # ── hairlines ─────────────────────────────────────────────────────────
    ('border-white/20', 'border-[var(--alo-border)]'),
    ('border-white/15', 'border-[var(--alo-border)]'),
    ('border-white/10', 'border-[var(--alo-border)]'),
    ('border-white/5', 'border-[var(--alo-border)]'),
    ('divide-white/10', 'divide-[var(--alo-border)]'),
    ('divide-white/5', 'divide-[var(--alo-border)]'),
    ('ring-white/20', 'ring-[var(--alo-border-strong)]'),
    ('ring-white/10', 'ring-[var(--alo-border)]'),

    # ── translucent white fills become the soft neutral surface ───────────
    ('bg-white/20', 'bg-[var(--alo-brand-light)]'),
    ('bg-white/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-white/5', 'bg-[var(--alo-surface-muted)]'),
    ('hover:bg-white/10', 'hover:bg-[var(--alo-page)]'),
    ('hover:bg-white/5', 'hover:bg-[var(--alo-page)]'),

    # ── semantic tints: glassy 20% fills -> §13 badge tints ───────────────
    ('bg-blue-500/20', 'bg-[var(--alo-info-bg)]'),
    ('bg-blue-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-indigo-500/20', 'bg-[var(--alo-info-bg)]'),
    ('bg-indigo-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-emerald-500/20', 'bg-crm-success-bg'),
    ('bg-emerald-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-green-500/20', 'bg-crm-success-bg'),
    ('bg-green-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-amber-500/20', 'bg-crm-warning-bg'),
    ('bg-amber-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-yellow-500/20', 'bg-crm-warning-bg'),
    ('bg-yellow-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-rose-500/20', 'bg-crm-danger-bg'),
    ('bg-rose-500/10', 'bg-[var(--alo-surface-muted)]'),
    ('bg-red-500/20', 'bg-crm-danger-bg'),
    ('bg-red-500/10', 'bg-[var(--alo-surface-muted)]'),

    # ── semantic text colours: light-on-dark -> accessible dark-on-light ──
    ('text-blue-300', 'text-[var(--alo-info-text)]'),
    ('text-blue-400', 'text-[var(--alo-info-text)]'),
    ('text-indigo-300', 'text-[var(--alo-info-text)]'),
    ('text-indigo-400', 'text-[var(--alo-info-text)]'),
    ('text-emerald-300', 'text-crm-success-text'),
    ('text-emerald-400', 'text-crm-success-text'),
    ('text-green-300', 'text-crm-success-text'),
    ('text-green-400', 'text-crm-success-text'),
    ('text-amber-300', 'text-crm-warning-text'),
    ('text-amber-400', 'text-crm-warning-text'),
    ('text-yellow-300', 'text-crm-warning-text'),
    ('text-yellow-400', 'text-crm-warning-text'),
    ('text-rose-300', 'text-crm-danger-text'),
    ('text-rose-400', 'text-crm-danger-text'),
    ('text-red-300', 'text-crm-danger-text'),
    ('text-red-400', 'text-crm-danger-text'),

    # ── grey body copy that was only legible on black ────────────────────
    ('text-slate-100', 'text-[var(--alo-text)]'),
    ('text-slate-200', 'text-[var(--alo-body)]'),
    ('text-slate-300', 'text-[var(--alo-text-secondary)]'),
    ('text-slate-400', 'text-[var(--alo-text-muted)]'),
    ('text-gray-100', 'text-[var(--alo-text)]'),
    ('text-gray-200', 'text-[var(--alo-body)]'),
    ('text-gray-300', 'text-[var(--alo-text-secondary)]'),
    ('text-gray-400', 'text-[var(--alo-text-muted)]'),
    ('text-zinc-100', 'text-[var(--alo-text)]'),
    ('text-zinc-200', 'text-[var(--alo-body)]'),
    ('text-zinc-300', 'text-[var(--alo-text-secondary)]'),
    ('text-zinc-400', 'text-[var(--alo-text-muted)]'),

    # ── borders that were tuned for a dark canvas ────────────────────────
    ('border-amber-500/30', 'border-crm-warning-border'),
    ('border-amber-500/20', 'border-crm-warning-border'),
    ('border-red-500/30', 'border-crm-danger-border'),
    ('border-emerald-500/30', 'border-crm-success-border'),

    # ── the acting-as banner kept a hard black hover ─────────────────────
    ('hover:bg-black', 'hover:brightness-95'),
]

# Compiled so `bg-white/10` wins over a bare `text-white` prefix overlap.
PATTERNS = [(re.escape(old), new) for old, new in REPLACEMENTS]
PATTERNS.sort(key=lambda kv: -len(kv[0]))
COMPILED = [(re.compile(old), new) for old, new in PATTERNS]


def convert(text: str) -> str:
    for pattern, new in COMPILED:
        text = pattern.sub(new, text)
    return text


def main() -> None:
    total = 0
    for rel in DARK_FILES:
        path = pathlib.Path(rel)
        if not path.exists():
            print(f'  missing:   {rel}')
            continue
        src = path.read_text()
        out = convert(src)
        if out == src:
            print(f'  unchanged: {rel}')
            continue
        path.write_text(out)
        total += 1
        print(f'  patched:   {rel}')
    print(f'\n{total} file(s) re-surfaced onto the light CRM canvas.')


if __name__ == '__main__':
    main()
