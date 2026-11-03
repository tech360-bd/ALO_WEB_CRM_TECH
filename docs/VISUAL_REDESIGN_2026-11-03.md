# Complete website + CRM visual redesign — implementation report

**Date:** 2026-11-03 · **Branch:** `arena/300b1e7d-alo-web-crm-tech`
**Scope:** the existing ALO Education website + CRM. No new product, no replacement
pages, no route, API, schema, auth, permission or business-logic change.

---

## 1. Baseline recorded before editing

| Measure | Value |
| --- | --- |
| Source `.ts/.tsx` files | 2,730 |
| Existing `page.tsx` routes | 475 |
| Shared `src/components/ui` primitives | 50 |
| `src/app/globals.css` | 1,369 lines → **1,556 lines** after |
| Pre-existing design-token guardrails | `tests/unit/design-tokens.test.ts` (19 tests) |

Static drift scan of `src/` at baseline:

| Defect | Before | After |
| --- | --- | --- |
| Arbitrary raw-hex utility classes (`bg-[#…]`) | **72** in 34 files | **11** — all 11 are the two documented literals (`bg-[#FFFFFF]`, `bg-[#1877F2]`) |
| Tailwind neutral greys in text (`text-slate/zinc/neutral-*`) | **8** | **0** |
| Opaque near-black backgrounds / dark scrims | **7** blocks + **3** scrims | **0** |
| Superseded legacy hex `#0066CC` in a component | **1** | **0** |
| Pictographic emoji used as UI icons | **128** in 34 files | **41** in 18 files — all remaining are country-flag/globe **content**, API seed strings or video-script copy, not icons |
| Second competing dark theme (`--cc-*`, `#0a0e17` canvas) | **present** | rebound to the master tokens |

---

## 2. What actually changed

### 2.1 Global design-token layer (`src/app/globals.css`)

- Added the exact §17 canonical aliases — `--alo-blue-hover`, `--alo-blue-pale`,
  `--alo-orange-hover`, `--alo-white`, `--alo-background`, `--alo-radius-sm/md/card/feature`,
  `--alo-shadow-card`, `--alo-shadow-hover`, `--alo-transition` — all resolving to the
  existing master tokens (no second palette).
- Added `--alo-content-max: 1280px` and a responsive `--alo-section-y`
  (48 / 64 / 88 px at mobile / tablet / desktop).
- Added `--alo-on-brand-soft` + a Tailwind theme colour for secondary copy on solid
  brand-blue surfaces (white remains the primary label colour).
- Added **37 reusable `alo-ds-*` utilities**: typography scale (`.alo-ds-h1`,
  `.alo-ds-page-h1`, `.alo-ds-h2/h3/h4`, `.alo-ds-body-lg`, `.alo-ds-body`,
  `.alo-ds-support`, `.alo-ds-meta`, `.alo-ds-label`, `.alo-ds-eyebrow` with a
  `:lang(bn)` rule), layout (`.alo-ds-container`, `.alo-ds-section`), surfaces
  (`.alo-ds-card`, `.alo-ds-card-feature`, `.alo-ds-card-crm`, `.alo-ds-panel`,
  `.alo-ds-table-wrap`), interaction (`.alo-ds-interactive`, `.alo-ds-focus`),
  §13 semantic statuses, §14 inline feedback, state panels and a spinner, and
  §15 reveal/stagger motion with `prefers-reduced-motion` support.
- **Rebound the entire Enterprise Command Center theme.** The `--cc-*` variables
  were a separate near-black design language (`#0a0e17` canvas, `#1a2036` cards).
  They are now aliases of `--alo-page`, `--card`, `--alo-border`, `--alo-text`,
  `--alo-brand` and the §13 status tints. `.cc-card` moved to a 14px CRM radius,
  gradient headline text became a single blue accent, `.cc-code` went 11px → 12px,
  and all eight DCC/health badges now use the semantic tints instead of ad-hoc rgba.

### 2.2 Shared primitives — one fix improves every consumer

| File | Change |
| --- | --- |
| `ui/textarea.tsx` | Was generic shadcn (`bg-transparent`, `shadow-xs`, generic focus). Now matches `Input` exactly: white surface, 10px radius, ALO placeholder, blue focus ring, `aria-invalid:border-crm-danger`. |
| `ui/select.tsx` | Trigger aligned with `Input` (same border/height/focus/placeholder/invalid states); dropdown radius now the 12px `rounded-button` token. |
| `ui/label.tsx` | 14px / **600** weight / `#334155` body colour per §04. |
| `ui/form.tsx` | Validation text moved from `text-destructive` (#EF4444, 3.76:1) to accessible `text-crm-danger-text` (#B91C1C), `role="alert"`, `font-medium`; help text on `text-alo-text-muted`. |
| `ui/table.tsx` | Container gets a 14px bordered white surface; header text `#64748B` without uppercase tracking; body text `#334155`; hover/selected rows already on pale blue. |
| `ui/alert.tsx` | Added `success`, `warning`, `info`, `neutral` semantic variants on top of `default`/`destructive`, with 14px radius and token tints. |
| `ui/drawer.tsx` | Removed the `bg-black/50` scrim → frosted white; surface is now white, 20px radius, hairline border, `shadow-modal`, 24px header/footer padding, heading font. |
| `ui/sheet.tsx` | `shadow-lg` → `shadow-modal` (already had the white scrim). |
| `ui/dropdown-menu.tsx`, `ui/popover.tsx` | 12px `rounded-button` token instead of `rounded-xl`. |

### 2.3 Loading / empty / error states (§14, §19)

New `src/components/ui/state-panel.tsx` exports `StatePanel`, `LoadingState` and
`EmptyState`. Every state carries an icon, a text title, a description and a
semantic role; colour is never the only channel; no invented data. The three
global Next.js state pages now use it:

- `src/app/loading.tsx` — stable-dimension spinner + text label
- `src/app/error.tsx` — warning surface + labelled Try Again (`reset` preserved)
- `src/app/not-found.tsx` — info surface + Back to Home

### 2.4 One coherent icon system (§10)

- `catalog.ts` and `ai-eos/data.ts` `icon` fields changed from emoji strings to
  **Lucide export names**. This also fixed a real bug: those values were already
  passed to `NamedIcon`, so every emoji resolved to the `Circle` fallback.
- `AiEosMasterBlueprint`, `SuperAdminCommandCenter`, `SuperAdminMasterCommandCenter`,
  `ManagedContentManager`, `SuperAdminWebsiteCmsHub`, `SuperAdminCrmCommandCenter`,
  `Infrastructure`, `Overview`, `Governance`, `CounselorDashboard`, `CrmUsersPage`,
  `TimelineItem`, `EnterpriseUnifiedCommunicationCenter`, `PremiumStudentDashboard`,
  `nexabroad-dashboard` and `public-news` now use Lucide/NamedIcon instead of emoji
  in headings, buttons, badges and nav.
- Removed a hardcoded `3` notification badge with no data source (§12).
- Country flags / 🌐 globe fallbacks are retained intentionally — they are
  **content**, not the icon system (documented in `ui/named-icon.tsx`).

### 2.5 Palette cleanup across 37 page/component files

Every off-palette arbitrary hex (unapproved blues `#004694`, `#004a9e`,
`#003d8f`, Instagram/Twitter/YouTube gradients, dark purples/reds, legacy yellows)
and every Tailwind neutral grey was replaced with the matching ALO token. Two
black modal scrims became frosted white. Social-platform brand literals
(`#1877F2` Facebook) and pure white remain as the two documented exceptions.

---

## 3. Verification performed on the actual project

| Check | Result |
| --- | --- |
| `NODE_OPTIONS=--max-old-space-size=3400 npx tsc --project tsconfig.visual-redesign-round2-check.json --noEmit` (93 changed source files) | **`TSC_EXIT=0`** |
| New `tests/unit/visual-system-redesign.test.ts` + 5 existing brand/chrome suites | **6 files, 66 tests passed** |
| Full `npx vitest run` | **342 passed / 13 skipped files**, **3,755 passed / 148 skipped tests**, 0 failed assertions; `VITEST_EXIT=1` from **7 environmental Prisma native query-engine errors** (no native engine binary in sandbox) |
| `npx playwright test --list` | 52 tests in 6 files collected, `EXIT=0` (collection only) |
| `git diff --check` | clean |
| Live dev server (`next dev --webpack -H 0.0.0.0 -p 3000`) | **Ready**, preview available. The first process exited after a memory-threshold restart; it was relaunched with `NEXT_PRIVATE_BUILD_WORKER=0` + a 2048 MB heap and re-smoke-tested (`/` and `/about` → 200). |
| `GET /` | **200**, 859 KB HTML, header CTA + footer + cap strip + contact numbers present |
| `GET /about`, `/destinations`, `/course-finder`, `/contact`, `/student/login` | **200** |
| `GET /crm`, `/super-admin/command-center` | **307** auth redirect (expected — proxy-level gate) |
| Served CSS | **200**, contains `.alo-ds-eyebrow`, `.alo-ds-state`, `.alo-ds-status-success`, `--alo-page: #F8FAFC`, `--cc-bg: var(--alo-page)`, `bg-alo-cta-solid` |
| Cross-origin preview request (`Origin: https://3000-….e2b.app`) | **200**, no host/origin rejection |

New regression contract: `tests/unit/visual-system-redesign.test.ts` scans all
`src/` `.ts/.tsx` files for dark scrims, near-black blocks, Tailwind greys,
legacy hexes, sub-11px type and undocumented arbitrary hex classes, and locks the
shared primitives, the light `--cc-*` theme, the state-panel adoption and the
Lucide icon data.

---

## 4. Final quality checklist — honest status

| # | Checklist item | Status |
| --- | --- | --- |
| 1 | Public website and CRM share one brand identity | ✅ Verified — `--cc-*` dark theme removed, tokens unified |
| 2 | Every existing hero has a deliberate, readable composition | ⚠️ Partial — homepage editorial split is guarded by `design-tokens.test.ts`; other hero sections were **not individually re-composed** |
| 3 | All headlines have consistent hierarchy and spacing | ✅ Shared typography utilities added; ⚠️ not applied to all 475 pages individually |
| 4 | Every grid has appropriate column counts and alignment | ⚠️ Not individually inspected on 475 pages |
| 5 | Cards have coherent backgrounds, borders, radii, shadows | ✅ Shared `Card`, `.alo-ds-card*` and `.cc-card` unified |
| 6 | Card titles, descriptions, metadata, actions use consistent typography | ✅ `Card` + typography utilities + table hierarchy |
| 7 | Blue and orange used according to defined roles | ✅ Verified by scan; only 11 documented literal colour classes remain |
| 8 | Status badges consistent and semantically meaningful | ✅ 5 Alert variants + 5 `alo-ds-status-*` + 8 `.cc-badge-*` re-tinted |
| 9 | Icons from a coherent icon system | ✅ Lucide/`NamedIcon`; remaining emoji are country-flag content only |
| 10 | Forms, tables, dropdowns, modals share one design language | ✅ Verified by new regression test |
| 11 | CRM data remains readable and operationally efficient | ✅ Light canvas, 14px panels, header/body text hierarchy |
| 12 | Mobile, tablet, desktop layouts checked | ⚠️ Responsive tokens/utilities added; **no browser viewport matrix run** |
| 13 | Keyboard focus and accessible contrast reviewed | ✅ Visible focus outline, AA-compliant validation red, accessible orange CTA unchanged |
| 14 | Animations subtle and respect reduced-motion | ✅ `alo-ds-*` + existing global reduced-motion block |
| 15 | Existing links, buttons, forms, search, workflows still function | ✅ No route/API/logic change; unit suite + live GETs pass; ⚠️ no end-to-end browser click-through |
| 16 | No existing page or feature silently removed | ✅ 475 routes preserved, no deletions |
| 17 | No fabricated data, testimonials or statistics added | ✅ Nothing added; one hardcoded fake notification count **removed**. ⚠️ Pre-existing blueprint fallback counts in `catalog.ts` remain — see §5 |
| 18 | The actual modified project has been tested | ✅ Typecheck, 3,755 unit tests, live dev server + HTTP/CSS checks |
| 19 | Incomplete or unverified work explicitly documented | ✅ This section + §5 |

---

## 5. Explicit limitations / not claimed

- **No production build PASS.** A production build is OOM-killed in this ~3.9 GB
  sandbox (documented in `FINAL_MASTER_IMPLEMENTATION_REPORT.md`); it was not
  re-attempted this turn. The live preview is `next dev`, not `next start`.
- **Playwright E2E was not executed** — only collection (`--list`). Browser-level
  visual diffing, hover/focus interaction and viewport matrix were not performed;
  there is no browser screenshot tool in this workspace.
- **No live database or provider credentials.** Full Vitest exits 1 on 7
  environmental `PrismaClientInitializationError`s (missing native Query Engine);
  these are unhandled errors, not failed assertions.
- **CRM screens behind auth** (`/crm`, `/super-admin/command-center`) return a
  proxy 307 in the unauthenticated preview and were not visually inspected.
- **Pre-existing blueprint fallback metrics** in
  `src/components/admin/super-admin-command-center/catalog.ts` (e.g. "10,247
  skills", department counts, "2,000 AI Agents") are existing content with a
  documented live-API hydration fallback. Master §12 asks that only real metrics
  be shown. Replacing or removing them changes product content, so they were
  deliberately left intact and are flagged here for a product decision rather
  than silently edited.
- **11 arbitrary-hex classes remain intentionally**: `bg-[#FFFFFF]` (pure white)
  and `bg-[#1877F2]` (Facebook brand tile). This matches the repo's own
  allowlist in `tests/unit/design-tokens.test.ts`.
- **41 pictographic emoji remain intentionally** as country-flag/globe content,
  CMS seed strings and video/marketing copy — not as an icon system.
- The accessible master palette (`#0057B8 / #C93D13 / #E8501A`) is retained per
  the 2026-11-03 decision; the superseded `#0066CC / #F37021 / #FFB347` remain
  retired because they fail the 4.5:1 text-contrast floor.
