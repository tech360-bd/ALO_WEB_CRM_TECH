# Public header / footer fix — 2026-11-03

**Scope:** every pre-login (before Portal login) page of the ALO Education site.
**Branch:** `arena/300b1e7d-alo-web-crm-tech`.

## 1. How "every page" is already guaranteed

`src/components/website/PublicLayoutWrapper.tsx` is mounted once from the root
`src/app/layout.tsx`. It renders `<PublicNavbar />` and `<PublicFooter />` for
every signed-out route accepted by `src/components/website/public-chrome-policy.ts`,
including `/student/login`, `/partner/login`, `/employee/login` and `/login`.
`tests/unit/public-chrome-single-owner.test.ts` guards that there is exactly one
owner (no duplicated header/footer/copyright in individual pages), and
`tests/unit/brand-chrome-partner-footer.test.ts` guards one footer landmark per
page. Authenticated portal shells keep their own chrome.

No per-page header/footer duplication was added — that would break the single-owner
contract.

## 2. Header (as required)

`src/components/website/PublicNavbar.tsx` renders, in order:

Logo (`ALO_BRAND_ASSETS.logo`) + italic orange tagline `Your Dream – Our Commitment`
→ **Destinations ▾** · **Course Finder** · **Services** · **Language Prep ▾** ·
**Resources ▾** · **Portal ▾** · **AI SUPPORT ▾** → **Book Free Counseling** CTA
(`/book-consultation`). Desktop dropdowns and the mobile Sheet/Accordion share
the same link sets. Labels come from `src/i18n/dictionaries.ts` (English +
বাংলা), so `AI SUPPORT` stays uppercase in English.

Language Prep is a dropdown rather than a plain link because the existing site has
12 English-test, 4 academic-test and 2 guidance pages; collapsing them would
remove working navigation. The label and position still match the brief.

## 3. Footer (as required)

`src/components/website/PublicFooter.tsx` renders:

- Logo + `Your Dream – Our Commitment`.
- Social icons in the fixed order **Facebook → Instagram → LinkedIn → YouTube**,
  using only the four official ALO account URLs in `ALO_SOCIALS`.
- **Destinations:** UK · Australia · Canada · Ireland · New Zealand · USA · Dubai.
- **Quick Links:** Course Finder · Services · Language Prep · Scholarships.
- **Company:** About Us · Contact Us · Global Offices · Code of Conduct ·
  Student Complaint Policy · AQF Compliance.
- Google location link, WhatsApp, Mobile, Email and the full Panthapath address.
- Decorative moving graduation-cap strip: 3 colour rows, 4 sequence copies each,
  infinite animation, `prefers-reduced-motion` supported.
- ALO Orange bottom bar with `© ALO Education. All rights reserved.`

Exact relative paths and their production `https://aloeducation.com/...` URLs are
listed in `docs/PUBLIC_SITE_LINK_MAP.md`. All 62 internal paths referenced by the
public chrome were verified to resolve to a real `page.tsx` or dynamic segment;
**no placeholder page had to be created**.

## 4. Defects fixed in this pass

| # | Defect | Fix |
| --- | --- | --- |
| 1 | `NEXT_PUBLIC_ALO_CONTACT_PHONE` / `NEXT_PUBLIC_ALO_WHATSAPP_NUMBER` were blank in both env examples, so `hasContactPhone` / `hasWhatsApp` were false and the footer **silently omitted** WhatsApp and Mobile on an unconfigured deployment | ALO-provided numbers compiled in as brand defaults in `src/lib/alo-site-info.ts`; env still overrides, and an invalid override falls back to the defaults instead of hiding the block |
| 2 | `Mobile: +8801805020101-10` produced `tel:+880180502010110` (a fabricated 15-digit number) | `dialDigits()` strips the display range suffix → `tel:+8801805020101` |
| 3 | Footer CTA read "Request Counseling" while the header and the brief (and the Playwright contract) say "Book Free Counseling" | Label aligned in `PublicFooter.tsx`; stale navbar comment corrected |
| 4 | Playwright colour assertions still expected the retired legacy palette (`rgb(243,112,33)` / black text / `#0066CC` caps) | Aligned to the accessible master palette in `tests/e2e/public-header.spec.ts` and `tests/e2e/public-footer.spec.ts`; cap-strip check now reads computed colours instead of a raw `style*=` attribute that browsers serialise as `rgb(...)` |
| 5 | Env examples said "blank values omit links" | Comments updated in `.env.example` and `.env.production.example` |

New regression test: `tests/unit/public-contact-defaults.test.ts` deletes both env
overrides before importing the module and asserts the exact contact defaults,
social order, policy routes, shared tagline and CTA label.

## 5. Brand palette decision

The brief names `#0066CC` / `#F37021` / `#FFB347`. This repo enforces an
accessible master palette (`#0057B8` / `#C93D13` / `#E8501A`) in
`src/app/globals.css`, and `tests/unit/design-tokens.test.ts` retires the three
legacy hexes because white-on-`#F37021` and the yellow accent fail the 4.5:1
text-contrast floor. **Decision: keep the accessible master palette.** The public
chrome therefore uses ALO blue/orange design tokens with a white CTA label; the
cap strip keeps three moving colour rows. No global CSS token was changed, so the
whole site stays visually consistent. Fonts remain self-hosted Montserrat
(headings) / Open Sans (body).

## 6. Verification performed

| Check | Result |
| --- | --- |
| `npm ci` | `NPM_CI_EXIT=0` |
| offline `npx prisma generate` + `node scripts/verify-prisma-client.mjs` | 618 models |
| `NODE_OPTIONS=--max-old-space-size=3400 npx tsc --project tsconfig.public-chrome-check.json --noEmit` | `TSC_EXIT=0` |
| scoped Vitest (6 brand/chrome/design files) | `6 passed`, `53 tests passed` |
| full Vitest | `341 passed / 13 skipped files`, `3739 passed / 148 skipped tests`, **8 unhandled Prisma query-engine errors → `VITEST_EXIT=1`** (environmental: no native engine binary in sandbox) |
| `npx playwright test --list` | `52 tests in 6 files`, `EXIT=0` (syntax/collection only) |
| `git diff --check` | clean |

## 7. Limitations (not claimed as done)

- **Playwright E2E was not executed**: its webServer needs `npm start` from a
  production build, and the production build is OOM-killed in this ~3.9 GB
  sandbox. Only test collection was verified.
- **No browser rendering** of any page was performed here; the header/footer
  contract is verified by source-level unit tests and the single-owner guard.
- The four social account URLs are configuration/content. Account ownership was
  **not independently verified** (no outbound access to those platforms in this
  workspace).
- Contact numbers are public display/contact details only; they do not prove
  number ownership, Meta WABA registration or WhatsApp Cloud API connectivity.
