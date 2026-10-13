# BUILD_REPORT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Build Report |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Document the build toolchain, the build command, the output location, the 7-step verification sequence, and how to inspect the artefact. |

---

## Build toolchain

| Item | Value |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.x |
| **Bundler** | Turbopack (Next.js 16 default for `next build`) |
| **CSS** | Tailwind CSS 4.x |
| **UI library** | shadcn/ui (Radix primitives + CVA) |
| **ORM** | Prisma 6.x |
| **Package manager** | npm (with `package-lock.json`) — Bun supported as alternative |
| **Node version** | 22.x preferred (20.x minimum) |
| **Build mode** | Standalone (produces a self-contained `.next/standalone/server.js`) |
| **Build script** | `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` |

---

## Build command

```bash
cd ~/alaminn.info
npm run build
```

### What it does (3 sub-commands)

1. **`next build`** — Compiles the Next.js app:
   - Type-checks every `.ts` / `.tsx` file
   - Lints via ESLint (warnings don't fail; errors do)
   - Bundles client + server JS via Turbopack
   - Generates the standalone server at `.next/standalone/server.js`
   - Outputs static chunks to `.next/static/`
   - Produces build manifest at `.next/build-manifest.json`

2. **`cp -r .next/static .next/standalone/.next/`** — Copies static chunks (JS/CSS) into the standalone tree so the standalone server can serve them.

3. **`cp -r public .next/standalone/`** — Copies public assets (images, favicons, robots.txt) into the standalone tree.

### Why this build configuration?

- **Standalone mode** produces a self-contained server with NO dependency on `node_modules/` for runtime (Prisma client is bundled in). This is ideal for cPanel shared hosting where deployment must be a single self-contained directory.
- **Copy steps** ensure the standalone tree has everything it needs: server code + static chunks + public assets.
- **`server.js` (project root)** loads `.env` from the app root, then requires `.next/standalone/server.js`. This is the cPanel entry point.

---

## Output location

```
/home/aloeduca/alaminn.info/.next/
├── standalone/                   ← Self-contained Next.js server (production)
│   ├── server.js                 ← Next.js standalone server (entry point)
│   ├── .next/
│   │   └── static/               ← JS/CSS chunks (copied by build script)
│   │       ├── chunks/           ← Route-specific code splits
│   │       ├── css/              ← Compiled Tailwind CSS
│   │       └── media/            ← Optimized images
│   ├── public/                   ← Static assets (copied by build script)
│   │   ├── images/
│   │   ├── favicons/
│   │   ├── robots.txt
│   │   └── ...
│   ├── node_modules/             ← ONLY runtime deps (no dev deps)
│   └── package.json              ← Minimal package.json (runtime only)
│
├── static/                       ← Original static output (kept for reference)
│   ├── chunks/
│   ├── css/
│   └── media/
│
├── server/                       ← Server-side reference (not used in prod)
├── server-source-maps/           ← Source maps (NOT deployed — dev only)
├── types/                        ← TypeScript types
├── build-manifest.json           ← Build manifest
├── react-loadable-manifest.json  ← Loadable manifest
└── required-server-files.json    ← Files required by the server
```

### Build size

| Path | Size (typical) |
|---|---|
| `.next/standalone/` (total) | 50–150 MB |
| `.next/standalone/server.js` | 1–3 MB |
| `.next/standalone/.next/static/` | 20–60 MB |
| `.next/standalone/public/` | 5–50 MB (depends on images) |
| `.next/standalone/node_modules/` | 20–80 MB (runtime deps only) |
| `.next/static/` (original) | 20–60 MB |

> Actual sizes vary based on the number of routes, dependencies, and public images.

---

## Build warnings

### Expected warnings (safe to ignore)

| Warning | Cause | Action |
|---|---|---|
| `Compiled with X warnings` from ESLint | Linting rules with severity `warn` (not `error`) | None — warnings don't fail the build. Fix when convenient. |
| `prisma:warn` about MongoDB/MySQL features | Prisma notices the dev SQLite doesn't support some prod features | None — only matters in prod. |
| `Large chunk` warning for a route | A route imports a large library (e.g. `@mdxeditor/editor`) | Optimize with dynamic imports if it affects performance. |

### Errors that fail the build

| Error | Cause | Fix |
|---|---|---|
| `Type error: Cannot find module '@/lib/...'` | Broken import path | Run `npx tsc --noEmit` to find all broken imports; fix and rebuild. |
| `ESLint: X errors` | Linting rules with severity `error` | Run `npm run lint -- --fix`; manually fix remaining errors. |
| `Failed to compile: SyntaxError` | TypeScript syntax error | Read the error location; fix the syntax. |
| `Module not found: Error: Can't resolve 'X'` | Missing dependency | `npm install X` (or add to `package.json` deps). |
| `Cannot find module '.prisma/client/default'` | Prisma client not generated | Run `npx prisma generate` before `npm run build`. |
| `Error: Cannot find module 'next/babel'` | Babel config issue | Check `babel.config.js` if present; usually fixed by `rm -rf node_modules/.cache`. |

---

## The 7-step verification sequence

Before deploying, run this sequence to verify the build is production-ready. Each step depends on the previous one succeeding.

### Step 1: `npm ci`

```bash
cd ~/alaminn.info
npm ci
```

**Verifies**: Dependencies install cleanly from the lockfile (deterministic, no resolution drift).

**Expected**: `added N packages in Xs` (no vulnerabilities blocking).

**On failure**: `ERESOLVE` → run `npm install` once to refresh lockfile; then `npm ci`.

### Step 2: `npx prisma generate`

```bash
npx prisma generate
```

**Verifies**: Prisma client is generated against the current `schema.prisma` (after the SQLite → MySQL swap).

**Expected**: `Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client in Xs`.

**On failure**: `Schema validation error` → check `prisma/schema.prisma` syntax.

### Step 3: `npm run lint`

```bash
npm run lint
```

**Verifies**: ESLint passes with no errors (warnings are OK).

**Expected**: `✔ No ESLint warnings or errors` OR `X warnings 0 errors`.

**On failure**: `X errors` → run `npm run lint -- --fix` for auto-fixable issues; manually fix the rest.

### Step 4: `npm run typecheck`

```bash
npm run typecheck
```

**Verifies**: TypeScript compiles with no errors (runs `tsc --noEmit`).

**Expected**: (no output — exit code 0)

**On failure**: `error TS2307: Cannot find module '...'` → fix the import path. `error TS2322: Type 'X' is not assignable to type 'Y'` → fix the type mismatch.

### Step 5: `npm test`

```bash
npm test
```

**Verifies**: All 171 tests pass (164 unit/lib + 7 integration skipped if dev server not running).

**Expected**: `Test Files  2 failed | 6 passed (8)` without dev server OR `Test Files  8 passed (8)` with dev server.

**On failure**: Read the failing test output; fix the underlying code; re-run.

### Step 6: `npm run build`

```bash
npm run build
```

**Verifies**: Next.js builds successfully (compile + lint + bundle + standalone output).

**Expected**: `✓ Compiled successfully` + `✓ Build complete` + `.next/standalone/server.js` exists.

**On failure**: See "Errors that fail the build" table above.

### Step 7: `npm run verify:production`

```bash
npm run verify:production
```

**Verifies**: The production artefact is intact and runnable. This script (`scripts/verify-production.sh`) checks:
- `.next/standalone/server.js` exists and is non-empty
- `.next/standalone/.next/static/` is populated (JS/CSS chunks)
- `.next/standalone/public/` contains expected assets (robots.txt, favicons)
- `node_modules/@prisma/client` exists (Prisma client is bundled)
- `server.js` (project root) is readable
- `.env` exists (mode 600)
- `prisma/schema.prisma` has `provider = "mysql"` (production config)

**Expected**: `✓ Production artefact verified` (all checks pass).

**On failure**: The script prints which check failed with remediation hints.

---

## Inspecting the build artefact

### File listing

```bash
ls -lh .next/standalone/
ls -lh .next/standalone/.next/static/
ls -lh .next/standalone/public/
```

### Bundle analysis (optional)

For a visual breakdown of what's in the bundle:

```bash
# Install the analyzer (one-time)
npm install -D @next/bundle-analyzer

# Add to next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
# module.exports = withBundleAnalyzer({ /* existing config */ });

# Run with analysis enabled:
ANALYZE=true npm run build
# Opens a browser with treemap of the bundle
```

### Build manifest

```bash
cat .next/build-manifest.json | python3 -m json.tool | head -30
# Shows which JS chunks are loaded on which routes
```

### Required server files

```bash
cat .next/required-server-files.json | python3 -m json.tool | head -30
# Lists the files the server needs at runtime
```

---

## Local vs production build differences

| Aspect | Local dev (`npm run dev`) | Production (`npm run build`) |
|---|---|---|
| **Mode** | Development | Production |
| **NODE_ENV** | `development` | `production` |
| **HMR** | Enabled (hot module replacement) | Disabled |
| **Source maps** | Inline (for debugging) | Hidden (not served to clients) |
| **Bundle optimization** | Off (faster rebuilds) | On (tree-shaking, minification) |
| **Error pages** | Full stack traces | Generic branded error pages |
| **Cookie `Secure` flag** | Off (HTTP localhost) | On (HTTPS only) |
| **HSTS header** | Not sent | Sent |
| **Static optimization** | Off | On (static pages pre-rendered) |
| **Output** | In-memory (served by `next dev`) | `.next/standalone/` (self-contained) |

---

## Build performance tips

### Slow builds (> 5 minutes)

1. **Insufficient memory**: set `NODE_OPTIONS=--max-old-space-size=4096` before `npm run build`.
2. **Large public images**: optimize with `npm run images:optimize` before building.
3. **Too many fonts**: only include the weights you use.
4. **Turbopack issues**: try `NEXT_TELEMETRY_DISABLED=1 npm run build` (disables telemetry overhead).

### Build cache corruption

If the build behaves inconsistently (passes locally, fails on server):

```bash
rm -rf .next node_modules/.cache
npm ci
npm run build
```

This clears the Next.js and Turbopack caches and rebuilds from scratch.

### Memory issues on cPanel shared hosting

cPanel shared hosting typically limits memory to 512 MB–1 GB. Next.js build needs more.

**Solutions** (in order of preference):
1. Ask host to raise the MEMORY limit for your account.
2. Build locally and upload `.next/standalone/`:
   ```bash
   # On your local machine (Node 22+):
   npm ci
   npm run build
   # Upload .next/standalone/ to the server:
   rsync -avz .next/standalone/ aloeduca@server:/home/aloeduca/alaminn.info/.next/standalone/
   ```
3. Use a VPS instead of shared hosting (recommended for production).

---

## Quick reference

```bash
# ─── Full build sequence ──────────────────────────────────────────
cd ~/alaminn.info
npm ci                          # Step 1: install deps
npx prisma generate             # Step 2: generate Prisma client
npm run lint                    # Step 3: lint
npm run typecheck               # Step 4: type-check
npm test                        # Step 5: run tests (171 tests)
npm run build                   # Step 6: build (produces .next/standalone/)
npm run verify:production       # Step 7: verify artefact

# ─── Production restart after build ──────────────────────────────
# Via cPanel UI: Setup Node.js App → Restart
# Via terminal:
touch /home/aloeduca/alaminn.info/tmp/restart.txt
# OR
/opt/passenger/bin/passenger-config restart-app /home/aloeduca/alaminn.info
```

---

## Reference

- **Build script**: `package.json` → `"build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"`
- **Output dir**: `.next/standalone/`
- **Entry point**: `server.js` (project root) → `.next/standalone/server.js`
- **Build manifest**: `.next/build-manifest.json`
- **Required files manifest**: `.next/required-server-files.json`
- **Verify script**: `scripts/verify-production.sh` (run via `npm run verify:production`)
- **Node version**: 22.x preferred, 20.x minimum
- **Package manager**: npm (Bun supported as alternative)
- **Build mode**: Standalone (self-contained)
- **Verification sequence**: 7 steps (npm ci → prisma generate → lint → typecheck → test → build → verify:production)
- **Typical build time**: 90–180 seconds on a 2-core VPS with 4 GB RAM
- **Typical build size**: 50–150 MB
