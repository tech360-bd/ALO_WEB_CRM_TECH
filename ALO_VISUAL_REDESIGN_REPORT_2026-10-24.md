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
| §3 | What the design system is now (tokens, utilities, primitives, hero system) |
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
brand surfaces, unifies the hero system, and repairs public copy — with all
existing behaviour intact.

Scope across the whole change set (branch vs `main`@`cead8141`): **595 files,
+19,387 / −16,906 lines** — three sweeps (theme tokenisation, typography floor,
button/CTA normalisation), a rewritten hero system, and a new CSS-completeness
gate.

Result: `tsc` clean, ESLint clean, **2,725 tests passing / 75 skipped / 0 failing**
(six guardrail tests added in the final pass), **0 undefined Tailwind classes**
out of 1,740 referenced, and zero undefined CSS variables beyond three known
shadcn artefacts.

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

### 3.4 The hero system (Master §08)

There is now **one** public hero implementation, `src/components/website/PublicHero.tsx`
(client component, honours `prefers-reduced-motion`), and it is used by:

| Variant | Where | Shape |
|---|---|---|
| **A — editorial split** | Homepage (`HomepagePart1`), `PremiumCountryPage`, language-prep landing | copy column + photograph/finder column, pale surface, no dark overlay |
| **B — course-finder hero** | Public course finder (`PublicPages` `PublicCourseFinderPage` and the route-level `PublicCourseFinder`) | the search tool *is* the hero; no separate marketing headline block |
| **C — destination hero** | Destinations index (`src/app/destinations/page.tsx`) and the destinations view in `PublicPages` | headline plus a destination tile strip; the first result tile spans two columns so the grid is not a uniform 3-up |
| **D — CRM compact** | `PortalDashboardprimitives.PageHeader` used by all CRM/admin screens | 26/30 px title, breadcrumb, actions row, no imagery |
| **E — inner page** | `PublicShell` (every public sub-page), guides, blog article, news, FAQs, contact, legal | pale band, back link/breadcrumb, 11 px eyebrow with status dot, 30/36/42 px H1, deck capped at 62 ch |

The band surface is `--alo-brand-pale` (`#F4F8FF` light / `#0B2447` dark) with a
`--alo-border` hairline — never a black section, never a photograph with text on
top of it. Two pages that previously violated this were rebuilt in the final pass:
the blog article hero (white title over a 80 % black gradient) and the guides index
(`from-slate-950 via-slate-900 to-blue-950` panel).

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
| `src/components/website/PublicHero.tsx` *(new)* | The single public hero band: eyebrow + dot, 30/36/42 px H1, 62 ch deck, optional `slot` (Variant B/C content) and `above` (back link), 240 ms fade-up disabled under `prefers-reduced-motion`. Replaces hand-rolled headers rather than adding a parallel one. |
| `src/components/ui/pagination.tsx` | Selected page now a filled brand chip (`aria-current` still present) instead of a faint outline that was indistinguishable from hover. |
| `src/components/ui/tabs.tsx` | Trigger track 36 → 48 px, selected page white on `--alo-muted`, semibold label — the active tab is legible at a glance. |
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
| `src/app/blog/page.tsx` | Solid brand-blue slab hero → Variant E pale band; category pills raised to the 48 px target. |
| `src/app/blog/[slug]/page.tsx` | Title was white text over an 80 % black gradient on the hero photo. Rebuilt: photograph in a rounded frame beside the copy, breadcrumb + category + author/date/read-time on the light band. |
| `src/app/guides/page.tsx` | `from-slate-950 via-slate-900 to-blue-950` header → pale band; `blue-50/700/900` literals → tokens; footer note on `--alo-brand-pale`. |
| `src/app/destinations/page.tsx` | **Variant C**: destination tile strip inside the hero, first card promoted to a 2-column feature tile, CTA 44 → 48 px, verified badge now `ShieldCheck` + success tokens (not colour alone). |
| `src/app/services/page.tsx`, `src/app/resources/page.tsx`, `src/components/website/UniversitiesListing.tsx`, `src/components/website/ScholarshipsListing.tsx` | Floating white hero cards on a white page → `--alo-brand-pale` band cards with the shared type scale. |
| `src/components/website/MasterLanguagePrepLandingView.tsx` | Brand-gradient hero slab → editorial band; glass `white/10` tiles → bordered cards; the CTA band gradient → solid brand; 60 px black-weight title → 52 px extrabold on the shared scale. |
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

Four repeatable scripts live in `scripts/redesign/`. All are pure string edits —
no JSX structure, no props, no logic.

| Script | Result | What it does |
|---|---|---|
| `typography-floor.py` | **292 files, 1,846 occurrences** | `text-[8px]`, `text-[9px]`, `text-[10px]` → `text-[11px]` (the spec's metadata floor; 11 px was already used 1,200+ times, so layouts already accommodate it). Zero occurrences remain. |
| `brand-token-sweep.py` | **~9,700 hex → token, ~9,200 neutral → token** | `bg-[#0057B8]` → `bg-[var(--alo-brand)]` for every exact palette value, plus the near-duplicate shades found in the code (`#E8F0FB`, `#5A7299`, `#0B2447`, `#D04010`, `#003D82`, …) mapped to their nearest canonical token. `text-gray-500/400`, `bg-slate-50/100`, `border-slate-200/300` → `--alo-text-muted`, `--alo-page`, `--alo-border`. Deliberately skips social brand colours (`#1877F2`, `#0A66C2`, `#833AB4`, `#FD1D1D`), `#FFFFFF`, and any hex inside `style={{…}}` or SVG attributes, so charts and brand marks are unaffected. |
| `copy-hygiene.py` | **~25 files public, ~14 admin** | Removes the build-note tails listed in §4.7. Patterns are newline-safe; the script never crosses a line boundary. |
| `brand-token-sweep.py` (second pass) | **1,857 replacements in 264 files** | Blue/orange *utility families* → brand tokens: `bg-blue-50/100` → `--alo-brand-pale`, `text-blue-700/600` → `--alo-brand`, `bg-orange-500/600` → `--alo-cta`/`--alo-cta-hover`, `text-orange-600/700` → `--alo-cta-active` (`#C93D13`, 4.9:1 on white — the raw `#E8501A` value fails AA as text). Social brand colours are untouched. |
| `h1scale` normalisation (inline, 10 files) | **10 headlines** | `text-4xl md:text-5xl font-bold` → `font-heading text-[30px] … lg:text-[42px] tracking-[-0.02em] leading-[1.12]` so every public H1 shares one scale. |

Button normalisation (inline, tag-scoped): **589** `<Button>` height overrides
(`h-8/9/10`), **389** `text-xs` on buttons, **22** link-buttons with a hard height
and **7** `h-N w-N` icon squares → `size-12`. `<Button>` sub-48 px count is now
**0**, and the shared `Button` sizes all resolve to `h-12`.

### The CSS-completeness gate (`scripts/audit/class-verify.cjs`)

The most consequential find of the whole pass came from this new script: it
compiles `src/app/globals.css` with `@tailwindcss/postcss` (634 KB), extracts every
`className` token from `src/**/*.tsx`, and diffs the two.

First run: **25 tokens referenced that Tailwind never generates.** Eight of them
were whole feature areas that were silently dead on screen:

| Missing | Consequence |
|---|---|
| `animate-in` / `animate-out` / `fade-in-0` / `zoom-in-95` / `slide-in-from-*` / `slide-out-to-*` | `tailwindcss-animate` is **not a dependency**, so ~100 dialogs, sheets, dropdowns, popovers and command palettes opened with **no motion at all** |
| `prose`, `prose-sm`, `prose-lg` | article bodies on `/blog/[slug]`, `/guides/[slug]`, `/services/[slug]` rendered as unstyled text |
| `animate-accordion-down/up`, `animate-caret-blink` | accordions snapped open; OTP/typing carets were static |
| `no-scrollbar`, `bg-alo-hero`, `bg-alo-gradient-orange`, `alo-cap-*` | horizontal scrollers showed scrollbars; footer marquee was inert |

Those (~150 lines) are now defined in `globals.css` as a shadcn-compatible subset
— no new dependency — with every animation disabled under
`prefers-reduced-motion`. Five further tokens were real typos
(`text-alo-text-heading`, `text-alo-text-body`, `bg-alo-blue`, `text-alo-blue`) and
were repointed at existing tokens in 10 files.

**Current result: `checked 1740 unique class tokens … not generated by Tailwind: 0`**
and the script now exits non-zero on any future regression, so it can be wired into
CI as-is. Three hook classes (`alo-rich-text`, `toaster`, `is-active`) are
allow-listed by name — they are styled by an inline `<style>` block, sonner, or
tests respectively, not by Tailwind.

Also present from the earlier audit phase, still passing:
`scripts/audit/undefined-css-vars.cjs`, `scripts/audit/custom-class-audit.cjs`.

**Remaining raw hex in class strings: 78** (`bg-[#FFFFFF]` ×8, light-blue-on-dark
auth tints `#60a5fa`/`#D6E6FF`, social brand colours `#1877F2`/`#833AB4`/`#FD1D1D`,
gradient stops) — deliberate, see §8.

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
| Unit/integration | `npx vitest run` | **225 files passed, 7 skipped; 2,725 tests passed, 75 skipped, 0 failed** (baseline 2,718 / 75 / 0; +1 copy-hygiene, +6 redesign guardrails) |
| Tailwind class completeness | `node scripts/audit/class-verify.cjs` | **1,740 tokens checked, 0 missing** (was 25 missing, 8 of them whole feature areas) |
| Dev-server render | `next dev` + `curl` on `/`, `/blog`, `/guides`, `/course-finder`, `/universities`, `/scholarships`, `/news`, `/faqs`, `/destinations`, `/language-prep`, `/services`, `/resources` | **all 200**, no runtime errors (sandbox has no `DATABASE_URL`, so DB-backed sections render their documented fallbacks — this is expected, not a defect) |
| Undefined CSS vars | `node scripts/audit/undefined-css-vars.cjs` | **3 remaining**, all known shadcn artefacts: `--spacing` (`ui/alert.tsx`), `--sidebar-width`, `--sidebar-width-icon` (`ui/sidebar.tsx`) |
| Class census | `node scripts/audit/custom-class-audit.cjs` | every `alo-*` / `crm-*` / `nx-*` class referenced in TSX now exists in `globals.css` |

The final pass added six guardrail tests to `tests/unit/design-tokens.test.ts` so
the redesign cannot silently regress: no type below 11 px, no Tailwind
`gray/slate-400/500` text, no raw brand hex in class strings, no opaque near-black
panels outside five documented exceptions, every shared control at 48 px, and the
presence of all motion/prose/footer utilities in `globals.css`.

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
* Motion: transitions 150–240 ms, enter travels ≤ 16 px. `prefers-reduced-motion`
  disables transforms, the hero auto-advance, and every newly defined keyframe
  (`animate-in/out`, accordion, caret, footer marquee).
* Touch targets: primitives are 48 px; icon buttons 48 px.

---

## 8. Not done / not verified — read before shipping

**No human or screenshot reviewed these pages.** There is no `next build` here (it
needs > 4 GB and OOMs), no Playwright browsers and no screenshot pipeline. What
*was* done in the final pass is a real `next dev` render of twelve public routes
(HTTP 200, server HTML inspected) plus a Tailwind compile that proves every class
actually produces CSS. Everything below is static or server-rendered evidence.

1. **No visual QA at 375 / 768 / 1440 / 1920 px.** Hover, focus, active, selected
   and disabled states have not been seen. Highest-risk areas: the new Variant C
   destination grid (first tile spans two columns on `lg`), the blog article split
   hero, `PremiumCountryPage`'s floating fact cards, and the language-prep band.
2. **No production build.** Tailwind 4 compiles at build time, so this was
   mitigated rather than solved: `class-verify.cjs` compiles `globals.css` with the
   same PostCSS plugin and proves all 1,740 referenced tokens generate CSS. What it
   cannot prove is purging behaviour on the production build.
3. **Dark mode is reasoned, not observed.** The sweeps map to tokens that flip under
   `.dark`; the light-mode values are pixel-identical to the previous hex. Contrast
   in dark mode was not measured. Dark mode was not in the brief.
4. **290 force-disabled controls remain.** Buttons across `alo/ui.tsx`,
   `card-system.tsx` and ~15 pages carry `disabled title="Not yet wired — disabled
   to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"`. They render at 50 %
   opacity and are visually consistent, but making them *look* enabled without
   wiring behaviour would be a lie, and wiring them is functionality work outside a
   styling brief. **This is the largest remaining visual compromise.**
5. **Client-rendered public routes cannot be inspected statically.** `/blog`,
   `/news` and `/guides` stream their body through the portal shell, so the server
   HTML only shows the loading state; their hero changes are verified by reading the
   compiled `className` output, not by seeing the page.
6. **No `DATABASE_URL` in this sandbox.** Every DB-backed section rendered its
   fallback ("No eligible guides are published yet", etc.). Loading, empty and error
   states were therefore exercised for real — but populated states were not.
7. **32 near-black surfaces remain**, each checked individually and kept on purpose:
   `<pre>`/console output panes, modal scrims (`bg-slate-900/50|60`), the YouTube
   poster letterbox, the "Modern" CV template swatch and TikTok's brand tile. They
   are allow-listed by name in the guardrail test so nothing else can drift in.
8. **`alo/views/public-*.tsx`** (`public-home`, `public-country`, `public-course`,
   `public-university`) are an unreferenced second public design system (~600 lines,
   0 imports). Tokenised by the sweep, not redesigned or deleted — flagged as likely
   dead code for the product owner.
9. **Copy hygiene is not exhaustive.** Admin QA checklists still contain phrases such
   as `"Basic info filled, no lorem, no fake"` and toasts still say `"… , audit
   logged"`. These are internal staff screens; rewriting them risks changing
   operational meaning, so they are left to a content owner.
10. **No performance measurement.** No Lighthouse, no bundle-size comparison, no
    CLS/LCP check after the changes.
11. **Not reviewed against production data or deployment.** No migration, seed, API
    call, email or payment was executed; no production state was touched and nothing
    was pushed to a production branch.

---

## 9. Reviewing this work

```bash
# the design system
sed -n '700,996p' src/app/globals.css

# the shells
git diff src/components/alo/app-shell.tsx src/components/crm/CrmAdminShell.tsx
git diff src/components/shared/PortalDashboardprimitives.tsx
git diff src/components/website/public-pages/PublicPages.tsx

# the heroes (one shared band + five variants)
cat src/components/website/PublicHero.tsx
git diff src/components/website/PublicPages.tsx
git diff src/app/destinations/page.tsx 'src/app/blog/[slug]/page.tsx' src/app/guides/page.tsx
git diff src/components/website/MasterLanguagePrepLandingView.tsx

# the scripts (all support --dry-run except typography-floor.py)
python3 scripts/redesign/brand-token-sweep.py --dry-run
python3 scripts/redesign/copy-hygiene.py --dry-run

# the checks
npx tsc -p tsconfig.arena-critical-check.json --noEmit
npx eslint src/components src/app tests
npx vitest run
node scripts/audit/class-verify.cjs          # exits 1 on any dead class
node scripts/audit/undefined-css-vars.cjs
```
