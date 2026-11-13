# Site-wide footer (every page) — brand specification

Status: implemented; public-brand palette/link alignment updated 2026-10-19. Single source of truth for the public footer.

## 1. What the footer contains

| Block | Content |
| ----- | ------- |
| Brand | Logo + **ALO Education** wordmark + tagline *Your Dream – Our Commitment* |
| Social | Official accounts, fixed order **Facebook → Instagram → LinkedIn → YouTube** |
| Contact | Location (Google share link) · WhatsApp `+8801805020101` · Mobile `+8801805020101-10` · Email `info@aloeducation.com` · Address |
| Destinations | UK · Australia · Canada · Ireland · New Zealand · USA · Dubai (exact order) |
| Quick Links | Course Finder · Services · Language Prep · Scholarships |
| Company | About Us · Contact Us · Global Offices · Code of Conduct · Student Complaint Policy · AQF Compliance |
| CTA | **Book Free Counseling** (ALO Orange) → `/book-consultation` |
| Decorative strip | Graduation-cap icons in three ALO brand colours (`#0066CC`, `#F37021`, `#FFB347`), always moving (paused for `prefers-reduced-motion`) |
| Bottom bar | ALO Orange bar: **© ALO Education. All rights reserved.** + legal links (black text on `#F37021`; white text is 2.94:1, black is 7.15:1) |

No B2B / partner-recruitment content is published in the footer (`Become A Partner`,
`Partner Portal`, `Partner Login`, `B2B` none of them appear), and a Playwright
assertion fails if that changes.

## 2. Where it renders

`src/components/website/PublicFooter.tsx` is mounted once by
`src/components/website/PublicLayoutWrapper.tsx` in the root layout, so one
component covers every public page. It is suppressed (see
`src/components/website/public-chrome-policy.ts`) on auth entry screens
(`/login`, `/register`, `/forgot-password`, `/reset-password`) and inside every
authenticated shell (`/student`, `/partner`, `/employee`, `/portal`, `/admin`,
`/crm`, `/counselor`, `/dashboard`, `/super-admin`, `/application-manager`,
`/partner-admin`).

Signed-in pages are not footer-less: every authenticated chrome owner mounts
`src/components/portals/PortalFooter.tsx` exactly once. A signed-in ALO student
or employee sees the general portal footer only; a student recruited through a
B2B partner additionally sees that partner's branded block (logo + colour
scheme). There is still only ONE `<footer>` element per page. See
`docs/BRAND-CHROME-PARTNER-BRANDING-AND-LETTERHEAD.md`.

## 3. One source of truth for contact data

`src/lib/alo-site-info.ts` now holds the address, mobile range, WhatsApp link,
email, Google location link, the ordered `ALO_SOCIALS` list and the policy page
paths. Values were verified against the live site (`aloeducation.com/contact`,
fetched 2026-10-13): mobile range `+8801805020101-10`, `info@aloeducation.com`,
Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205,
`wa.me/8801805020101`.

Consumers:

* `src/components/website/PublicFooter.tsx` — contact block, socials, policy links
* `src/components/website/PublicNavbar.tsx` — utility strip (address, Maps, phone)
  and the mobile menu note
* `src/components/website/HomepagePart4.tsx` — homepage "Call / WhatsApp ·
  Email · Visit Us" block (previously advertising a third office: *Suite 12B,
  Green Tower, Gulshan-2*)
* `src/app/code-of-conduct`, `src/app/student-complaint-policy`,
  `src/app/aqf-compliance`

Official account links (used verbatim from the existing codebase records, see
`src/components/alo/public-contact.tsx` and `src/components/alo/public-shell.tsx`):

| Platform | URL |
| -------- | --- |
| Facebook | https://www.facebook.com/aloeducation |
| Instagram | https://www.instagram.com/aloeducation |
| LinkedIn | https://www.linkedin.com/company/aloeducation |
| YouTube | https://www.youtube.com/@aloeducation (handle confirmed: page titled "Alo Education") |

> If any handle above is not the account ALO Education wants publicised, change
> it in `src/lib/alo-site-info.ts` — the footer, header and contact page follow.

## 4. Required company pages and footer routes

| Route | File | Purpose |
| ----- | ---- | ------- |
| `/global-offices` | `src/app/global-offices/page.tsx` | Existing Dhaka office and destinations information; now included in the required Company links and anonymous route allowlist |
| `/code-of-conduct` | `src/app/code-of-conduct/page.tsx` | Six conduct standards, written-fee transparency, no-guarantee rule, document integrity, confidentiality, "what we will never do", escalation |
| `/student-complaint-policy` | `src/app/student-complaint-policy/page.tsx` | How to complain (WhatsApp/email/phone), acknowledgement within 2 working days, written outcome within 10, appeal to the CEO within 20/15, records for 3 years, direct-to-university route |
| `/aqf-compliance` | `src/app/aqf-compliance/page.tsx` | UK **Agent Quality Framework** (British Council + UK universities) standards ALO works to, what ALO does *not* claim, plus the **Australian Qualifications Framework** explanation (levels 7–10 table, CRICOS + aqf.edu.au links) for Australia-bound students |

Both meanings of "AQF" are stated explicitly on the page so the compliance
statement cannot be read as an accreditation claim: ALO Education is described
as a private consultancy in Dhaka, not a university or awarding body, and the
page links the British Council pages and certified-counsellor database for
verification.

Routing wiring (required — both lists previously omitted these paths, so the
pages would have 307-redirected anonymous visitors to `/login`):

* `src/proxy.ts` → `PUBLIC_ROUTES` gained `/global-offices`, `/code-of-conduct`,
  `/student-complaint-policy`, `/aqf-compliance`, and later `/guides` (the
  published editorial guides index, already advertised in `sitemap.ts`, was
  still being redirected to `/login`)
* `src/app/sitemap.ts` → static entries added (monthly, priority 0.3)

## 5. Verification performed (current palette/link alignment, 2026-10-19)

| Check | Result |
| ----- | ------ |
| Targeted ESLint on public chrome, public components, public routes and tests | passed |
| Scoped TypeScript check on public header/footer, contact page, language-prep components, global offices, and UI controls (excluding the root server layout) | passed |
| Root-layout-inclusive TypeScript check | blocked because `npm ci --ignore-scripts` leaves the generated Prisma client absent (`@prisma/client` exports `Prisma`/`PrismaClient` missing); no public-source diagnostic was reported |
| `npx vitest run tests/unit/english-exam-cta.test.ts` | 21 passed |
| `npx playwright test tests/e2e/public-header.spec.ts tests/e2e/public-footer.spec.ts --list` | 24 tests parsed; browser execution not run because this sandbox has no Playwright browser binary |
| `git diff --check` | passed |
| Footer contracts | required links are pinned in the requested order; CMS can append safe same-origin internal links without replacing required entries |
| Cap strip | 3 colour rows (`#0066CC`, `#F37021`, `#FFB347`), 52 caps per row, seamless `-25%` marquee (one sequence × 4 copies), infinite animation, reduced-motion respected |
| Bottom bar | ALO Orange `#F37021` background, black text, `© <year> ALO Education. All rights reserved.` |

No live customer communications were sent. Browser-level checks remain to be run
in an environment with the Playwright browser installed.

## 6. Still open

* The homepage "Become A Partner / Partner Login" recruitment section
  (`HomepagePart3`) is **not** part of the footer and was left untouched; say the
  word and it can be removed too.
* CMS footer items are additive only: the required lists remain first, in the
  specified order. Published CMS items may append safe same-origin internal
  links; external/unsafe links and duplicates of required entries are ignored.
