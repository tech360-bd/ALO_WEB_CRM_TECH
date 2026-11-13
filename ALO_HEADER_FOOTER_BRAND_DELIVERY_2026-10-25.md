# ALO Education — Header, Footer, B2B Branding & Official Seal: Delivery Report

Date: 2026-10-25

## 1. Why "header/footer is not in main" looked true — and what actually happened

The public header and footer **were already merged into `main`** (public navbar/footer
spec: PR #31; signed-in portal footer + B2B partner branding + letterhead/seal: PR #33,
merged the same day this report was written). The perceived absence came from the areas
that were genuinely missing or duplicated around them, not from a lost branch.

Two sessions implemented the same brief in parallel. PR #33 landed first and is the base
implementation on `main`. This branch (PR #34) was then **rebased onto the new `main` and
reconciled into a hardening layer**, so nothing exists twice:

- Dropped from PR #34's original commit (already provided by PR #33): `PartnerBranding`
  model + migration, `/api/partner/branding`, the partner branding editor, the portal
  footer component + `/api/portal/footer-context`, the letterhead document builder, the
  payslip/offer-letter wiring, the nested-shell fixes, and the brand-asset registry.
- Kept from PR #34 (not covered by PR #33): everything in sections 2–5 below.

## 2. Security fix — the official seal is no longer a public file ⭐

PR #33 stored the official company seal at `public/images/brand/alo-official-seal.png`,
i.e. **anyone on the internet could download the seal by URL** and stamp forged documents —
defeating the rule that only a Super Admin may use it.

Now:

- Seal bytes live only at `src/lib/documents/assets/alo-official-seal.png` (transparent-
  background rendering of the supplied seal; the original is kept next to it, also
  server-only). The `public/` copy and its brand-registry URL are deleted.
- Server-rendered documents (salary slip, offer letter) embed the seal via
  `buildOfficialDocumentHtml`, which reads the asset **only when the seal is authorised**.
- On-screen previews load it from `GET /api/official-documents/seal`, which requires an
  official document kind, re-checks `isSealAuthorized`, and writes an
  `OFFICIAL_SEAL_ACCESSED` audit record **before** responding (fail closed: audit
  failure → 503, no seal served).
- `isSealAuthorized` now also denies **acting-as / view-as sessions** even for a Super
  Admin actor, and still rejects `ADMIN` and `PARTNER_SUPER_ADMIN`.
- Standalone bundles trace the seal file into exactly three routes
  (`/api/employee/salary`, `/api/applications/[id]/offer-letter`,
  `/api/official-documents/seal`) via `outputFileTracingIncludes`.

## 3. Footer coverage gaps closed (still exactly one footer per page)

- `MarketingHubShell` now mounts the shared `PortalFooter` like every other shell.
- A signed-in user browsing a public-chrome route (e.g. `/course-finder` after login)
  previously got **no footer at all** (public chrome is suppressed when authenticated).
  `PublicLayoutWrapper` now renders a guarded fallback portal footer that appears only
  when no shell/layout footer (`#alo-portal-footer`) and no public footer
  (`#alo-public-footer`) exists in the DOM, and withdraws if one mounts. Exactly one
  footer is ever visible — never zero, never two.
- The partner portal sidebar now applies the partner's own branding (logo image, display
  name, primary colour) resolved server-side from `/api/portal/footer-context`,
  complementing the partner footer block and the `/partner-admin/branding` editor.

## 4. Official documents

- HR Agreement Center (`/crm/hrm/agreements`) gained an official-letterhead preview
  (appointment letters → `offer-letter`, other agreements → `employment-contract`). The
  seal toggle is enabled only for a Super Admin UI session, and the seal API re-checks
  and audits server-side regardless. Preview-only: saving behaviour is unchanged.
- All official documents continue to render on the supplied letterhead artwork with the
  current official contacts.

## 5. Duplication removed

- Deleted the byte-identical duplicated asset tree `public/public/**` (52 files +
  stray `robots.txt`; hash-verified identical to `public/**`). Legacy `/public/...`
  URLs resolve through a single rewrite (`/public/:path* → /:path*`) to the one
  canonical asset.

## 6. Verification

- Unit: 8 relevant suites / 78 tests pass, including PR #33's brand-chrome suite (updated
  only where the seal's location intentionally changed, plus new acting-as and
  no-public-seal assertions) and new `tests/unit/official-seal-hardening.test.ts`.
- ESLint clean on all touched files; `tsc` reports no errors in touched files (86
  pre-existing errors elsewhere stem from the sandbox being unable to run
  `prisma generate`; CI/production build generates the client).
- Runtime smoke (dev server): anonymous requests to `/api/official-documents/seal`,
  `/api/portal/footer-context`, `/api/partner/branding` all return 401; the former
  public seal URL no longer serves image bytes; canonical and legacy
  (`/public/...`) letterhead URLs both return 200.
- A Super-Admin-sealed sample payslip was generated through the production document
  builder to confirm the server-only seal embeds correctly, and an acting-as sample
  correctly produced the "Official seal withheld" note instead.

## 7. Deploy / operations

- No new migration in PR #34. The `PartnerBranding` table from PR #33 requires
  `prisma migrate deploy` in production (migration `20261025140000_partner_footer_branding`).
- Existing external links to `/public/...` asset URLs keep working via the rewrite.
- Anyone who previously bookmarked/downloaded the seal from the short-lived public URL
  cannot be un-downloaded; if that window matters, consider it in the seal's trust model
  for documents issued before this change.

## 8. Open item for management

The printed letterhead artwork still shows the old phone/email (+8801327189194-8 /
info@aloeducon.com). Generated documents show the current official contacts
(+8801805020101-10 / info@aloeducation.com) from `src/lib/alo-site-info.ts`. Please supply
refreshed pad artwork if the printed pad itself must match.
