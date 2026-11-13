# Employee Dashboard Verification

> Mandate §24, §94, §96. The full role×capability matrix is in
> `EMPLOYEE-DASHBOARD-MATRIX.md` and `RBAC-MATRIX.md`; this file records the
> §94 verification verdict.

## §94 acceptance verdict

| Test | Status | Evidence |
|---|---|---|
| Dashboard loads | IMPLEMENTED_BUT_UNVERIFIED | `/employee` page exists; needs live session |
| Unauthorized access fails | VERIFIED (audited routes) | `requireUserTypes`; 23 regression tests (11 api-authz + 7 cron-auth + 5 finance-authz) |
| Wrong role denied | VERIFIED (audited routes) | finance/payroll role gate tested |
| Authorized user sees only permitted data | IMPLEMENTED_BUT_UNVERIFIED | owner-scoping fixed (student profile, employee docs); full matrix untested |
| API returns 401/403 | VERIFIED (audited routes) | 401 anonymous / 403 wrong-type asserted |
| CRM restricted by permission | IMPLEMENTED_BUT_UNVERIFIED | RBAC layer present; per-route matrix untested |
| AI blocked when disabled | CODE_COMPLETE | `isGlobalAiPaused` + approval policy |
| Every action audited | CODE_COMPLETE | `logAuditAction` writes `PortalAuditLog` |
| Audit visible to Super Admin | IMPLEMENTED_BUT_UNVERIFIED | `/super-admin/audit-logs` page exists; needs live check |

## §24 dashboard capabilities (§24 list)
Overview · My Work · Leads · Applications · Conversations · CRM · Students ·
Documents · Calls · SMS · Email · Social · WhatsApp · Campaigns · Tasks · SLA ·
Escalations · AI Assist · Reports · Team · Audit · HR · Attendance · Payroll ·
Finance · Performance — **all have pages/routes in code** (see
`docs/audit/COMPLETE-WEBSITE-ROUTE-INVENTORY.md`: 37 `/employee` pages).
"Page exists" ≠ "VERIFIED" (§98); live rendering + data binding is
`IMPLEMENTED_BUT_UNVERIFIED`.

## Honest findings
1. The RBAC **layer** is `CODE_COMPLETE` and the **audited sensitive routes** are
   `VERIFIED` (regression-tested).
2. The **full §94 role×capability matrix** is **not** exhaustively tested. A
   dedicated `tests/rbac/employee-dashboard-matrix` suite is recommended
   (`RBAC-MATRIX.md`).
3. Live dashboard rendering, CRM data binding, AI-assist approval, and audit-log
   visibility all require a running authenticated instance — `LIVE_TEST_PENDING`.

## What VERIFIED requires
Per role: login → dashboard → permitted views → permitted actions → denied
actions → audit trail, each asserted server-side. Until the dedicated RBAC suite
exists and passes, the matrix is `IMPLEMENTED_BUT_UNVERIFIED`.

## Bounded employee access hardening (2026-10-24)

- `src/lib/employee-access-engine.ts` no longer treats Chairman, CEO, or Director designations as wildcard global grants. These titles now have no default capabilities in this legacy/advisory matrix; Super Admin remains the system master and all other executive capabilities must come from explicit server-side permissions. `tests/unit/employee-designation-least-privilege.test.ts` verifies no designation-only RBAC, payroll approval, or student deletion access.
- `/api/whatsapp/routing` now requires routing-view permission, scopes `communication.view_assigned` reads to the current employee/branch, returns a minimized routing projection (not recipient/source PII), restricts previews to administrators and same-origin, validates preview inputs, and marks previews as not provider-verified. Route tests pass.
- `/api/hrm/widgets` no longer queries an employee's net salary unless the employee has the exact own-salary permission; salary data is returned only after a value-free salary-access audit write succeeds. `tests/unit/hrm-widget-salary-privacy.test.ts` covers deny/no-query, authorized own-slip/audit, and audit-failure deny behavior.
- `/api/employee/students` now requires an active employee plus assigned-student permission, resolves record ownership from the authenticated Employee ID aliases, bounds pagination/sort, and selects only student-list fields. The employee Students page no longer renders fabricated sample students or substitutes made-up countries/statuses.
- `/api/employee/applications` now scopes reads and updates to assigned student profiles, bounds pagination/search/sort, exposes only permitted next-stage choices, and adds a same-origin, permission-checked compare-and-set transition with internal timeline and audit writes in one transaction. The employee Applications page now uses the real endpoint and no longer uses fabricated sample applications or optimistic success when updates fail.
- Focused route/regression suites for these changes passed: 4 files / 17 tests. Changed employee and HRM files passed focused ESLint and `git diff --check`.

The employee self-service dashboard API (`/api/employee-access/employee-dashboard`)
now requires an active `Employee` record, scopes employee-owned reads to aliases
resolved from that authenticated record, minimizes document/agreement fields, and
writes a category-only private-view audit event. Evidence:

- `tests/unit/employee-self-service-scope.test.ts`: 5 tests for no employee,
  inactive employee, ID-alias scoping, agreement/document minimization, and audit.
- `tests/unit/employee-feature-access-route.test.ts`: 5 tests for admin-only
  rule enumeration/writes, schema-valid create, idempotent update and validation.
- Combined focused employee suites (`employee-self-service-scope`,
  `employee-feature-access-route`, `employee-dashboard-scope`,
  `employee-access-deep-audit`, `employee-access-acceptance`): 5 files / 73 tests passed.
- Changed API/UI/test ESLint and `git diff --check`: passed.

## API-backed employee Tasks and Reports (2026-10-24)

- `/api/employee/tasks` now requires an active employee and explicit task view/create/update permissions, scopes reads and updates to authenticated employee ID aliases, bounds task list projections, validates writes, and audits reads/mutations. The existing task UI now uses API results only: fabricated tasks and optimistic/fake success paths were removed, delete is no longer offered without a real authorized delete workflow, and unavailable data is shown as an error. The permission catalog grants the three task permissions to employee/counselor/application/visa roles in their existing defaults; company-wide task access is not granted.
- `/api/employee/reports` and Employee Reports are API-backed, employee-scoped, permission-gated and audited; the profile lookup selects only the employee ID required for alias resolution. Report read/audit failure returns an error rather than success-shaped zero aggregates.
- `tests/unit/employee-tasks-route.test.ts` (4 tests) and `tests/unit/employee-reports-scope.test.ts` (4 tests) cover active employee, permissions, scope, projection/audit, request validation and fail-closed behavior. Focused employee task/report/student/application/HR salary suite passed: 5 files / 19 tests. ESLint and `git diff --check` passed for the touched files.

## Own-salary privacy and honest salary UI (2026-10-24)

- `/api/employee/salary` now requires an active Employee record and exact `h6` own-salary permission, scopes all compensation queries to employee ID aliases, minimizes returned fields (including commission/student and approval-private data), writes a value-free access audit, and fails closed if audit persistence fails.
- Employee Salary now displays only API-backed salary/compensation records, distinguishes no record from a zero value, and no longer renders invented salary/payslip data or a fake PDF-download interaction. Payslip download is explicitly unavailable until a verified document endpoint exists.
- `tests/unit/employee-salary-route.test.ts`: 3 tests cover active employee/permission, alias scope/minimized projection/audit, and fail-closed audit. Combined focused employee tasks/reports/students/applications/salary/HR privacy run: 6 files / 22 tests passed.
- `/api/employee-access/leave` now requires active employee status and explicit view/create/approve permissions, scopes own and manager reads to employee aliases or same-branch/company permissions, prevents self-approval and out-of-branch approval, validates leave dates/types, compare-and-set transitions only from pending, and writes audit records with mutations. The legacy `/api/employee/leave` path delegates to the same authorization. Leave balances are never invented; the UI uses the existing EmployeeLeave/EmployeeLeaveBalance models and no longer returns fake success on failed submission.
- `tests/unit/employee-leave-route.test.ts`: 4 tests cover active status/permission denial, alias scope/projection/audit, same-origin and forged-ownership create validation, and approval separation of duties. The leave page is self-service only; an authorized manager approval UI remains absent, and no policy for dynamic balance accrual/consumption has been validated.
- Employee Leads now shows only real created-lead rows, derives count/conversion metrics from those rows, and supports the existing permission-checked create endpoint. Fabricated lead records, fake response-time KPI, client-only note/status writes, and the fake “coming soon” Add Lead button were removed. The API now requires an active employee, scopes by verified User creator ID, returns minimized lead fields, and audits reads. Assigned/team mapping still fails closed; note/status mutation workflow is not yet implemented.
- `/api/employee/performance` and Employee Performance now use actual review records, active employee checks, explicit own/company-view and manage permissions, scoped/minimized reads, value and object validation, same-origin writes, self-review separation, compare-and-set updates, and transactional audits. The UI no longer contains fabricated trend, feedback, response-time or satisfaction data. `tests/unit/employee-performance-route.test.ts` adds 5 authorization/scope/write validation tests; no manager review authoring UI is provided yet.
- The employee view router now directs its normal dashboard selection to the existing API-backed `UnifiedEmployeeDashboard`; role-matrix wiring and authenticated browser rendering remain unverified.
- Final focused employee suite passed: 11 files / 47 tests. Full repository `npm run lint` and `git diff --check` passed after the latest changes.
- `npm run typecheck`: BLOCKED before TypeScript compilation because `.prisma/client/default` is missing. Prisma client generation requires the Prisma engine artifact, whose download has previously failed in this environment. No full build has been verified.

This does **not** verify the remaining employee HR/attendance APIs, manager leave
or performance authoring UI, payslip documents/downloads, branch/country/partner
mappings, browser navigation, the complete role matrix, database-backed behavior,
or production. The full role×capability verdict remains
`IMPLEMENTED_BUT_UNVERIFIED`; no full build or production verification has been
completed.

## Production-readiness continuation (2026-10-24)

The consolidated, route-by-route static triage and current blockers are recorded
in [`EMPLOYEE-MODULE-PRODUCTION-READINESS-REPORT.md`](./EMPLOYEE-MODULE-PRODUCTION-READINESS-REPORT.md).
The latest full repository run reported 249 files passed, 14 failed and 2 skipped;
2,804 tests passed, 3 failed and 28 skipped. The failures are blocked by the
missing generated Prisma client; the two integration suites skipped because
`TEST_DATABASE_URL` is absent. Prisma 6.19.3 validation and generation both failed
to retrieve the official schema engine over TLS in this sandbox. The design-token
regression itself now passes. These results do not change the unverified status or
imply production readiness.

The temporary-permissions route now reports date-effective expiry, limits direct
grants to allowlisted view-only scopes with authorized HR review authority and a
maximum 30-day duration, and supports immediate audited revocation by the grantee
or an authorized reviewer. The Access Control Center has a reason-required revoke
flow wired to that API. `tests/unit/employee-temporary-permissions-route.test.ts`
passes 7 focused cases. Database-backed enforcement, persisted role grants and
browser workflows remain unverified; see the linked readiness report for the
current full-suite counts and all 76 route rows.
