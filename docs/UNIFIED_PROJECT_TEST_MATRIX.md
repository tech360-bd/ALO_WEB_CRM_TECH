# Unified Project — Test Matrix

**Date:** 2026-10-27
**Environment:** Node v22.22.3, npm 10.9.8, Linux sandbox, 4 GB RAM, no MySQL/Docker/Chromium.

Statuses: **PASS**, **FAIL**, **BLOCKED**, **NOT RUN**, **N/A**.

---

## 1. Quality gates

| # | Check | Command | Result | Evidence | Scope |
|---|---|---|---|---|---|
| 1 | TypeScript | `tsc --noEmit -p tsconfig.json` | ❌ **FAIL** | exit 2, **91 errors / 31 files** | `src/**` (excludes prisma/scripts/backend) |
| 2 | ESLint | `eslint . --max-warnings=-1` | ✅ **PASS** (after repair) | exit 0, 0 errors | whole repo |
| 3 | Unit + integration | `vitest run` | ❌ **FAIL** | **19 files / 25 tests failed**, 3,400 passed, 38 skipped | 321 files / 3,463 tests |
| 4 | Production build | `next build --webpack` | ❌ **FAIL** | OOM + SIGABRT (~88 s) | whole app |
| 5 | Prisma generate | `prisma generate` | ⛔ **BLOCKED** | engine download blocked | schema → client |
| 6 | Prisma migrate/push | `prisma migrate deploy` / `db push` | ⛔ **BLOCKED** | no DB + no engine | schema → DB |
| 7 | E2E (Playwright) | `playwright test` | **NOT RUN** | no Chromium in sandbox | browser flows |
| 8 | Docker build/run | `docker compose …` | **NOT RUN** | no Docker in sandbox | containers |
| 9 | HTTP route probe | `curl` against dev server | ⚠️ **BLOCKED** | app fails at `@prisma/client` init | runtime |
| 10 | Runtime health | app startup | ⚠️ **BLOCKED** | no `.env` + no generated client | runtime |

## 2. Test suite detail (vitest)

- **Files:** 321 total → 298 passed, 19 failed, 4 skipped
- **Tests:** 3,463 total → 3,400 passed, 25 failed, 38 skipped
- **Duration:** 80.45 s (transform 6.70 s, import 21.76 s, tests 14.69 s)

### 2.1 Failing files

```
tests/unit/accounting-ledger.test.ts
tests/unit/ai-security-remediation.test.ts
tests/unit/application-risk-score.test.ts
tests/unit/business-hours-policy.test.ts
tests/unit/cms-revisions.test.ts
tests/unit/critical-safety-remediation.test.ts
tests/unit/design-tokens.test.ts
tests/unit/journal-integrity.test.ts
tests/unit/student-success-score.test.ts
tests/unit/phd/auth-access.test.ts
tests/unit/phd/storage-security.test.ts
tests/integration/communication-ownership.test.ts
tests/integration/content-publication-security.test.ts
tests/integration/employee-access-live-db.test.ts
tests/integration/language-prep-catalog-live-db.test.ts
tests/integration/owner-ai-chat-live-db.test.ts
tests/integration/partner-b2b-security.test.ts
tests/integration/webhook-security-live-db.test.ts
tests/integration/phd/services.test.ts
```

### 2.2 Classification

| Category | Files | Cause | Status |
|---|---|---|---|
| Live-DB integration | `*-live-db`, `communication-ownership`, `content-publication-security`, `partner-b2b-security`, `webhook-security-live-db` | No MySQL instance | **BLOCKED** |
| Prisma-client confound | `cms-revisions`, `journal-integrity` | Stub Prisma client (`dmmf`/`instanceof`) | **BLOCKED** (clears after R5) |
| Needs triage vs real DB | `accounting-ledger`, `ai-security-remediation`, `application-risk-score`, `business-hours-policy`, `critical-safety-remediation`, `design-tokens`, `student-success-score`, `phd/*` | Mixed — some may be genuine | **TRIAGE REQUIRED** |

> No test result was altered or suppressed to obtain a pass.

## 3. Manual / static verification performed

| Item | Method | Result |
|---|---|---|
| Route inventory | `find src/app -name page.tsx` | 457 pages |
| API inventory | `find src/app/api -name route.ts` | 1,034 routes |
| Prisma model count | `grep -c '^model ' prisma/schema.prisma` | 604 |
| Prisma migrations | `ls prisma/migrations` | 41 |
| Auth gate review | read `src/proxy.ts` | Fail-closed; public whitelist present |
| New-component typecheck | `tsc -p <focused tsconfig>` | PASS (exit 0) |
| New-component lint | `eslint <dir>` | PASS (exit 0) |
| Reference-repo access | `git ls-remote` | canonical OK; 3 sibling repos "not found" |

## 4. Unverified areas (must not be assumed working)

- Runtime HTTP behavior of any page/API (app cannot start).
- Database schema vs. live tables (no DB).
- Authentication/authorization end-to-end (no runtime).
- Deployment, containers, reverse proxy, SSL (no infra access).
- Browser rendering, responsive layout, accessibility (no Chromium).
- External AI/WhatsApp/email provider connectivity (no credentials).
- Backup/restore (no backups accessible).

## 5. Before / after

| Gate | Before | After |
|---|---|---|
| ESLint | 2 errors | **0 errors** |
| TypeScript | 91 errors | 91 errors (BLOCKED by Prisma engine) |
| Tests | 25 failed | 25 failed (BLOCKED by DB/engine) |
| Build | OOM | OOM (BLOCKED by memory) |
