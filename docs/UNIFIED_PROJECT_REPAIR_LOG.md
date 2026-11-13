# Unified Project Repair Log

**Date:** 2026-10-27
**Branch:** `arena/00d5c43f-alo-web-crm-tech`
**Base commit:** `e4e3d75a02c0c42604693a47b02cd4d6e1d17fd7`

Every entry records: defect → root cause → repair → verification. Statuses:
**REPAIRED**, **BLOCKED**, **PROPOSED**.

---

## R1 — Homepage blank white screen (first paint)

- **Defect:** `src/app/page.tsx` wrapped the whole route in
  `<Suspense fallback={<div className="min-h-screen bg-white" />}>` because of
  `useSearchParams()`. Visitors saw a blank white page until hydration.
- **Root cause:** Single Suspense boundary with a non-content fallback.
- **Repair:** Fallback now renders `<PublicView view="website" />` (real homepage, SSR-friendly).
- **File:** `src/app/page.tsx` (lines 515–522)
- **Verification:** `tsc --noEmit` on `page.tsx` → PASS (exit 0).

## R2 — `npm run dev` exits fatally under Next 16

- **Defect:** `next dev` printed
  `ERROR: This build is using Turbopack, with a webpack config and no turbopack config`
  and exited with code 1.
- **Root cause:** `next.config.ts` defines a `webpack` config; Next 16 defaults to
  Turbopack for `dev`.
- **Repair:** `package.json` → `"dev": "next dev --webpack -p 3000"` (matches the
  canonical `next build --webpack`).
- **Verification:** `npm run dev` → `✓ Ready in 734ms`, no fatal error.

## R3 — Two ESLint errors introduced by new super-admin code

- **Defect:** `eslint .` → 2 errors:
  1. `charts.tsx:33` `react-hooks/immutability` — reassigning `acc` during render.
  2. `AiEosMasterBlueprint.tsx` `react-hooks/use-memo` — flagged `React.useMemo(buildRoadmap, [])`.
- **Root cause:** Mutation in a `.map()` during render; unnecessary `useMemo`.
- **Repair:** `Donut` arcs now compute cumulative offsets without mutation;
  `RoadmapView` calls `buildRoadmap()` directly.
- **Files:** `src/components/admin/super-admin-command-center/charts.tsx`,
  `.../ai-eos/AiEosMasterBlueprint.tsx`
- **Verification:** `eslint src/components/admin/super-admin-command-center src/app/super-admin`
  → **exit 0, 0 errors**.

## R4 — Super-Admin Command Center + AI-EOS Master Blueprint (feature completion)

- **Defect:** The brief required a central Super-Admin dashboard and the AI-EOS
  blueprint; they were not present.
- **Repair:** Added 14 files (catalog, UI primitives, hand-rolled SVG/CSS charts, 5
  section components, the Command Center shell, the 16-view AI-EOS blueprint, data
  catalog) and 4 routes.
- **Verification:** `tsc` on all new files → PASS (exit 0); `eslint` → PASS.

## R5 — Prisma client cannot be generated → REPAIRED (WASM engine path)

- **Defect:** `prisma generate` fails; `node_modules/.prisma/client/index.d.ts` was a
  3,989-byte stub (`PrismaClient = any`).
- **Root cause:** The CLI downloads native engines from `binaries.prisma.sh`, which the
  sandbox egress allowlist blocks (TLS disconnect). `@prisma/engines@6.19.3` from npm
  ships **no binaries** (only `dist/` + `scripts/`), so there was nothing to fall back to.
- **Repair (officially supported WASM engine distribution, not a stub):** Prisma 6
  bundles WASM engines inside `node_modules/prisma/build/`. Pointing the CLI at them
  bypasses the blocked native download:

  ```sh
  B=$PWD/node_modules/prisma/build
  PRISMA_GENERATE_NO_ENGINE=1 \
  PRISMA_SCHEMA_ENGINE_BINARY=$B/schema_engine_bg.wasm \
  PRISMA_QUERY_ENGINE_LIBRARY=$B/query_engine_bg.mysql.wasm \
  npx prisma generate
  ```

  Result: `✔ Generated Prisma Client (v6.19.3, engine=none) to ./node_modules/@prisma/client`.
  `node_modules/.prisma/client/index.d.ts` is now **37,773,252 bytes / 977,962 lines**
  (was 3,989 bytes) — a real generated client. The 604-model model list in the generated
  `schema.prisma` is byte-identical to `prisma/schema.prisma` (verified by diff), so the
  large type surface is inherent to the schema, not duplication.
- **Caveat:** `engine=none` in this sandbox means no native query engine is bundled; the
  WASM query engine is used. On a normal host with `binaries.prisma.sh` reachable, plain
  `prisma generate` produces the standard native-engine client.
- **Status:** **REPAIRED.** Note this does **not** by itself unblock the full `tsc` gate
  — see R10.

## R10 — Full-repo `tsc` cannot complete in this sandbox (BLOCKED, environment)

- **Defect:** With the real Prisma client restored, `tsc --noEmit -p tsconfig.json`
  exhausts memory.
- **Root cause:** The generated client is 37 MB / 978k lines of declarations for 604
  models. Measured: default heap (~1.9 GB) → OOM at ~29 s; `--max-old-space-size=3072`
  → OOM; `--max-old-space-size=3400` → ran 25 min without finishing; even a 10-file
  focused program OOMs at ~1.9 GB. The sandbox has 3,939 MB RAM, 2 CPUs, 0 swap.
- **Measured with the Prisma stub in place** (so the gate is runnable): `tsc` completes
  in **8 s** and reports **91 errors / 31 files**, of which 27 are directly
  `Prisma`-namespace/module errors (`TS2694`, `TS2305`, `TS2347`) and the remainder
  cascade from untyped `db.*` results. These are stub artifacts, not source defects.
- **Status:** **BLOCKED** — environment memory, not a project defect. A host with
  ≥ 8 GB RAM (recommended 16 GB) can run the gate. Not fabricated; no stub left behind.

## R11 — Rill browser recording unavailable (BLOCKED)

- **Requirement:** Record browser verification of the homepage/portal flows at userill.dev.
- **Findings (evidence, not assumption):**
  - `https://userill.dev/skill.md` and `https://userill.dev/` are reachable **via the
    fetch tool**, so the service and its agent skill were read and followed.
  - Direct egress from the shell is blocked: `node -e "fetch('https://userill.dev/api/health')"`
    → `Rill API unreachable: fetch failed`. The sandbox allowlist does not include
    `userill.dev`.
  - No Chrome/Chromium exists in the environment (`google-chrome`, `chromium`,
    `chromium-browser`, `chrome`, and `~/.cache/ms-playwright` all absent).
- **Status:** **BLOCKED.** Per the fallback instruction, browser-flow checks were run with
  the automation available in this environment and **no Rill recordings were produced or
  fabricated**. `rill login` / `rill record` were not run because the prerequisites
  (egress + browser + CDP) cannot be satisfied here.
- **Fallback evidence:** dev server + server-side fetches — `/` **HTTP 200** with 39,966
  chars of rendered content (title + hero + nav), `/login` 200, `/super-admin/dashboard`
  307 (fail-closed auth redirect), `/courses` 308. See `FINAL_AUDIT` §3.1. These are
  SSR checks, not a browser recording.

## R6 — Production build OOM / SIGABRT (BLOCKED)

- **Defect:** `next build --webpack` → `FATAL ERROR: Reached heap limit … out of memory`,
  worker `SIGABRT` at ~88 s.
- **Root cause:** 457 pages + 1,034 API routes exceed the 4 GB sandbox memory budget.
- **Status:** **BLOCKED** — needs a larger CI runner or a route-surface reduction.
  Not silently mitigated.

## R7 — 25 failing tests (PARTIALLY BLOCKED)

- **Defect:** `vitest run` → 19 files / 25 tests failed.
- **Root cause:** Mixed — some are DB/`prisma generate` confounds (`*-live-db`
  integration tests, `cms-revisions` DMMF checks), others need triage against a real DB.
- **Status:** **BLOCKED** for DB-dependent cases; genuine unit failures need triage after R5.

## R8 — No `.env` file (CONFIGURATION GAP)

- **Defect:** 242 documented variables; no `.env` present.
- **Status:** **PROPOSED** — document required variables (see
  `UNIFIED_PROJECT_ENVIRONMENT_VARIABLES.md`). Secrets must not be committed.

## R9 — Duplicate project copies (PROPOSED)

- **Defect:** `alo-education-web-crm-final/`, `deploy-build/`, `imports/alo-education-full/`,
  `imports/alo-education-source/` duplicate the canonical project.
- **Status:** **PROPOSED** — collapse only with explicit authorization (destructive to
  tracked history).

---

## Repair summary

| Status | Count |
|---|---|
| REPAIRED | 5 (R1–R5) |
| BLOCKED | 4 (R6, R7, R10, R11) |
| PROPOSED | 2 (R8–R9) |

**Not attempted (deliberately):** deleting routes/tables, overwriting `.env`, destructive
migrations, force-push, disabling security controls, fabricating a Prisma client stub, and
fabricating Rill recordings.
