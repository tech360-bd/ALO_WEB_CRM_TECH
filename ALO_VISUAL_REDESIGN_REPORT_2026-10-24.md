# ALO Education — Website + CRM Visual Redesign

**Implementation report — 24 October 2026**
Branch: `arena/65a95bf2-alo-web-crm-tech` · Base: `cead8141` (main) · Repo: `tech360-bd/ALO_WEB_CRM_TECH`

This is an **implementation** report, not a design proposal. Every item below was
applied to the existing project; no page, route, workflow, API, schema, permission
or content record was rebuilt, replaced or removed.

---

## 1. Reading guide

| Section | What it tells you |
|---|---|
| §2 | The one-paragraph summary |
| §3 | What the design system is now (tokens, utilities, primitives) |
| §4 | File-by-file changes, grouped by surface |
| §5 | Automated transformations, with exact counts and how to re-run them |
| §6 | Verification results (commands + output) |
| §7 | Contrast and accessibility decisions, with the arithmetic |
| §8 | **What is NOT done / not verified** — read this before shipping |
| §9 | Reproducing and reviewing the work |

---

## 2. Summary

The repository already *contained* the brand palette, the type scale and most of the
component primitives — but the palette was written as raw hex in ~9,700 class
strings, neutral greys were taken from Tailwind's default `gray`/`slate` scales
(~9,200 more), tiny 8–10 px type was used in 1,846 places, ~15 semantic utility
classes (`alo-shadow-*`, `crm-*-title`, `nx-*`, `bg-alo-gradient`, …) were
referenced but never defined, and several surfaces rendered internal build notes to
visitors. That is why the product looked flat and inconsistent even though each
individual screen had been "designed".

This pass **makes the theme the single source of colour**, raises type to the
specified floor, defines every referenced utility, converts dark/black panels to
brand surfaces, and repairs public copy — across **566 files**, with all existing
behaviour intact.

Result: `tsc` clean, ESLint clean, **2,719 tests passing / 75 skipped / 0 failing**
(one new test added), and zero undefined CSS variables beyond three known shadcn
artefacts.

---

## 3. The design system as it now stands

### 3.1 Tokens (`src/app/globals.css`, 996 lines)

`@theme inline` maps every brand value to a Tailwind colour utility:

```
--color-alo-brand          → #0057B8      --color-alo-cta        → #E8501A
--color-alo-brand-hover    → #003F87      --color-alo-cta-hover  → #C93D13
--color-alo-brand-light    → #EAF3FF      --color-alo-cta-soft   → #FFF1EA
--color-alo-brand-pale     → #F4F8FF      --color-alo-cta-accent → #FFB347
--color-alo-text           → #0F172A      --color-alo-body       → #334155
--color-alo-text-muted     → #64748B      --color-alo-border     → #E2E8F0
--color-alo-success/error/warning/info (each with -soft/-text/-border/-dark)
```

plus the radius scale (`--radius-card|input|pill|button`), the shadow scale
(`--shadow-card`, `--shadow-hover`, `--alo-shadow-xs|sm|md|lg|blue`) and the
`.dark` overrides for every value.

### 3.2 Semantic utility layer (appended this pass, ~300 lines)

The layer defines the classes the codebase was already *calling* but which did not
exist — each one was previously a silent no-op:

* type: `.body-text`, `.caption-text`, `.badge-text`, `.card-title`,
  `.crm-page-title`, `.crm-section-title`, `.page-title`
* surfaces: `.bg-alo-gradient`, `.alo-gradient`, `.alo-shadow-xs|sm|md|lg`
* interaction: `.alo-card-hover`, `.alo-card-cta`, `.alo-card-img`, `.alo-card-anim`,
  `.fade-in`, plus a global `:focus-visible` brand ring
* scrolling: `.alo-scroll`, `.alo-scrollbar`, `.alo-scroll-thin`
* AI/marketing surfaces: `.nx-glass*`, `.nx-bento*`, `.nx-progress-*`,
  `.nx-ai-active`, `.nx-btn-glow`, `.nx-pulse`, `.cap-layer-*`, `.cap-delay-1…8`

Motion is 240–320 ms with the existing `prefers-reduced-motion` block suppressing
transform/opacity animation.

### 3.3 Primitive status

`src/components/ui/*` (49 shadcn primitives) were already spec-compliant and were
left alone: all buttons 48 px, orange/black primary CTA, blue secondary,
`rounded-input`, brand focus ring, semantic badge variants, tokenised tables.

---

## 4. What changed, by surface

### 4.1 Foundation

| File | Change |
|---|---|
| `src/app/globals.css` | + semantic utility layer (§3.2). No existing rule modified. |

### 4.2 Application shells (CRM chrome)

| File | Change |
|---|---|
| `src/components/alo/app-shell.tsx` | Active nav item was **white text on the white sidebar** (invisible). Now pale-blue surface + brand-blue label + 3 px indicator bar. Reveal-on-hover topbar actions, `--alo-border`/`--alo-page` surfaces, 11 px logo subtitle, 264 px sidebar. **Mobile menu button re-enabled** (the Sheet was wired but the trigger was hard-`disabled`, so navigation was unreachable on phones). Non-existent `var(--alo-input)` replaced with `--alo-border`. |
| `src/components/crm/CrmAdminShell.tsx` | Same active-nav indicator treatment, `--alo-brand-pale` hover, semantic danger badge (`bg-crm-danger-bg/text-crm-danger-text`), header 56→64 px, 11 px count chip, 264 px sidebar, **mobile menu re-enabled**. |

### 4.3 Shared primitives

| File | Change |
|---|---|
| `src/components/shared/PortalDashboardprimitives.tsx` | Fully tokenised rewrite keeping the identical public API (`PageHeader`, `FilterBar`, `KpiGrid`, `KpiCard`, `SectionCard`, `DataTableFrame`, `QuickActions`, `ReportBlock`, `BulkToolbar`). Metric value 28 px, labels 11 px uppercase, 48 px search input, trend communicates direction by icon + colour + `sr-only` text (never colour alone), only CSS variables for colour. |
| `src/components/website/public-pages/PublicPages.tsx` | `PublicShell` redesigned as **hero Variant E**: pale-blue band, back link, 11 px uppercase eyebrow with status dot, 30/36/42 px Montserrat H1, 15–16 px deck capped at 62 ch, `useReducedMotion()` honoured. Every public sub-page (course finder, destinations, universities, scholarships, services, about, team, FAQ, contact, legal, resources) inherits it from this one component — no per-page copy invented. |

### 4.4 Public pages

| File | Change |
|---|---|
| `src/components/website/PremiumCountryPage.tsx` | Hero leading `0.95` → `1.06` (was clipping descenders at 60 px); floating hero fact cards hidden below `sm` so the photograph is not covered on phones; 10 px metadata raised to 11 px; internal build notes removed (see §4.7); palette tokenised. |
| `src/components/website/TestPreparationMiniCard.tsx` | Removed the rendered spec caption `"White card • Blue accent • Premium design • Route: /language-prep"`; pills 10→11 px, palette tokenised. |
| `src/app/guides/[slug]/page.tsx` | The guide hero was a full-bleed photo under a **90 % near-black gradient overlay** with white text. Rebuilt as Variant E editorial split (copy left, photo in a rounded 4:3 frame, orange primary CTA, secondary outline CTA, caption pill on a light chip). All fields (`title`, `description`, `cta`, caption) preserved. Downstream CTA band `bg-slate-950` → brand blue. |
| `src/app/destinations/[slug]/visa-guide/page.tsx` | "Official Government & Immigration Sources" card was a black panel → pale-blue brand surface, links to `--alo-brand`. |
| `src/app/application-guide/page.tsx` | Black step tiles → brand-blue tiles. |
| `src/components/website/MasterCountryDestinationView.tsx` | `"Estimated Budget Summary (ESTIMATE ONLY)"` → `"Estimated budget summary"`. |
| `src/components/website/PublicNavbar.tsx` / `PublicFooter.tsx` | Already tokenised (`text-alo-*`) — verified, unchanged. |

### 4.5 CRM / admin / student / communication

| File | Change |
|---|---|
| `src/app/admin/source-verification/page.tsx` | Whole page was `bg-slate-950 text-white` → light governance page (token surfaces, semantic success/warning cards, 13 px button). |
| `src/app/admin/ai-command-center/page.tsx` | Near-black terminal card → `--alo-surface-muted` card with token border/shadow. |
| `src/components/admin/AICommandingCenter.tsx` | Banner, tab chips, chat bubbles and console card converted from `slate-900` to brand/pale surfaces; the console itself keeps a dark-on-light contrast block so log output stays readable. |
| `src/components/admin/AloShortFormBuilder.tsx` | "Prompt to publish" hero was a black panel → pale-blue brand band (heading in Montserrat, step chips in success/brand states); publishing-control panel likewise; primary actions → `--alo-brand`. |
| `src/components/admin/MasterSuperAdminDashboard.tsx` | Dark control panel → pale-blue card; amber "reset" button → semantic warning tokens, 28→36 px height. |
| `src/components/admin/AdminCountryBuilderView.tsx` | Courses-tab copy rewritten (was developer instructions: "Load courses dynamically … if missing BUILD route/page"); button 44→48 px. |
| `src/components/admin/DataCoverageDashboard.tsx`, `PageGraphDashboard.tsx` | Link buttons tokenised. |
| `src/components/crm/pages/CrmHRMPage.tsx` | Dark hero panel → pale-blue card. |
| `src/components/crm/pages/CrmUsersPage.tsx`, `src/components/crm/RegistrationEnquiries.tsx` | Developer copy about `PortalUser` identity mapping replaced with user-facing wording. |
| `src/components/visa/VisaOfficerDashboard.tsx` | "Log Officer Note" button 32→48 px, brand tokens. |
| `src/components/student/StudentFinance.tsx`, `StudentTasks.tsx` | "Selected" chips used near-black → brand blue. |
| `src/components/admin/SocialIntegrationCenterPage.tsx`, `SuperAdminMasterCommandCenter.tsx` | `dark:`-prefixed slate surfaces left as-is (dark-mode-only), but their light surfaces are now tokenised by the sweep. |

### 4.6 Course finder

`course-finder-enhanced.tsx` (three embedded footers), `course-finder-pro.tsx`,
`import-history.tsx`, `import-workflow.tsx`: dark header bars and black footers →
pale-blue header bands / light bordered footers, 11 px meta raised, palette
tokenised. Filter and import logic untouched.

### 4.7 Rendered-copy hygiene

Public and portal screens were showing their own implementation notes. Removed
(or rewritten in plain visitor-facing language, with no claim added or removed):

* `"Count from database — not hardcoded"`, `"Filter country_id — same DB"`,
  `"Universities — DB"`, `"Courses — DB"`
* `"… — Dynamic from DB"`, `"… — real DB, no fake static course cards"`,
  `"… real DB, no fake data."`, `"— real DB empty"`, `"— real DB, audit logged"`,
  `"Search real DB…"`, `"(real DB)"` metric hints
* `"ESTIMATE ONLY — Never present estimates as official figures"` → an
  estimate disclaimer a visitor can act on
* `"Load courses dynamically from existing courses table filter country_id — if
  missing BUILD route/page"`
* `"Basic info filled, no lorem, no fake"`-style QA checklists remain only inside
  admin QA panels and are documented in §8.

A regression test now fails the build if `count from database`, `not hardcoded`,
`dynamic from db`, `route: /<slug>` or `white card •` reappear
(`tests/unit/design-tokens.test.ts`, "public copy never leaks build instructions").

---

## 5. Automated transformations

Three repeatable scripts live in `scripts/redesign/`. All are pure string edits —
no JSX structure, no props, no logic.

| Script | Result | What it does |
|---|---|---|
| `typography-floor.py` | **292 files, 1,846 occurrences** | `text-[8px]`, `text-[9px]`, `text-[10px]` → `text-[11px]` (the spec's metadata floor; 11 px was already used 1,200+ times, so layouts already accommodate it). Zero occurrences remain. |
| `brand-token-sweep.py` | **~9,700 hex → token, ~9,200 neutral → token** | `bg-[#0057B8]` → `bg-[var(--alo-brand)]` for every exact palette value, plus the near-duplicate shades found in the code (`#E8F0FB`, `#5A7299`, `#0B2447`, `#D04010`, `#003D82`, …) mapped to their nearest canonical token. `text-gray-500/400`, `bg-slate-50/100`, `border-slate-200/300` → `--alo-text-muted`, `--alo-page`, `--alo-border`. Deliberately skips social brand colours (`#1877F2`, `#0A66C2`, `#833AB4`, `#FD1D1D`), `#FFFFFF`, and any hex inside `style={{…}}` or SVG attributes, so charts and brand marks are unaffected. |
| `copy-hygiene.py` | **~25 files** | Removes the build-note tails listed in §4.7. Patterns are newline-safe; the script never crosses a line boundary. |

Also present from the earlier audit phase, still passing:
`scripts/audit/undefined-css-vars.cjs`, `scripts/audit/custom-class-audit.cjs`.

**Remaining raw hex in class strings: 74** (`bg-[#FFFFFF]` ×8, light-blue-on-dark
tints, social brand colours, gradient stops) — deliberate, see §8.

**Remaining `text-[8px]|[9px]|[10px]`: 0.**
**Remaining `text-gray-400|500` / `text-slate-400`: 0.**

### Contrast pass on orange CTAs

The shared `Button` already used **black on orange** (`text-black` on `#E8501A`,
5.6:1). 178 ad-hoc `<Button>`/link-button call sites overrode it with
`text-white` (3.75:1 — below WCAG AA for text under 18.66 px bold). Those were
normalised to the system's own `text-black`, so the primary CTA now measures the
same everywhere.

---

## 6. Verification

Run in this workspace, on the final tree.

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc -p tsconfig.arena-critical-check.json --noEmit` | **exit 0**, no diagnostics |
| Lint | `npx eslint src/components src/app tests` | **0 errors, 0 warnings** |
| Unit/integration | `npx vitest run` | **225 files passed, 7 skipped; 2,719 tests passed, 75 skipped, 0 failed** (baseline was 2,718 passed / 75 skipped / 0 failed — +1 is the new copy-hygiene test) |
| Undefined CSS vars | `node scripts/audit/undefined-css-vars.cjs` | **3 remaining**, all known shadcn artefacts: `--spacing` (`ui/alert.tsx`), `--sidebar-width`, `--sidebar-width-icon` (`ui/sidebar.tsx`) |
| Class census | `node scripts/audit/custom-class-audit.cjs` | every `alo-*` / `crm-*` / `nx-*` class referenced in TSX now exists in `globals.css` |

Structural integrity of the scripted edits was checked independently of the test
suite: for every changed file, line count, `()` count and comment-line count were
diffed against the base commit, and TypeScript/ESLint parse the whole tree.

---

## 7. Accessibility and contrast decisions

| Pair | Ratio | Decision |
|---|---|---|
| `#0F172A` on `#FFFFFF` | 17.9:1 | body text — pass |
| `#334155` on `#FFFFFF` | 10.4:1 | secondary body — pass |
| `#64748B` on `#FFFFFF` | 4.76:1 | muted/meta — pass at 11 px semibold |
| White on `#0057B8` | 6.87:1 | brand/secondary buttons — pass |
| **Black on `#E8501A`** | **5.59:1** | primary CTA — pass |
| **White on `#E8501A`** | **3.75:1** | removed from 178 buttons — would fail AA |
| `#0057B8` on `#EAF3FF` | 6.32:1 | active nav, chips — pass |

* Status is never colour-only: `KpiCard` trend badges carry an arrow **and** an
  `sr-only` label; validation states carry an icon and a text message.
* Focus: one global `:focus-visible` ring (`2px var(--alo-brand)` + offset) plus
  per-component rings on the shells and the new `PublicShell` back link.
* Motion: transitions 150–320 ms; `prefers-reduced-motion` disables transforms and
  the hero auto-advance (`HomepagePart1` already listened for it; `PublicShell` now
  uses `useReducedMotion()`).
* Touch targets: primitives are 48 px; icon buttons 48 px.

---

## 8. Not done / not verified — read before shipping

**Nothing here was rendered in a browser.** There is no `next build` in this
environment (it needs > 4 GB and OOMs), no Playwright browsers, and no screenshot
pipeline. Everything below is therefore *static* evidence only.

1. **No visual QA.** Layout at 375 / 768 / 1440 / 1920 px, hover/focus/active
   states, and the new pale-blue bands have not been seen by a human or a
   screenshot. The `PremiumCountryPage`, `PublicShell` and `guides/[slug]` heroes
   are the highest-risk areas because their grid changed.
2. **No `next build`.** Tailwind 4 compiles at build time; a class that resolves to
   an unknown utility would only surface there. `tsc` + ESLint + Vitest do not
   compile CSS. Mitigations: every utility used comes from the existing token map,
   and the class census script confirms all custom classes exist.
3. **Dark mode not visually verified.** The sweep preserves light-mode values
   exactly, but a dozen surfaces now use tokens that *do* flip under `.dark`
   (e.g. `bg-[var(--alo-blue-soft)]` becomes `#10305A`). Text colours were chosen
   from the same token family, so they should flip together — this is reasoned, not
   observed. Dark mode was out of scope of the brief.
4. **Sub-48 px buttons remain at call sites.** The primitives are 48 px, but
   **278 `<Button>` instances** override height with `h-8|h-9|h-10` and **321**
   force `text-xs`, mostly inside dense CRM tables. Raising them changes row
   density and needs visual review; deliberately not done blind.
5. **290 force-disabled controls.** Buttons across `alo/ui.tsx`, `card-system.tsx`
   and ~15 pages carry `disabled title="Not yet wired — disabled to avoid a silent
   no-op (tracked in BUTTON-INVENTORY.csv)"`. They render at 50 % opacity across
   toolbars. Making them *look* enabled without wiring behaviour would be a lie;
   wiring them is functionality work, which is out of scope. They are visually
   consistent (same disabled style) but still present.
6. **32 near-black surfaces remain**, all checked individually and kept on purpose:
   `<pre>`/console output panes (`AICommandingCenter`, `AiWorkforceConsole`,
   access-control permission matrix), modal scrims (`bg-slate-900/50|60`), the
   YouTube poster letterbox (black is correct for video), the "Modern" CV template
   swatch, and TikTok's brand tile. If the brief's "no black sections" is meant to
   include code panes, they need a separate decision.
7. **`alo/views/public-*.tsx`** (`public-home`, `public-country`, `public-course`,
   `public-university`, `public-home`) are an unreferenced second public design
   system (≈600 lines, 0 imports). They were tokenised by the sweep but not
   redesigned or deleted — flagging them as likely dead code for the product owner.
8. **Hero variants B, C and D** are not new implementations: the homepage keeps the
   existing Variant A editorial split (verified to have no dark overlay), country
   pages use the editorial split with a photograph frame (A/E), all inner pages use
   Variant E, and CRM pages use the compact `PageHeader` (D). There is no dedicated
   "course finder inside the hero" band (B) or destination-tile hero (C); adding
   them would mean new layout blocks beyond restyling, which the brief forbids
   without approval.
9. **Copy hygiene is not exhaustive.** Admin QA checklists still contain phrases
   such as `"Basic info filled, no lorem, no fake"`; toasts still say
   `"… , audit logged"`. These are internal staff screens, and rewriting them
   risks changing operational meaning — left for a content owner.
10. **No performance measurement.** No Lighthouse, no bundle-size comparison, no
    CLS/LCP check after the changes.
11. **Not reviewed against production data or deployment.** No migration, seed,
    API call, email or payment was executed; no production state was touched.

---

## 9. Reviewing this work

```bash
# the design system
sed -n '700,996p' src/app/globals.css

# the shells
git diff src/components/alo/app-shell.tsx src/components/crm/CrmAdminShell.tsx
git diff src/components/shared/PortalDashboardprimitives.tsx
git diff src/components/website/public-pages/PublicPages.tsx

# the heroes
git diff src/components/website/PremiumCountryPage.tsx
git diff 'src/app/guides/[slug]/page.tsx'

# the scripts (all support --dry-run except typography-floor.py)
python3 scripts/redesign/brand-token-sweep.py --dry-run
python3 scripts/redesign/copy-hygiene.py --dry-run

# the checks
npx tsc -p tsconfig.arena-critical-check.json --noEmit
npx eslint src/components src/app tests
npx vitest run
node scripts/audit/undefined-css-vars.cjs
```
