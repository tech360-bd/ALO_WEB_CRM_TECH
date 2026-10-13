# Site-wide footer (every page) — brand specification

Status: implemented 2026-10-13. Single source of truth for the public footer.

## 1. What the footer contains

| Block | Content |
| ----- | ------- |
| Brand | Logo + **ALO Education** wordmark + tagline *Your Dream – Our Commitment* |
| Social | Official accounts, fixed order **Facebook → Instagram → LinkedIn → YouTube** |
| Contact | Location (Google share link) · WhatsApp `+8801805020101` · Mobile `+88 01805 020101-10` · Email `info@aloeducation.com` · Address |
| Destinations | UK · Australia · Canada · Ireland · New Zealand · USA · Dubai (exact order) |
| Quick Links | Course Finder · Services · Language Prep · Scholarships |
| Company | About Us · Contact Us · Code of Conduct · Student Complaint Policy · AQF Compliance |
| CTA | **Book Free Counseling** (ALO Orange) → `/book-consultation` |
| Decorative strip | Graduation-cap icons in three ALO brand colours, always animating (paused for `prefers-reduced-motion`) |
| Bottom bar | ALO Orange bar: **© ALO Education. All rights reserved.** + legal links (black text on #F37021 — white would be 2.94:1 and fail WCAG AA) |

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
`/crm`, `/counselor`, `/dashboard`, `/super-admin`, `/application-manager`).

## 3. One source of truth for contact data

`src/lib/alo-site-info.ts` now holds the address, mobile range, WhatsApp link,
email, Google location link, the ordered `ALO_SOCIALS` list and the policy page
paths. Values were verified against the live site (`aloeducation.com/contact`,
fetched 2026-10-13): phone `+88 01805020101-10`, `info@aloeducation.com`,
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

## 4. New pages created for the footer links

| Route | File | Purpose |
| ----- | ---- | ------- |
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

* `src/proxy.ts` → `PUBLIC_ROUTES` gained `/code-of-conduct`,
  `/student-complaint-policy`, `/aqf-compliance`
* `src/app/sitemap.ts` → static entries added (monthly, priority 0.3)

## 5. Verification performed

| Check | Result |
| ----- | ------ |
| `npx eslint` on every touched file | clean |
| `npx tsc --noEmit` on a scoped project (footer, header, layout, new pages, `alo-site-info`, ui, i18n, proxy) | clean |
| `GET /` + 8 public routes on a live dev server | 200, `#alo-public-footer` present on each |
| Rendered footer HTML | socials in order Facebook → Instagram → LinkedIn → YouTube; Destinations/Quick Links/Company in exact order; contact links `share.google/...`, `wa.me/8801805020101`, `tel:+8801805020101`, `mailto:info@aloeducation.com` |
| `GET /code-of-conduct`, `/student-complaint-policy`, `/aqf-compliance` | 200 (no `/login` redirect), header + footer rendered |
| Cap strip | 3 colour rows (`#0066CC`, `#F37021`, `#FFB347`) with live keyframe animations |
| Bottom bar | ALO Orange `#F37021` background, black text, `© <year> ALO Education. All rights reserved.` |
| `tests/e2e/public-footer.spec.ts` | added — columns/order, social order + hrefs, every column link resolves < 400, contact details, cap strip colours, no B2B text, footer scope |

Sandbox limits: no MySQL/Prisma query engine and no browser binaries, so
`next build` and the Playwright suite run in CI, not here (same note as
`docs/HEADER-PRELOGIN-SPEC.md`).

## 6. Still open

* The homepage "Become A Partner / Partner Login" recruitment section
  (`HomepagePart3`) is **not** part of the footer and was left untouched; say the
  word and it can be removed too.
* CMS override: `/admin/website-cms` footer items still take precedence over the
  compiled column defaults. If published footer items exist in the database,
  they will replace the Destinations / Quick Links / Company lists above —
  clear them to keep the brand-exact lists.
