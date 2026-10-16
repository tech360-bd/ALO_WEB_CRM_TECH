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
