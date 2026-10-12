# ALO Education — Platform Architecture

> This document describes the **actual** implemented architecture of the ALO
> Education platform. It is maintained alongside the code; if the code changes,
> this document must change with it.

## 1. Non-negotiable production stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | **22.x** (asserted by `scripts/assert-node22.cjs` at build time) |
| Framework | Next.js (App Router, `output: "standalone"`) | 16.3.6 |
| UI | React, Tailwind CSS 4, shadcn/ui, Radix UI | React 19 |
| Language | TypeScript (strict) | 5.x |
| ORM | Prisma | 6.19.x |
| Database | **MySQL 8** (`datasource db { provider = "mysql" }`) | — |
| Validation | Zod 4 | — |
| Auth | NextAuth (Auth.js compatible) + custom `withAuth` middleware | — |
| State | Zustand (client), TanStack Query (server state) | — |
| Cache/queue (optional) | Redis via ioredis (`REDIS_URL`, only where justified) | — |
| Testing | Vitest (unit/integration), Playwright (E2E) | — |
| AI | Multi-provider gateway (Groq / OpenRouter / ZAI-GLM / local) | — |

**Node.js 22.x is mandatory.** It is pinned in `.nvmrc`, `.node-version`,
`package.json#engines`, `Dockerfile`, and `.github/workflows/ci.yml`
(`NODE_VERSION: '22'`).

### Documented conflict with the master specification

The specification names PostgreSQL as the canonical database. The **actual
production system is MySQL 8** — see the `init_mysql` migration, the
`mysql2` driver, and `documentation/MYSQL_MIGRATION_READINESS.md`. Per the
specification's own conflict rule ("implement the architecture compatible with
the current production system"), MySQL is canonical and PostgreSQL is **not**
introduced.

## 2. Repository layout

```
prisma/            schema.prisma (479 models), migrations/, 20+ seed scripts
src/
  app/             App Router — 368 pages, 820 API route handlers
    api/           REST API surface (see docs/API_FUNCTIONALITY_MATRIX.md)
  components/      425 components grouped by domain (admin, ai, crm, student,
                   employee, visa, marketing, website, ui, shared, …)
  lib/             239 modules: services, engines, gateways, utilities
  hooks/           React hooks
  types/           shared TypeScript types
  proxy.ts         Edge middleware (auth gate, public route allowlist)
  cron/            cron-invoked job handlers
tests/
  unit/            51 Vitest test files (DB-free; DB tests self-skip)
  integration/     DB-dependent tests (self-skip without TEST DATABASE_URL)
  e2e/             Playwright (public + auth flows, desktop & mobile)
  deployment-ownership.test.mjs / runtime-standard.test.mjs  (node --test)
scripts/           build, deploy, audit, verification, data scripts
```

Legacy/reference material retained deliberately (not part of the build):
`alo-education-web-crm-final/` (historical delivery snapshot),
`deploy-build/` (previous standalone build evidence), `alo-cpanel/`,
`backend/`, `mini-services/`, `external/`.

## 3. Application architecture

### 3.1 Rendering model
- The public site and portals are predominantly **client components** behind an
  App Router shell; `/` (`src/app/page.tsx`) is a portal-shell that switches
  between the public homepage and authenticated portal views via the Zustand
  `portal-store`.
- Data-driven public pages (universities, courses, destinations, blog, …) are
  real routes under `src/app/` and fetch through API route handlers.
- `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx` are present
  at the app root; per-route `error.tsx`/`loading.tsx` exist on major sections.

### 3.2 Middleware / auth gate
`src/proxy.ts` (Next.js middleware): public-route allowlist, NextAuth JWT
check, protected-route redirect to `/login`. API authorization is enforced
**server-side** in every handler through `withAuth()`
(`src/lib/auth-middleware.ts`) — role/permission checks never rely on UI
hiding alone.

### 3.3 API pattern
```
Route handler (src/app/api/**/route.ts)
  → Zod validation
  → withAuth() authentication + RBAC authorization
  → service module (src/lib/**)
  → Prisma (src/lib/db.ts)
  → MySQL
```
Responses follow the project convention:
`{ success: boolean, ...data }` with proper HTTP status codes
(400/401/403/404/409/422/429/500/503). Stack traces, Prisma internals and
credentials are never returned to clients.

### 3.4 AI platform
`src/lib/ai.ts` (providers) → `src/lib/ai-gateway.ts` (authoritative routing,
schema validation, correlation ids, department model policy) →
`src/lib/model-router.ts` (task-type routing, private-data protection) →
agent runtime (`src/lib/agentos/`, `agent-orchestrator.ts`,
`agent-extension-registry.ts`) with skills/tools registries, memory
(`AgentMemory`, `AiStudentMemory`), approval queues and guardrails
(`ai-safety.ts`, `tool-permission-boundary` tests). See
`AI_ARCHITECTURE.md`.

### 3.5 Communication stack
WhatsApp Cloud API (`src/lib/whatsapp-cloud-api.ts`), Unified Communication
Center (UCC: `src/lib/communication/`), 3Cx telephony journaling, email
service, Chatwoot inbox bridge, OTP engine, broadcast engine, after-hours
automation. See `CRM_DOCUMENTATION.md`.

## 4. Build & deployment

- **Build:** `npm run build` → assert Node 22 → `prisma generate` →
  `db:verify-client` → `next build --webpack` (single-worker, 4 GB heap,
  standalone output) → `scripts/prepare-standalone.mjs`.
- **Runtime:** production serves `.next/standalone/server.js`
  (`npm start`), with `GET /api/health` (readiness, DB probe, no secrets)
  and `GET /api/health/live` (liveness).
- **Deployment ownership:** **Hostinger (managed cPanel Node.js) owns
  production.** GitHub Actions is **CI-only** (`ci.yml` never deploys;
  `deploy-production.yml` is an explicit refusal notice). Docker, docker
  compose, PM2 `ecosystem.config.cjs` and legacy shell deployers are retained
  but deliberately disabled (`tests/deployment-ownership.test.mjs` pins this).
  See `HOSTINGER-RUNTIME-STANDARD.md` and `DEPLOYMENT_ENTRYPOINT_MATRIX.md`.

## 5. Security architecture
- Zod validation on all inputs; RBAC via roles + granular permissions
  (`src/lib/permissions.ts`, seeded 13 roles / 68 permissions).
- Security headers (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy) in `next.config.ts`.
- Password hashing (bcrypt), audit logging (`AloAuditLog`), rate limiting on
  sensitive routes, document security (`document-security.ts`,
  `file-validator.ts`), secret-scan gate in CI.
- Secrets are environment-only; `.env*` is gitignored, `.env.example`
  templates carry `REPLACE_*` placeholders.

## 6. Observability
- Request-scoped logging with sanitization (no passwords/tokens/keys in logs).
- `GET /api/health` reports app + database status without exposing internals.
- AI runs record provider, model, latency, usage, fallback and correlation id.
- `docs/` contains per-subsystem audit reports; `worklog.md` is the running
  engineering log.
