#!/usr/bin/env python3
"""
Visual-redesign pass for src/components/website/PremiumCountryPage.tsx

Two classes of change, both inside the master spec:

1. CONTENT HYGIENE — remove build-instruction text that was rendering to the
   public (e.g. "Count from database — not hardcoded", "real DB, no fake static
   course cards", "ESTIMATE ONLY — Never present estimates as official
   figures"). Replacements keep the same meaning for a visitor, drop the
   engineering language, and never invent a fact.

2. DESIGN TOKENS — replace ad-hoc raw hex / `slate|gray-*` utilities with the
   shared tokens so the page inherits the type + colour scale (Master §03/§04),
   raise 10px metadata to the 11px minimum, hide the floating hero cards on
   small screens, and relax the over-tight 0.95 hero leading.
"""
import re
import sys

PATH = 'src/components/website/PremiumCountryPage.tsx'
src = open(PATH, encoding='utf-8').read()
original = src

# ── 1. Content hygiene ──────────────────────────────────────────────────────
replacements = [
    # Quick facts heading / labels
    ('Quick Facts — {countryData.name} — Verified Only',
     'Quick facts about studying in {countryData.name}'),
    ('<p className="text-[11px] font-bold text-gray-500 uppercase">Universities — DB</p>',
     '<p className="caption-text">Universities</p>'),
    ("{linkedUniversities.length ? `${linkedUniversities.length} Universities in ${countryData.name}` : 'Check with counselor — DB count'}",
     "{linkedUniversities.length ? `${linkedUniversities.length} universities in ${countryData.name}` : 'Ask a counselor for the current list'}"),
    ('<p className="text-[10px] text-gray-400 mt-1">Count from database — not hardcoded</p>',
     '<p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Counted from the published catalogue</p>'),
    ('<p className="text-[11px] font-bold text-gray-500 uppercase">Courses — DB</p>',
     '<p className="caption-text">Courses</p>'),
    ('<p className="text-[10px] text-gray-400 mt-1">Filter country_id — same DB</p>',
     '<p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Same published catalogue</p>'),

    # Popular courses / universities headings + empty states
    ('Popular Courses in {countryData.name} — Dynamic from DB',
     'Popular courses in {countryData.name}'),
    ('No courses found for {countryData.name} — real DB, no fake static course cards. Load courses dynamically from existing courses table filter country_id.',
     'We have no verified course records for {countryData.name} yet.'),
    ('Popular Universities in {countryData.name} — Dynamic from DB',
     'Popular universities in {countryData.name}'),
    ('No universities found for {countryData.name} — real DB, no fake data. Load from universities table filter by country.',
     'We have no verified university records for {countryData.name} yet.'),
    ("'Check with counselor — verified only'", "'Ask a counselor'"),

    # Tuition / budget
    ('Tuition & Budget — {countryData.name} — Verified Only, ESTIMATE ONLY',
     'Tuition and budget for {countryData.name}'),
    ('Interactive Budget Estimator — ESTIMATE ONLY', 'Interactive budget estimator'),
    ('<p className="font-bold text-[#0F172A]">ESTIMATE ONLY — Never present estimates as official figures</p>',
     '<p className="font-semibold text-[var(--alo-text)]">Estimates only — confirm final figures with your counselor or the university</p>'),
    ('If conversion available show Indicative BDT estimate and exchange rate/date',
     'The BDT figure uses the exchange rate you enter above — it is indicative, not a quoted rate.'),
    ('From actual linked scholarships — DB', 'See the scholarship directory for this destination'),
    ('Budget Breakdown — Verified Data Only', 'Budget breakdown'),

    # Section headings
    ('Entry Requirements — {countryData.name} — Country-Specific Rules',
     'Entry requirements for {countryData.name}'),
    ('English Test Requirements — {countryData.name} — Only Relevant Tests',
     'English tests accepted in {countryData.name}'),
    ('If not verified Check with counselor',
     'If a figure is not shown, ask a counselor'),
]
for old, new in replacements:
    if old in src:
        src = src.replace(old, new)
    else:
        print(f'  ! not found: {old[:70]}')

# Remaining generic "Check with counselor" phrasing (kept, but grammatical).
src = src.replace('Check with counselor if unavailable', 'Confirm with a counselor if unavailable')
src = src.replace('>Check with counselor<', '>Ask a counselor<')

# ── 2. Design tokens ────────────────────────────────────────────────────────
# Neutral text / surface utilities → tokens (the tokens are identical in value
# in light mode; this makes the page correct under .dark and keeps one palette).
token_map = {
    'text-gray-400': 'text-[var(--alo-text-muted)]',
    'text-gray-500': 'text-[var(--alo-text-muted)]',
    'text-gray-600': 'text-[var(--alo-body)]',
    'text-gray-700': 'text-[var(--alo-body)]',
    'text-gray-300': 'text-[var(--alo-border-strong)]',
    'bg-gray-50': 'bg-[var(--alo-page)]',
    'border-[#E2E8F0]': 'border-[var(--alo-border)]',
    'bg-[#FFFFFF]': 'bg-card',
    'bg-[#F8FAFC]': 'bg-[var(--alo-page)]',
    'text-[#0F172A]': 'text-[var(--alo-text)]',
    'text-[#0057B8]': 'text-[var(--alo-brand)]',
    'bg-[#0057B8]': 'bg-[var(--alo-brand)]',
    'bg-[#E8501A]': 'bg-[var(--alo-cta)]',
    'hover:bg-[#C93D13]': 'hover:bg-[var(--alo-cta-hover)]',
    'hover:border-[#0057B8]': 'hover:border-[var(--alo-brand)]',
    'text-blue-200': 'text-[#D6E6FF]',
}
for old, new in token_map.items():
    src = src.replace(old, new)

# 10px metadata → 11px (Master §04 minimum metadata size).
src = src.replace('text-[10px]', 'text-[11px]')

# Hero headline: 0.95 leading was clipping descenders at 60px.
src = src.replace(
    'text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] text-[var(--alo-text)]',
    'text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-[-0.025em] leading-[1.06] text-[var(--alo-text)]',
)

# Floating hero fact cards: keep the two primary ones, drop the two secondary
# ones on <sm so the photograph is not covered on a phone (Master §16).
src = src.replace(
    '<div className="absolute top-4 right-4 bg-white/95',
    '<div className="absolute top-4 right-4 hidden sm:block bg-white/95',
)
src = src.replace(
    '<div className="absolute bottom-4 left-4 bg-white/95',
    '<div className="absolute bottom-4 left-4 hidden sm:block bg-white/95',
)

open(PATH, 'w', encoding='utf-8').write(src)
print(f'PremiumCountryPage.tsx: {len(original)} -> {len(src)} bytes')
print('remaining build-instruction markers:',
      len(re.findall(r'— DB\b|Dynamic from DB|ESTIMATE ONLY|not hardcoded|real DB', src)))
