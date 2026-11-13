# Header, footer, partner branding, letterhead and official seal

Status: implemented on `main` (header/footer) and extended here (portal footer,
B2B partner footer, letterhead + seal). Last updated 2026-10-25.

This document answers the four questions in the brief:

1. Was the site-wide header/footer actually merged to `main`?
2. Is any part of it duplicated — especially the footer, or any contnt/product?
3. What does a signed-in student/employee see, and what changes for a student
   recruited through a B2B partner?
4. Where are the company letterhead and the official seal used, and who may use
   the seal?

---

## 1. Header and footer — already on `main`

| Surface | File | Mounted by |
| ------- | ---- | ---------- |
| Public header (logo + italic orange tagline, Destinations ▾, Course Finder, Services, Language Prep, Resources ▾, Portal ▾, AI SUPPORT ▾, **Book Free Counseling** CTA) | `src/components/website/PublicNavbar.tsx` | `src/components/website/PublicLayoutWrapper.tsx` (root layout) |
| Public footer (brand + tagline, socials in the fixed order Facebook → Instagram → LinkedIn → YouTube, Destinations, Quick Links, Company, Google Maps/WhatsApp/Mobile/Email/Address, moving 3-colour cap strip, ALO Orange bottom bar) | `src/components/website/PublicFooter.tsx` | same |
| Route policy (which pages get the public chrome) | `src/components/website/public-chrome-policy.ts` | — |
| Contact/social/policy single source of truth | `src/lib/alo-site-info.ts` | — |

Both components were merged in the `main` history (merge of PR #31) together
with their contract tests:

* `tests/unit/public-chrome-single-owner.test.ts`
* `tests/unit/public-brand-guideline.test.ts`

Those tests are the reason the header/footer cannot silently fork again: they
fail if the components are mounted anywhere except their single owner, and if the
copyright line appears in a second file.

## 2. Duplication removed in this change

| Duplicate | What was wrong | Fix |
| --------- | -------------- | --- |
| `src/app/employee/profile/page.tsx` | Wrapped the page in `EmployeePortalShell` **inside** `/employee/layout.tsx`, which already renders it → two headers, two sidebars, two footers | Page now renders only `EmployeeProfilePage` |
| `src/app/student/mock-tests/page.tsx` | Same double-shell problem (`StudentPortalShell` inside the student layout chrome) | Page now renders only `EnglishTestNotice` |
| `src/components/alo/app-shell.tsx` (220 lines) | Second, unreachable app chrome with its own footer and copyright bar | Deleted (no imports anywhere) |
| `src/components/alo/public-shell.tsx` (537 lines) | Second, unreachable public chrome: its own header, footer, social icons and CTA | Deleted (no imports anywhere) |
| `<footer>` inside course/university/guide content cards | Each page added a second `footer` landmark, so assistive tech announced two page footers and print styles duplicated page-footer content | Those content blocks are now `<div>`s; the only `<footer>` elements in the app are the two real footers |
| `/partner-admin/*` pages | Real Next.js routes with **no** footer at all (public chrome is suppressed on `/partner-admin`) | `src/app/partner-admin/layout.tsx` adds exactly one footer |
| `/application-manager/*` pages | No footer | `PortalFooter` mounted once in `src/app/application-manager/layout.tsx` |
| Logo referenced by three different filenames (including `/images/landing/Copy of logo.webp`, whose spaces are re-encoded by browsers, proxies and PDF renderers) | Possible different marks on screen and on paper | One registry: `src/lib/brand/brand-assets.ts` |

Guard test: `tests/unit/brand-chrome-partner-footer.test.ts` asserts

* exactly **two** files in `src/**` contain a `<footer>` element,
* `PortalFooter` is mounted exactly once in each signed-in chrome owner,
* no page mounts a portal shell that its layout already provides,
* `PublicNavbar`/`PublicFooter` are mounted only by `PublicLayoutWrapper`.

Content/product repetition: the footer link sets are disjoint (Destinations vs
Quick Links vs Company vs Policies) and the portal footer deliberately does not
repeat the marketing footer's four-column link block — it carries one compact
link set, one social row and one copyright line. `shouldShowPartnerFooter()`
requires a partner name **or** logo, so an empty partner strip can never render.

## 3. What a signed-in user sees

| Signed-in user | Footer |
| -------------- | ------ |
| ALO student (direct) | General ALO portal footer only |
| ALO employee / counselor / CRM admin / application manager | General ALO portal footer only |
| Student linked to a B2B partner | General ALO portal footer **plus** that partner's branded footer block |
| Partner's own staff (partner portal, partner-admin) | General ALO footer plus their own partner block |
| Public visitor | Public marketing footer (`PublicFooter`) — unchanged |

Implementation:

* `src/components/portals/PortalFooter.tsx` — general footer + optional partner block.
* `GET /api/portal/footer-context` — resolves the signed-in identity server-side
  (student session or portal session) and returns the partner branding, or
  `partner: null`. A client cannot request another partner's branding.
* `src/lib/partner/partner-branding-service.ts` — partner resolution order for a
  student: `PortalStudentProfile.partnerId` →
  most recent `Application.partnerId`. Anything unresolved means "no partner
  block"; nothing is guessed.

## 4. Partner logo and colour scheme

* Table: `PartnerBranding` (one row per B2B tenant; `partnerId` is unique).
  Migration: `prisma/migrations/20261025140000_partner_footer_branding`.
* Rules: `src/lib/partner/branding.ts` — colours must be six-digit hex; the logo
  must be an `https://` image URL or a ≤96 KB inline PNG/JPEG/WebP/GIF; text is
  bounded; the accent colour cannot collapse onto the other two; footer text
  colour is chosen for WCAG contrast.
* API: `GET/PUT /api/partner/branding`
  – a partner reads/writes **its own** tenant (taken from the session),
  – only `PARTNER_SUPER_ADMIN` (or an ALO Super Admin) may write,
  – writes are same-origin only and recorded in `AuditLog`.
* UI: `/partner-admin/branding` (`src/components/partner/PartnerBrandingPanel.tsx`)
  with upload + automatic resize, colour pickers, live preview, and a "show in
  footer" switch. Linked from the partner-admin nav and `/partner/settings`.

## 5. Letterhead and official seal

Assets (`public/images/brand/`):

| Asset | File | Use |
| ----- | ---- | --- |
| Logo | `alo-education-logo.webp` | Headers, footers |
| Official letterhead (A4) | `alo-edu-pad.jpg` | **Every** official document |
| Official seal | `alo-official-seal.png` | Super Admin-issued documents only |

Code: `src/lib/documents/official-documents.ts`

* `buildOfficialDocumentHtml()` always paints the letterhead as the A4 page
  background — there is no off-letterhead mode — inlines both assets as data
  URIs (so a downloaded or forwarded file still shows them) and prints the
  footer contact line, reference and Asia/Dhaka issue timestamp.
* `isSealAuthorized()` returns `true` for a **Super Admin session only**. Every
  other issuer gets the letterhead plus an explicit
  "Official seal withheld — issued without Super Admin authorisation" note, so
  a blank seal area can never be filled in later by someone else.
* Values are HTML-escaped; the documents are served with
  `Content-Security-Policy: default-src 'none'; img-src data:; style-src
  'unsafe-inline'; sandbox` and `Cache-Control: private, no-store`.

Wired into:

| Document | Route | Seal |
| -------- | ----- | ---- |
| Approved salary slip | `GET /api/employee/salary?download=<id>` (employee portal download) | Only when the downloader is a Super Admin; an employee's own copy says "seal withheld" |
| Offer letter | `GET /api/applications/[id]/offer-letter` (linked as "Official letterhead copy" in the application's Offer tab) | Super Admin only |

Additional document families listed in `OFFICIAL_SEAL.appliesTo`
(employment contract, experience letter, partnership agreement) must use the
same builder; no other HTML document generation should be added.

## 6. Verification

```bash
npx vitest run tests/unit/brand-chrome-partner-footer.test.ts \
                tests/unit/public-chrome-single-owner.test.ts \
                tests/unit/public-brand-guideline.test.ts
npm run typecheck          # after `npm run db:generate`
npm run build              # applies `prisma generate` first
```

The branding tests are pure (no database) and cover colour/URL/email validation,
logo-injection rejection, contrast selection, partner-block visibility, seal
authorisation, letterhead inlining and HTML escaping.
