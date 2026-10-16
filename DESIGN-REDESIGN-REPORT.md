# ALO Education — Complete Website + CRM Visual Redesign: Implementation Report

Master prompt applied to the **existing** project only. No routes, APIs, auth,
schemas or workflows were changed; no page was rebuilt or removed.

## 1. Design tokens (Master §03/06/17) — `src/app/globals.css`
- Brand Blue `#0057B8`, Deep `#003F87`, Light `#EAF3FF`, Pale `#F4F8FF`;
  CTA Orange `#E8501A`, Deep Orange `#C93D13`, Pale Orange `#FFF1EA`.
- Text: Main `#0F172A`, Body `#334155` (new `--alo-body`), Secondary `#64748B`,
  Muted/Placeholder `#64748B`; Backgrounds `#FFFFFF` / `#F8FAFC`;
  Borders `#E2E8F0` / `#CBD5E1`.
- Semantic: Success `#10B981`, Warning `#F59E0B`, Danger `#EF4444`, Info `#0284C7`.
- Status badges (§13) as exact tokens: success `#ECFDF5/#047857/#A7F3D0`,
  pending `#FFFBEB/#92400E/#FDE68A`, error `#FEF2F2/#B91C1C/#FECACA`,
  info `#EFF6FF/#1D4ED8/#BFDBFE`, neutral `#F1F5F9/#475569/#E2E8F0`.
- Shadows (§06): card `0 2px 8px rgba(15,23,42,.04)`, hover `.08`, floating `.12`,
  modal `0 24px 64px rgba(15,23,42,.16)`; radius input `10px`, button `12px`,
  card `16px`, feature `20px`.
- Tailwind palette remap in `@theme` (`blue-600→#0057B8`, `orange-500→#E8501A`, …)
  so legacy utility classes resolve to master colours — one source of truth.
- Global `prefers-reduced-motion` support (§15) and brand selection colour.
- Typography: retained the previously mandated self-hosted brand fonts
  (Montserrat/Poppins headings, Open Sans/Roboto body, Bengali system chain) —
  the master prompt lists Inter/Noto as *suggestions* ("or a comparable clean
  sans-serif"); switching would contradict the earlier explicit brand spec.

## 2. Shared primitives (§06/07/09/12/14)
- `Button`: **every size ≥ 48px**; secondary = white/blue text/`#BFDBFE` border/
  `#EAF3FF` hover; tertiary = transparent/blue/`#F4F8FF` hover; orange reserved
  for primary conversion; focus ring brand blue.
- `Card`: 16px radius, card shadow, 24px padding. `Input`/`Select`: 48px, 10px
  radius, `#CBD5E1` border, blue focus. `Textarea`: 10px radius.
- `Table`: header `#F8FAFC` bg + `#64748B` text (via tokens), row hover
  `#F4F8FF`, selected `#EAF3FF`. `Badge`: §13 semantic variants.
- `Dialog`/`AlertDialog`: 20px radius + modal shadow. Dropdown/Popover/Select
  panels: 12px radius + floating shadow. Tabs: active = light-blue/blue.

## 3. Palette sweep
All hardcoded legacy hexes (`#2563EB`, `#F97316`, `#0066CC`, `#F37021`,
`#1D4ED8`, `#EA580C`, `#003D7A`, `#16A34A`, `#DC2626`, `#7C3AED`, …) across
`src/components`, `src/app`, `src/lib` (329+ files, incl. emails, brand-kit
defaults, marketing creative) replaced with master colours — verified **0**
legacy brand hexes remain. Brand-kit defaults and its safety test updated.

## 4. Heroes (§08)
- Homepage: rebuilt as **Variant A editorial split** — white background, H1 in
  `#0F172A` with the country in brand blue, body `#334155`, orange primary CTA,
  rounded landmark photo on a pale-blue panel, white floating info card.
  **The previous dark photo overlay was removed** ("never use dark overlays").
- Destination hero: already split/no-overlay; removed invented floating claims
  ("35+ Verified", "Up to 50% Tuition Waiver") — now shows the real catalogue
  count and the country's recorded tuition range only.
- English-test comparison table header restyled to the master table system.

## 5. Sections & CRM (§11/12)
- Homepage final CTA: blue-gradient dark block → **Pale Orange `#FFF1EA`**
  conversion panel, main-text heading, orange + white/blue actions.
- Header nav text → Body `#334155` (hover/active brand blue); footer links
  hover brand blue; cap strip colours updated to `#0057B8/#E8501A/#FFB347`.
- CRM shells audited: white sidebar, `#EAF3FF` active + slim blue indicator,
  `#F8FAFC` canvas, white top bar — already master-compliant; sub-48px button
  overrides in portal shells removed. Gradients restricted to same-family
  brand blue/orange (`animations.ts`).
- 87 public `Button` call sites raised from 40/44px to 48px; Course Finder
  Apply/View/intake controls raised to 48px.

## 6. Verification
- New `tests/unit/design-tokens.test.ts` (5 tests) guards palette, §13 tints,
  shadows/radius, 48px buttons and the no-dark-overlay hero.
- TypeScript clean on all redesign files; ESLint clean.
- Full unit suite: **1885 passed / 11 failed** vs clean-tree baseline
  **1877 passed / 11 failed** — identical failure set (pre-existing, DB-mock
  related), **zero regressions**, +8 new passing tests.

## Explicitly unverified / unchanged by design
- Browser visual-regression (Playwright screenshots) could not run in this
  sandbox: Prisma engine binaries cannot be downloaded here (blocked host),
  so the app cannot boot with a database. Run `tests/e2e/public-*.spec.ts`
  in an environment with `prisma generate` access for pixel-level checks.
- Country flag glyphs remain in destination selectors (country symbols, not
  action icons); all actions use the Lucide icon system.
- Dark-mode token roles were aligned to the new palette; the public site
  renders in light mode by default per §02 (no black sections).

---

# Phase 2 — Complete-site premium rollout, image correction & CRM polish (this brief)

Verified before editing: branch `arena/8e2beff7-alo-web-crm-tech`, HEAD `847c5884`, clean tree; baseline guard tests 8/8 green.

## Inventory performed
- 413 `page.tsx` routes enumerated (public site, destinations, courses, tools, blog, admin/CRM, student/counsellor/partner portals, auth).
- CRM shells audited (`StudentPortalShell`, `EmployeePortalShell`, `src/components/crm/*`): white sidebar/topbar, `#F8FAFC` canvas, Light Blue active nav, shared `ui/*` primitives already inherit the master system from Phase 1 (buttons/inputs ≥48px, master badges, tables, dialogs, dropdowns, tabs). No logic, RBAC or workflow code touched.
- Image audit: all 36 static `/images/*` references resolve to files in `public/`; the only remote image URLs (51) live in `src/components/alo/views/*` (legacy SPA shell views), which are **not imported by `src/app`** and therefore not served — recorded, not modified. `next.config` remote hosts remain as configured.

## Image corrections (Brief §6)
- Verified visually that `public/images/cards/*.png` are relevant landmark photography (e.g. London, Sydney Opera House) while `hero-banners/*.webp` are graphic promotional banners. Destination cards now use the photographic assets:
  - `ImageMapping.ts`: new `DESTINATION_CARD_IMAGES` + `destinationCardImage()` for UK, USA, Canada, Australia, Ireland, New Zealand, Dubai.
  - `HomepagePart1.tsx`: hero fallback slides use photographic landmarks; destination cards gained 16/10 photographic headers (`object-cover`, lazy, alt text, `shadow-card`, hover zoom, hover border `#BFDBFE`, 24px radius).
  - `TopUniversitiesSection.tsx` and `MasterCountryDestinationView.tsx`: country images switched from banner graphics to the same photographic set.
  - `HomepagePart2.tsx` course cards: subject-matched image headers via `IMAGES.courses` map; the unverified claim "chosen by thousands of students worldwide" was removed from the section subtitle.
  - Asset-existence + remap regression tests added (`design-tokens.test.ts`, image-integrity describe).

## CRM KPI upgrade (Brief §7–8)
- `CrmAdminDashboard.tsx`: KPI cards now use 16px radius, `shadow-card → hover:shadow-hover`, `#EAF3FF` icon tiles, and `CountUp` on real numeric API fields only.
- New `src/components/ui/count-up.tsx`: animates only caller-supplied real values (700ms ease-out cubic), renders non-numeric API strings unchanged, respects `prefers-reduced-motion`, and exposes the final value via `aria-label`. Trend badges render only when the API marks the comparison `changeMeasured` — no invented growth data, charts or metrics anywhere.

## Token cleanup across all CRM/AI surfaces
- `globals.css` `@theme`: legacy purple/violet/indigo utilities now resolve to the master Information-blue family (`#0284C7`/`#0057B8`/`#003F87`), removing off-palette accents from AI-studio/analytics/notification views without touching any logic.
- `AloShortFormBuilder.tsx`: slate-900 buttons and blue→indigo gradient replaced with Brand/Deep Blue. (Its slate-950 image-preview overlay is an intentional image-card text treatment, retained.)
- Popular Courses tabs raised to ≥48px touch targets.

## Verification (Phase 2)
- `npx tsc --noEmit --skipLibCheck`: no errors in any changed file (repository-wide `@prisma/client` errors are the known sandbox Prisma-engine limitation, identical on the clean tree).
- ESLint: clean on all changed files.
- Unit suite: 1887 passed / 11 failed / 28 skipped — same 11 pre-existing failures as the clean-tree baseline (1877 passed), zero new failures; +2 new passing guards this phase (image integrity, purple remap).
- NOT RUN (blocked): live browser/screenshot + Playwright checks — Prisma engines cannot download in this sandbox (`binaries.prisma.sh` TLS-blocked) and the stale dev-SQLite schema generator refuses the current schema, so the app cannot boot here. This remains unverified; run `npx playwright test` + manual screenshot review in a database-capable environment.

## Remaining / unverified
- Same as Phase 1: browser visual QA per route family (spacing at wide/narrow widths) and route/integration tests requiring a database.
- 51 remote Unsplash URLs exist only in unrouted legacy views (`src/components/alo/views/*`); replace with local assets if those views are ever re-mounted.
