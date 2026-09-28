# Synchronization, payroll, authentication and deployment evidence — 2026-09-28

## Scope and safety

- Branch: `arena/01a0c218-alo-education-z-ai`.
- Synchronization was performed by inspecting both unique commit sets and resolving the merge manually. It is recorded in commit `7653fb93` (merge commit; full SHA available locally). No force-push, reset, production deployment, live database mutation, DNS/SSL/firewall change, or secret exposure was performed.
- The supplied-link occurrence matrix remains at `AUDIT/link-completion-matrix-2026-09-27.md`; duplicates and entries marked Fetched/Read remain represented there.
- Production target evidence remains **NOT VERIFIED** in this sandbox: `server.aloeducation.com`, `115.187.18.239`, AlmaLinux/cPanel, SSH port `57813`, app port `3044`, PM2 `alo-education`, `/root/alo-github-main`. No live credentials or production test accounts were available.

## Changes by file

### Payroll and finance controls

| File | Change |
|---|---|
| `src/lib/hrms/payroll-controls.ts` | Added shared period validation, persisted-salary validation, complete preflight item construction, maker-checker enforcement, and legal review/approval/payment transitions. Missing or malformed salary data is rejected; no synthetic salary/tax values are used. |
| `src/app/api/admin/payroll/route.ts` | Replaced fallback salary/tax values with `EmployeeSalary` records; validates all employees before writes; creates run/items/totals inside a serializable Prisma transaction; rejects duplicate periods; separates `approve_payroll` from `pay_payroll`; uses record-derived maker identity and conditional state updates. |
| `src/app/api/hrm/payroll/route.ts` | Consolidated monthly HRM generation around `HrmPayrollRun` and `EmployeePayroll`; requires persisted salary records; transactionally creates all items; duplicate run guard; separate review, approval, and payment transitions; role and ownership checks on reads. |
| `src/app/api/employee-access/payroll/route.ts` | No longer accepts caller-supplied salary/tax values as the source of truth; uses persisted salary records and transactionally creates rows/items; prevents duplicate employee-period records; enforces maker-checker and approval-before-payment. |
| `src/lib/hrms/payroll.ts` | Makes basic salary, tax rate, PF rate and allowance inputs explicit and rejects invalid/missing salary configuration instead of silently defaulting. |
| `prisma/schema.prisma` | Adds unique `EmployeePayroll(employeeId, period)` protection; the run-level admin record uses `employeeId=''`. |
| `prisma/migrations/20260928000000_payroll_safety/migration.sql` | Additive schema reconciliation plus the unique index. It deliberately fails on pre-existing duplicate rows rather than deleting or choosing data. It is not run automatically. |
| `tests/unit/payroll-controls.test.ts` | Tests invalid/missing salary, period validation, complete preflight/partial failure prevention, duplicate/status transitions, and maker-checker. |
| `tests/unit/payroll-route-transaction.test.ts` | Handler-level mocked transaction tests for partial failure rollback, duplicate runs, permission denial, and approval/payment separation. |
| `tests/unit/finance-authz-regression.test.ts` | Updated regression assertions for record-derived makers, separate payment action, and removal of fallback values. |
| `src/components/crm/pages/CrmHRMPage.tsx` | Corrected UI messaging so approval is not presented as disbursement. |

### Authentication, cookies and proxy/RBAC

| File | Change |
|---|---|
| `src/app/api/portal-auth/login/route.ts` | Adds per-IP/email failed-login throttling; retains portal type/status/password checks; removes raw database session token from JSON; sets an HttpOnly, secure-aware, SameSite cookie. |
| `src/app/api/student/auth/login/route.ts` | Removes raw student session token from JSON; sets an HttpOnly, secure-aware, SameSite cookie while retaining suspended-user and failed-login protections. |
| `src/lib/auth-middleware.ts` | Accepts the HttpOnly portal cookie or legacy bearer token, rejects fabricated `null`/`undefined` bearer values, and preserves DB session/revocation/status checks. |
| `src/lib/student-auth.ts` | Accepts the HttpOnly student cookie or legacy bearer token and preserves session expiry, revocation, suspension, and ownership checks. |
| `src/app/api/portal-auth/logout/route.ts` | Revokes the DB session and clears both custom and NextAuth cookies. |
| `src/app/api/student/auth/logout/route.ts` | Revokes student sessions and clears both custom and NextAuth cookies. |
| `src/app/student/layout.tsx`, `src/app/student/login/page.tsx`, `src/lib/stores/portal-store.ts` | Removes new browser-readable token persistence and relies on cookie credentials; legacy local-storage token values are removed during hydration/login. |
| `src/proxy.ts` | Preserves explicit protected API and role-route policy; allows only the student session handler to process a valid student cookie/bearer, while sensitive handlers still enforce authorization. |
| `tests/unit/auth-session-hardening.test.ts` | Verifies no login JSON token exposure, cookie attributes/clearing, cookie middleware support, and throttling evidence. |

### Deployment, rollback, organization and references

| File | Change |
|---|---|
| `.github/workflows/deploy-production.yml` | Adds SSH key passphrase input, preserves host-key pinning, pins and verifies the supplied ED25519 fingerprint `SHA256:K0041d6kUdse+U6+vHijY73qb1ur/GsedNae8g8a+tU`, and retains exact-SHA deploy, backup preservation, migration opt-in and backup gate. |
| `scripts/health-check.sh` | Canonicalized health probe for PM2/cPanel with optional public/systemd modes. Requires app `ok` and connected database. |
| `deploy/ubuntu/health-check.sh`, `deploy/ubuntu/rollback.sh` | Compatibility wrappers to the canonical scripts, preventing Ubuntu/AlmaLinux logic drift. |
| `scripts/rollback.sh` | Remains exact-commit rollback without DB reset or deletion of `.env`, storage, uploads, or public uploads. |
| `deploy/ubuntu/deploy.sh` | Separates Ubuntu deployment path, uses port 3044, preserves `.env`/storage/uploads during rsync, and makes migration application opt-in with a verified backup requirement; seeds are not automatic. |
| `deploy/ubuntu/alo-education.service`, `deploy/ubuntu/Caddyfile`, `deploy/ubuntu/restore.sh`, `scripts/cron-scheduler.sh`, `src/app/api/health/route.ts` | Corrected stale Ubuntu/restore/cron references to the canonical port 3044 and `/opt/alo-education` Ubuntu path. |
| `docs/PRODUCTION-ROLLBACK-RUNBOOK.md`, `docs/PRODUCTION-ROLLBACK.md`, `public/docs/DEPLOYMENT-GUIDE.md` | Updated operational references to `/root/alo-github-main`, exact-commit rollback and port 3044. |
| `tests/unit/deployment-config.test.ts` | Verifies passphrase wiring, pinned fingerprint, migration safety markers, port and build configuration. |

### Synchronization carry-forward

The manually resolved staged merge also carries forward the main-branch audit/security work without replacing it: student-resource authorization, counselor/branch-manager access, protected `/api/students`, deployment health URL correction to `/course-finder`, robots/sitemap routes, supplied-link evidence, and the earlier public-route/RBAC repairs. No conflict markers or unmerged entries remain.

## Evidence matrix

| Check | Result | Evidence / limitation |
|---|---|---|
| Merge conflict state | **PASS** | `git diff --name-only --diff-filter=U` returned no paths; marker scan was clean. Merge commit `7653fb93` was created after validation of the staged resolution. |
| Diff hygiene | **PASS** | `git diff --check` passed. Shell scripts passed `bash -n`. |
| Prisma schema/migration | **BLOCKED / NOT VERIFIED** | `prisma generate`, `prisma validate`, and `prisma format --check` were blocked before completion by the sandbox TLS disconnect while downloading Prisma engines from `binaries.prisma.sh`. The migration was not applied. A verified backup and duplicate preflight are required before any operator enables migrations. |
| Targeted payroll/auth/proxy/deployment tests | **PASS** | 6 test files / 47 tests passed, then 3 payroll/auth files / 12 tests passed after the cookie/deployment changes. |
| Full Vitest suite | **PARTIAL** | 27 files / 271 tests passed. `tests/integration/consultation-workflow.test.ts` could not load because generated Prisma Client is unavailable (`Cannot find module '.prisma/client/default'`). |
| ESLint | **PASS** | Full lint and focused changed-file lint completed with exit 0. |
| Typecheck | **BLOCKED** | `tsc --noEmit` cannot resolve `PrismaClient`/`Prisma` because Prisma generation is blocked; a clean generated-client typecheck is not claimed. |
| Production build | **BLOCKED** | `npm run build` stops at its required `prisma generate` step for the same network/engine reason; no standalone artifact is claimed. |
| Browser/API tests | **NOT VERIFIED** | No network-enabled browser runner, generated build, production credentials, or disposable MySQL database was available. Next action: run Playwright/API matrix in CI/staging after Prisma generation, including anonymous/invalid session, portal type/role, suspended users, ownership/file access, pagination, forms, responsive and accessibility cases. |
| SSH fingerprint/server/rollback | **NOT VERIFIED** | No live SSH session or fresh server host-key evidence was obtained. Workflow now refuses a non-matching fingerprint rather than disabling verification. |
| Production backup/data preservation | **NOT VERIFIED** | No production data was touched. Workflow and rollback code preserve `.env`, storage, uploads and DB by default; live backup/restore rehearsal remains required. |
| Robots/sitemap | **PASS (repository evidence)** | `src/app/robots.ts` and `src/app/sitemap.ts` remain present; live HTTP verification is **NOT VERIFIED** in this phase. |
| Supplied links | **PARTIAL** | Existing occurrence-preserving matrix remains maintained; external credentials, licensing and live provider integrations remain clearly marked there. |

## Open issues and risks

1. **Prisma engine/network gate:** CI or a network-enabled environment must run generation before typecheck/build/integration tests. Do not treat the partial full-test result as release sign-off.
2. **Migration drift risk:** the new additive reconciliation assumes the committed migration history's old `EmployeePayroll` shape. Verify the actual target schema and duplicate rows against a verified backup before opt-in deployment. The unique-index step is intentionally fail-closed.
3. **In-memory login throttling:** per-IP/email limits protect a single process; a multi-instance production deployment should back the counter with the existing shared rate-limit/Redis-equivalent service before claiming cluster-wide brute-force protection.
4. **Cookie migration:** legacy bearer clients remain accepted for compatibility. After all clients are confirmed cookie-capable, revoke old bearer sessions and remove legacy bearer support in a separately reviewed change.
5. **Live verification remains outstanding:** no claim is made for production PM2, DNS, TLS, DB counts, external webhooks, provider credentials, or browser behavior.
