> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education production audit evidence — 2026-09-27

## Executive status

Repository implementation and locally reachable checks are **PARTIAL**. Production remains **NOT VERIFIED**. No SSH login, deployment, migration, database write, DNS/SSL/firewall change, PM2 mutation, or production backup was performed.

The occurrence-preserving supplied-link matrix is maintained separately at [`AUDIT/link-completion-matrix-2026-09-27.md`](./link-completion-matrix-2026-09-27.md). It contains all 161 supplied link occurrences, including duplicates and entries marked Fetched/Read.

## Verification matrix

| Area | Result | Evidence and exact limitation |
|---|---|---|
| Repository lint | **PASS** | `npm run lint` completed successfully. Focused lint also passed for the Next config and updated dynamic public routes. |
| Diff hygiene | **PASS** | `git diff --check` completed successfully. |
| Unit/security suite | **PARTIAL** | `npm test`: 25 test files passed; 263 tests passed. The consultation integration suite could not load because generated Prisma Client is unavailable (`Cannot find module '.prisma/client/default'`). The isolated `tests/unit` run passed 24 files / 241 tests. |
| Prisma generation | **NOT VERIFIED** | `npx prisma generate` and `npm run db:validate` were blocked before validation by the sandbox network disconnecting during TLS to `binaries.prisma.sh`. No generated client or engine exists in this checkout. |
| Type safety | **PARTIAL/FAIL** | `npx tsc --noEmit` reports only the missing generated-client exports in `src/lib/db.ts` (`PrismaClient`) and `src/lib/student/canonical-student.ts` (`Prisma`). A clean generated-client typecheck is **NOT VERIFIED**. |
| Production build | **NOT VERIFIED** | `npm run build` cannot complete its first `prisma generate` step under the same Prisma engine download block. No standalone artifact is claimed. |
| E2E discovery | **PASS** | `npm run test:e2e -- --list` discovered 8 tests across Chromium desktop/mobile. |
| E2E production-config run | **FAIL/NOT VERIFIED** | `npm run test:e2e` could not start because the config expects `.next/standalone/server.js`, which is absent while build is blocked. |
| Browser execution | **NOT VERIFIED** | A dev-server Playwright run executed 8 tests: the two anonymous UCC API checks passed on desktop and mobile; six UI tests could not launch because the Playwright Chromium executable is not installed in the sandbox. |
| Public page HTTP smoke | **PARTIAL/PASS for reachable scope** | Dev server returned 200 for tested public routes including homepage, policy/auth pages, `/blog`, representative blog/service/scholarship/resource/success-story/team/visa pages, and language-prep pages. Protected pages redirected anonymously with 307. Database-backed destination pages returned 500 locally only because the generated Prisma module is missing. |
| Public API/health smoke | **PARTIAL** | Proxy-level anonymous authorization returned expected 401 for tested protected APIs. `/api/health` and `/api/universities` return 500 locally because Prisma Client is not generated; this is not production evidence. |
| Remote-image runtime | **PASS locally after fix** | `next.config.ts` now allows only `https://images.unsplash.com/**` through `next/image`; `/blog` and representative pages then returned 200 without the prior unconfigured-host error. |
| Next 16 dynamic params | **PASS for patched public routes** | Blog, success-story, team, and visa-support detail routes now await Promise-based `params`, removing the runtime `sync-dynamic-apis` warnings observed during the audit. Representative requests returned 200 after the fix. |
| Robots/sitemap | **PASS locally** | Conflicting `public/robots.txt` was removed; `src/app/robots.ts` serves `/robots.txt`, and `/sitemap.xml` returned 200. |
| Production SSH/server/PM2 | **NOT VERIFIED** | TCP to `server.aloeducation.com:57813` connected but the SSH connection reset during key exchange; no host key or authentication evidence was obtained. Supplied ED25519 fingerprint remains preserved and unverified. |
| DNS/SSL | **NOT VERIFIED** | No authoritative response was available for `ns1.aloeducation.com` or `ns2.aloeducation.com` from this environment. No certificate or reverse-proxy inspection was performed. |
| Database state/migrations/backups | **NOT VERIFIED** | No production connection, backup, migration, restore, or data mutation was performed. The production workflow now defaults to `SKIP_MIGRATIONS=true` and requires a verified `mysqldump` backup for explicit migration runs. |
| Integrations, AI, jobs, queues, provider accounts | **NOT VERIFIED live** | Code boundaries and unit tests exist, but production credentials, webhook deliveries, retries/dead letters, provider health, spend limits, and background workers require authorized runtime evidence. |
| Pagination, combined filters, uploads/downloads, forms, accessibility, responsive UI | **NOT VERIFIED end-to-end** | Static inspection and page HTTP checks are not a substitute for browser interaction at all roles, viewport sizes, list states, mutation/count changes, and assistive-technology checks. |

## Implemented in this audit branch

- Central proxy and handler-level RBAC/ownership hardening across CRM course import, public lead writes versus protected lead reads, interview resources, SOP generation, visa AI interview bearer routing, and related student/staff resources.
- Production migration safety: explicit opt-in migrations, required `mysqldump`, non-empty backup verification before `prisma migrate deploy`, and safe default skip.
- Canonical robots route without the `public/robots.txt` conflict.
- Hostname-scoped Unsplash `next/image` configuration.
- Next 16 Promise-based dynamic route params for public blog, success story, team, and visa-support detail pages.
- Destination child routes now use the shared country-alias resolver (for example, `united-kingdom` → `uk`) and the destination course listing filters by the selected country through both course and university country fields rather than returning an unscoped global course list.
- Existing bounded AI tool loop, marketing/diagram/reference implementations, source-intelligence boundaries, and duplicate-preserving external-link completion matrix remain in the repository and are documented by the link matrix.

## Required next actions before any production claim

1. Run Prisma generation in a networked/cache-enabled environment, then run `npm run typecheck`, `npm run build`, `npm test`, integration tests, and API/page smoke checks again.
2. Install the pinned Playwright browser in the test environment and run the production-config desktop/mobile suite; expand it to authenticated role, pagination, forms, upload/download, search/filter/sort, navigation, accessibility, and responsive matrices.
3. Obtain authorized SSH access using the expected key, compare the ED25519 fingerprint before accepting it, and inspect (without mutation) PM2, port 3044, proxy, logs, disk, environment, and deployed commit.
4. Take and verify a production database backup before any migration; inspect schema/data counts and rehearse restore. Only then consider a controlled deployment and reversible rollback.
5. Verify authoritative DNS, TLS chain/renewal, proxy headers, provider credentials, scheduled jobs, queues, webhooks, and third-party licensing with evidence captured in the final matrix.
