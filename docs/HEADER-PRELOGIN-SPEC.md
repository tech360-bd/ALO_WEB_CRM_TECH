# Public header — every page BEFORE login (brand specification)

Status: implemented 2026-10-13. Single source of truth for the marketing header.

## 1. What the header must contain

| # | Element | Detail |
| - | ------- | ------ |
| 1 | Logo | `/images/landing/Copy of logo.webp` + wordmark **ALO Education** (Education Blue `#0066CC`, Montserrat ExtraBold) |
| 2 | Tagline | *Your Dream – Our Commitment* — italic, ALO Orange `#F37021` |
| 3 | Destinations ▾ | dropdown; CMS navigation → countries table → curated fallback |
| 4 | Course Finder | `/course-finder` |
| 5 | Services | `/services` |
| 6 | Language Prep | `/language-prep` |
| 7 | Resources ▾ | 10 curated links (Blogs → FAQs) |
| 8 | Portal ▾ | Student `/student/login` · Partner `/partner/login` · Employee `/employee/login` |
| 9 | AI SUPPORT TOOLS ▾ | AI Course Match, AI Scholarship Match, AI Visa Coach, AI SOP Helper, AI CV Helper, Eligibility Check |
| 10 | CTA button | **Book Free Counseling** (ALO Orange) → `/book-consultation` |

Order, labels and the ▾ affordances are asserted by
`tests/e2e/public-header.spec.ts` (menu order is checked by x-coordinate, so a
future reshuffle fails CI).

The header is a single component — `src/components/website/PublicNavbar.tsx` —
mounted once for the whole public site by
`src/components/website/PublicLayoutWrapper.tsx` from the root layout
(`src/app/layout.tsx`). No page renders its own copy, so "every page before
login" cannot drift page-by-page.

## 2. Where it renders

* **Rendered:** every public/marketing route (`/`, `/destinations`, `/course-finder`,
  `/services`, `/language-prep`, `/resources`, `/faqs`, `/universities`, `/visa`,
  `/scholarships`, `/blog`, `/english-test-prep`, `/book-consultation`, …) while the
  visitor is not authenticated.
* **Deliberately not rendered** (`src/components/website/public-chrome-policy.ts`,
  unchanged): auth entry screens (`/login`, `/register`, `/forgot-password`,
  `/reset-password`) and every authenticated shell (`/student`, `/partner`,
  `/employee`, `/portal`, `/admin`, `/crm`, `/counselor`, `/dashboard`,
  `/super-admin`, `/application-manager`). Those screens render standalone by
  design and are covered by the same e2e spec.

## 3. Brand tokens used

All colours and fonts come from the design tokens in `src/app/globals.css`
(no hex literals for brand colours inside the component):

| Token | Value | Use |
| ----- | ----- | --- |
| `--alo-brand` | `#0066CC` Education Blue | wordmark, links, dropdown hover, utility strip |
| `--alo-brand-hover` / `--alo-brand-deep` | `#0052A3` / `#003D7A` | hover/active states |
| `--alo-brand-light` / `--alo-brand-border` | `#E6F2FF` / `#B3D9FF` | menu hover surfaces |
| `--alo-cta` | `#F37021` ALO Orange | tagline + CTA button |
| `--alo-cta-hover` / `--alo-cta-active` | `#D95D12` / `#B64A0B` | CTA hover/active |
| `--alo-accent` (`--alo-cta-accent`) | `#FFB347` | dropdown hairline, utility-strip icons |
| `--alo-text` / `--alo-text-secondary` | `#000000` / `#555555` | menu labels, secondary copy |

`--primary`, `--ring`, `--accent`, charts and sidebar tokens were moved to the
same blue/orange pair so CRM/portal surfaces stay consistent with the public site.

## 4. Typography

Brand spec: **Headings Montserrat/Poppins Bold**, **Body Open Sans/Roboto**.

* Latin webfonts are **self-hosted** in `public/fonts/*.woff2` (Montserrat
  600/700/800, Poppins 600/700, Open Sans 400/600 + 400 italic, Roboto 400/500/700,
  ~190 KB total, Latin subset) and declared with `@font-face` in `globals.css`.
* No third-party font CDN is contacted, so the production CSP
  (`font-src 'self' data:`, `style-src 'self' 'unsafe-inline'`) needs no change.
  `src/proxy.ts` gained a `fonts` entry in the static-asset allow-list — without
  it the auth proxy redirected `/fonts/*.woff2` to `/login`.
* Tokens: `--alo-font-heading` (Montserrat → Poppins → system → Noto Sans Bengali)
  and `--alo-font-body` (Open Sans → Roboto → system → Noto Sans Bengali), exposed
  as the `font-heading` / `font-sans` Tailwind utilities. Headings (`h1`–`h6`)
  use the heading stack globally; Bengali text keeps falling through to the
  OS/Noto Bengali chain.
* `src/app/layout.tsx` no longer declares the unused `inter`/`geistMono` stubs and
  sets `themeColor` / `msapplication-TileColor` to `#0066CC`.

## 5. i18n

`src/i18n/dictionaries.ts` gained `nav.portal` and `nav.aiSupportTools` (EN + বাংলা);
`cta.bookConsultation` now reads **Book Free Counseling** in English
(Bangla remains `ফ্রি পরামর্শ নিন`). The header reads every label through `t()`,
and the EN|বাংলা toggle lives in the blue utility strip.

## 6. Verification performed

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` limited to the header sub-graph (layout, navbar, toggle, ui, i18n, proxy) | clean (a full-project run needs the CI memory budget) |
| `npx eslint` on every touched file | clean |
| `GET /` and 15 public routes on a live dev server | 200, `#alo-public-header` present, CTA label correct |
| Rendered menu order in SSR HTML | Destinations · Course Finder · Services · Language Prep · Resources · Portal · AI SUPPORT TOOLS · Book Free Counseling |
| `GET /fonts/montserrat-latin-700-normal.woff2` | 200 `font/woff2` |
| `vitest run tests/unit/catalogue-phase1-proxy.test.ts tests/unit/catalogue-phase1-review-publication.test.ts` | 21 passed (static-asset allow-list incl. `/fonts/*`) |
| `tests/e2e/public-header.spec.ts` | added (runs in CI: header on every public route, menu order, dropdowns, mobile sheet, header scope) |

Known environment limits while developing this change: no MySQL/Prisma query
engine in the sandbox (`npm run build` requires the MySQL engine download), so the
production build and the Playwright suite must be run in CI.
