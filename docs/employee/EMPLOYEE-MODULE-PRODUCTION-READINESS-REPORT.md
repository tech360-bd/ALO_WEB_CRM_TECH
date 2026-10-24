# Employee Module — Production Readiness Evidence Report

**As-of:** 2026-10-24 (local workspace)  
**Overall:** **NOT READY / NOT VERIFIED**. This report records repository evidence and blockers; it does not assert production integration or production readiness.

## Executive status

| Gate | Status | Evidence / blocker |
|---|---|---|
| Employee-focused tests | **PASS (focused subset)** | Latest employee/HR-focused run: 17 files / 131 tests passed, including temporary-permission expiry/revocation safeguards. The earlier narrow suite was 11 files / 47 tests. |
| Full repository tests | **FAIL / BLOCKED** | Latest run after temporary-permission changes: 249 files passed, 14 failed, 2 skipped; 2,804 tests passed, 3 failed, 28 skipped. Twelve suites cannot load the generated Prisma client; the three reported failed tests also resolve to the missing `.prisma/client/default` module. |
| Design-token finding | **PASS (targeted after fix)** | Replaced `bg-slate-900` with `bg-[var(--alo-text)]` in `src/app/admin/import-center/students/page.tsx`; design-token suite passed (17 tests). Student Dashboard behavior was not changed. |
| Prisma schema validation / client generation | **BLOCKED** | Locked Prisma packages are 6.19.3. `npm run db:validate` and `npm run db:generate` both attempted the matching Prisma engine checksum URL and failed before TLS was established. TLS verification was not disabled. Client verification still reports `.prisma/client/default` missing. |
| Typecheck / production build | **BLOCKED / NOT VERIFIED** | Current `npm run typecheck` stops in `db:verify-client` before TypeScript compilation because `.prisma/client/default` is missing. Current `npm run build` fails in `prisma generate` at the same official-engine TLS request before Next.js compilation. |
| Full-repository lint | **PASS** | `npm run lint` completed successfully after the final source edit (exit code 0). |
| Database-backed integration | **BLOCKED / NOT RUN** | `TEST_DATABASE_URL` is not configured; 2 integration suites (28 tests) skipped. No staging/disposable MySQL database was used. No migration or database write was run. |
| Browser/role-dashboard workflows | **NOT VERIFIED** | No authenticated browser workflow was run. EmployeeViewRouter now selects the existing UnifiedEmployeeDashboard; role/designation/branch/country/temporary-permission behavior still needs end-to-end verification. |
| Production verification/deployment | **NOT DONE** | No production DB, provider, deployment, restart, Hostinger setting, DNS, or seed operation was performed. `DEPLOY_ENABLED=false` remains a standing constraint. |

## Exact Prisma evidence

- Schema datasource: MySQL; generator: `prisma-client-js`; generator targets remain as declared in `prisma/schema.prisma`.
- `prisma`, `@prisma/client`, and `@prisma/engines`: **6.19.3** from the repository lockfile.
- Engine commit used by the installed locked engine package: `c2990dca591cba766e3b7ef5d9e8a84796e47ab7`.
- Validation/generation requested `https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine.gz.sha256`; the TLS connection could not be established in this sandbox. No certificate checks were bypassed and no engine artifact was substituted.
- The repository's `prisma/dev-sqlite.config.ts` targets a separate development SQLite schema and libSQL adapter; it is not a valid replacement for generating or validating the production MySQL client. No schema/provider swap was made.

## Work verified in this branch

- Employee Students, Applications, Reports, Tasks, Leads, Salary, Leave, and Performance screens use API-backed data rather than fabricated rows/metrics/success states; unsupported actions are not represented as working capabilities.
- Employee Leads reads/creates scoped CRM lead records and audits; assignment/team lifecycle and note/status mutation remain incomplete.
- Leave handlers enforce active-employee identity, permission and self/branch/company scope, validation, no self-approval, compare-and-set decisions, and transactional audit. Manager decision UI and approved balance accrual/consumption policy remain incomplete.
- Salary reads are self-scoped, minimized and audit-fail-closed; salary document/payslip download is unavailable.
- Performance handlers enforce active status, explicit view/manage permissions, scope, validation, self-review prevention, same-origin writes, compare-and-set update, and transactional audit. Manager review-authoring UI remains absent.
- EmployeeViewRouter selects the existing UnifiedEmployeeDashboard; the Student Dashboard remains outside this employee-module work.
- Temporary permissions now share the request-flow feature allowlist and 30-day maximum; direct grants are restricted to active employees, view-only OWN/ASSIGNED scope, authorized HR review authority, no self-grant, reason, and transactional audit. GET reports effective ACTIVE/SCHEDULED/EXPIRED status based on all three time bounds; DELETE immediately flips both active flags with compare-and-set and transactional audit, allowing the beneficiary to revoke their own grant or an authorized reviewer to revoke another employee's grant. The Access Control Center now provides a reason-required confirmation form wired to that DELETE endpoint. UI copy no longer claims a background auto-revocation job. Seven focused tests cover expiry display, target privacy, broad/long grant denial, safe grant, immediate self-revocation, cross-origin denial and unauthorized third-party revocation. These are unit tests; database-backed expiry, deployed permission grants and browser actions remain unverified.
- New employee permission IDs are in the code catalog/default role mapping, while runtime request permissions are loaded from persisted DB role-permission records. Permission seeding/role grants have not been run or verified in a database; production permission activation is therefore **BLOCKED pending an approved staging/production plan**.

## Employee API route inventory (76 route files)

This is a **static triage inventory**, not a completed manual audit. The method column is parsed from route exports. Permission/scope/audit columns list source-code string/identifier signals only; a signal is not proof that every method enforces the control correctly. A dash means no direct focused test is cited here. `TESTED` applies only to the named unit/static suite and is not production verification. Every row remains subject to route-by-route manual review of authentication, active status, permission, object/field/workflow scope, audit, rate limiting, file/export handling and denial behavior.

| Route | Methods | Auth marker(s) | Permission identifier(s) / static signal | Scope marker(s) | Audit marker(s) | Direct test evidence | Status |
|---|---|---|---|---|---|---|---|
| /api/employee/acting-as | POST, GET, DELETE | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/activate | POST | No common auth marker (manual check required) | No permission ID statically matched; manual check required | No common scope marker; manual check required | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/activity | GET | authenticateRequest | hr_manager | employeeId, userId, where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/applications/[id] | PATCH, GET | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/applications | GET, PUT | withAuth | employee | employeeId, userId, where: | portalAuditLog, auditLog, AuditLog, audit | tests/unit/employee-applications-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/appointments/[id] | PATCH, GET, DELETE | authenticateRequest | No permission ID statically matched; manual check required | where: | audit | — | NOT VERIFIED |
| /api/employee/appointments | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | No common scope marker; manual check required | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/attendance | GET, POST | withAuth | No permission ID statically matched; manual check required | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee/branch-stats | GET | authenticateRequest | No permission ID statically matched; manual check required | employeeId, userId, scope, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/country-stats | GET | authenticateRequest | No permission ID statically matched; manual check required | scope, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/dashboard | GET | authenticateRequest | employee.dashboard.view, employee.dashboard.view_all | employeeId, userId, createdBy, scope, where: | portalAuditLog, auditLog, AuditLog, audit | tests/unit/employee-dashboard-scope.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/documents/[id]/download | GET | authenticateRequest | employee-document | employeeId, userId, where: | audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee/documents/request | POST | authenticateRequest | document_request | employeeId, userId | audit | — | NOT VERIFIED |
| /api/employee/documents | GET, POST, PATCH | authenticateRequest | documentType, employeeId | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee/followups/[id] | PATCH, GET | authenticateRequest | No permission ID statically matched; manual check required | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee/followups | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | employeeId, userId, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/leads | GET, POST | authenticateRequest | employee_direct_contact | employeeId, userId, assignment, createdBy, scope, where: | portalAuditLog, auditLog, AuditLog, audit | tests/unit/employee-leads-scope.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/leave | GET, POST, PATCH, PUT | No common auth marker (manual check required) | No permission ID statically matched; manual check required | scope | audit | tests/unit/employee-leave-route.test.ts (legacy delegate; primary handler tested) | TESTED (limited to cited unit/static suite) |
| /api/employee/messages/[id] | GET, PATCH | authenticateRequest | No permission ID statically matched; manual check required | where: | audit | — | NOT VERIFIED |
| /api/employee/messages | GET, POST, PUT | withAuth | No permission ID statically matched; manual check required | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee/metrics | GET | No common auth marker (manual check required) | No permission ID statically matched; manual check required | scope | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/notifications | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | audit | — | NOT VERIFIED |
| /api/employee/partner-stats | GET | authenticateRequest | No permission ID statically matched; manual check required | where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee/password | POST, GET | withAuth | No permission ID statically matched; manual check required | userId, where: | audit | — | NOT VERIFIED |
| /api/employee/performance | GET, POST, PUT | authenticateRequest | employee.performance.manage, employee.performance.view, employee.performance.view_all, employeeId | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | tests/unit/employee-performance-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/profile | GET, PUT | withAuth | employeeId, permissions | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/reports | GET | withAuth | employee.dashboard.view, employee.dashboard.view_all | employeeId, userId, scope, where: | portalAuditLog, auditLog, AuditLog, audit | tests/unit/employee-reports-scope.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/salary | GET | withAuth | No permission ID statically matched; manual check required | employeeId, userId, where: | portalAuditLog, auditLog, AuditLog, audit | tests/unit/employee-salary-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/salary/view | GET | authenticateRequest | employeeId, salary | employeeId, userId, where: | auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/settings | GET, PUT | withAuth | employeeId, permissions | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/students | GET | withAuth | No permission ID statically matched; manual check required | employeeId, userId, where: | No common audit marker; manual check required | tests/unit/employee-students-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/support-ticket | GET, POST | withAuth | No permission ID statically matched; manual check required | userId, where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee/tasks/[id] | PATCH, GET, DELETE | authenticateRequest | No permission ID statically matched; manual check required | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee/tasks | GET, POST, PUT | authenticateRequest | document_review, employee.tasks.create, employee.tasks.update, employee.tasks.view | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | tests/unit/employee-tasks-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee/visa-cases | GET | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | audit | — | NOT VERIFIED |
| /api/employee/visa-interviews | GET | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/agreement-acceptances | GET, POST | authenticateRequest | employeeId, hr_manager | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/agreements | GET, POST | authenticateRequest | hr_manager, hr_policy, salary_policy | userId, createdBy, where: | audit | — | NOT VERIFIED |
| /api/employee-access/analytics | GET | authenticateRequest | attendance, document_checklist, employee_directory, employee_productivity, hr_manager, payroll | where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee-access/application-workflow | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | userId, createdBy, where: | auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee-access/attendance | GET, POST | authenticateRequest | employeeId, hr_manager | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/audit-logs | GET, POST | authenticateRequest | employeeId | employeeId, userId, where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee-access/branches | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | No common scope marker; manual check required | audit | — | NOT VERIFIED |
| /api/employee-access/break-glass | POST, GET | authenticateRequest | No permission ID statically matched; manual check required | employeeId, userId, scope | audit | — | NOT VERIFIED |
| /api/employee-access/comments | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | userId, createdBy, where: | audit | — | NOT VERIFIED |
| /api/employee-access/departments | GET, POST | authenticateRequest | hr_manager | scope | audit | — | NOT VERIFIED |
| /api/employee-access/devices | GET, POST | authenticateRequest | employeeId, hr_manager | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/document-versions | GET | authenticateRequest | documentId | employeeId, userId, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee-access/documents | GET, POST | authenticateRequest | employeeId | employeeId, userId, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee-access/employee-dashboard | GET | authenticateRequest | attendance, documents, payroll, permission-requests | employeeId, userId, scope, where: | audit | tests/unit/employee-self-service-scope.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee-access/employee-directory | GET | authenticateRequest | hr_manager, salary | employeeId, userId, scope, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee-access/feature-access | GET, POST | authenticateRequest | document, employee, featureKey | employeeId, userId, createdBy, where: | audit | tests/unit/employee-feature-access-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee-access/hr-dashboard | GET | authenticateRequest | employee.hr.dashboard.view, employee.salary.view_all, hr, hr_manager | userId, where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee-access/interview | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | userId, createdBy, where: | audit | tests/unit/employee-access-deep-audit.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/leave | GET, POST, PATCH | authenticateRequest | employee.leave.approve, employee.leave.approve_all, employee.leave.create, employee.leave.view, employee.leave.view_all, employeeId | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | tests/unit/employee-leave-route.test.ts | TESTED (limited to cited unit/static suite) |
| /api/employee-access/leave-balance | GET, POST | authenticateRequest | employeeId, hr_manager | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/login-logs | GET, POST | authenticateRequest | employeeId, hr_manager | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/manager-dashboard | GET | authenticateRequest | No permission ID statically matched; manual check required | employeeId, userId, scope, where: | No common audit marker; manual check required | — | NOT VERIFIED |
| /api/employee-access/notifications | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | portalAuditLog, auditLog, AuditLog, audit | tests/unit/employee-access-deep-audit.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/offer-letters | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | userId, createdBy, where: | auditLog, AuditLog, audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/offices | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | branchId | audit | — | NOT VERIFIED |
| /api/employee-access/payments | GET, POST, PATCH | authenticateRequest | No permission ID statically matched; manual check required | userId, where: | audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/payroll | GET, POST, PATCH | authenticateRequest | employeeId | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee-access/permission-packages | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | No common scope marker; manual check required | audit | — | NOT VERIFIED |
| /api/employee-access/permission-requests | GET, POST, PATCH | authenticateRequest | employee.attendance, employee.audit, employee.devices, employee.documents, employee.fields.bankAccount, employee.fields.nid, employee.fields.passport, employee.fields.salary, employee.leave, employee.payroll, employee.permission_requests.approve, employee.permissions, employee.profile.private, employeeId, featureKey, hr, hr_manager, permission_approval, permission_rejection, permission_request | employeeId, userId, scope, where: | portalAuditLog, writePortalAudit, auditLog, AuditLog, audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/permissions | GET, POST | authenticateRequest | No permission ID statically matched; manual check required | No common scope marker; manual check required | audit | — | NOT VERIFIED |
| /api/employee-access/profile | GET, POST, PATCH | authenticateRequest | employee.lifecycle, employee.profile.private, employeeId, hr_manager, salary | employeeId, userId, where: | writePortalAudit, audit | — | NOT VERIFIED |
| /api/employee-access/quotas | GET, POST | authenticateRequest | employeeId | employeeId, userId, where: | audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/reassignments | GET, POST | authenticateRequest | employeeId | employeeId, userId, assignment, where: | auditLog, AuditLog, audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/secure-download | GET, POST | No common auth marker (manual check required) | No permission ID statically matched; manual check required | No common scope marker; manual check required | No common audit marker; manual check required | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/security-events | GET, POST | authenticateRequest | employeeId | employeeId, userId, where: | audit | — | NOT VERIFIED |
| /api/employee-access/self-audit | GET | authenticateRequest | documents, employeeActivationToken, employeeAgreement, employeeAgreementAcceptance, employeeAuditLog, employeeBreakGlassAccess, employeeDevice, employeeDocumentVersion, employeeLeave, employeeLeaveBalance, employeeLoginLog, employeePayroll, employeePayrollItem, employeePermissionRequest, employeeReassignment, employeeSecurityEvent, employeeTemporaryPermission, featureAccessRule, permissionPackage | assignment, scope | auditLog, AuditLog, audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/service-declaration | GET, POST | withAuth | No permission ID statically matched; manual check required | userId | auditLog, AuditLog, audit | tests/unit/employee-access-deep-audit.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |
| /api/employee-access/super-admin-dashboard | GET | authenticateRequest | No permission ID statically matched; manual check required | scope, where: | portalAuditLog, auditLog, AuditLog, audit | — | NOT VERIFIED |
| /api/employee-access/temporary-permissions | GET, POST, DELETE | authenticateRequest | employee.permission_requests.approve, employee.documents, employee.profile.private, employee.fields.salary, employee.fields.bankAccount, employee.fields.nid, employee.fields.passport, employee.attendance, employee.leave, employee.payroll, employee.devices, employee.permissions, employee.audit | employeeId, userId, scope, where: | writePortalAudit, audit | `tests/unit/employee-temporary-permissions-route.test.ts` (7 tests) | TESTED (focused unit suite) |
| /api/employee-access/workflows | GET, POST | authenticateRequest | document_check | employeeId, userId | auditLog, AuditLog, audit | tests/unit/employee-access-acceptance.test.ts (static contract assertions) | TESTED (limited to cited unit/static suite) |

## Remaining acceptance gates

1. Run Prisma 6.19.3 validation and generation in a trusted environment that can retrieve the exact official engine artifacts with certificate verification enabled; verify the generated model list and runtime engine.
2. Rerun full tests, full lint, typecheck and production build after successful client generation. Investigate any residual failures independently rather than labeling infrastructure blockers as passes.
3. Supply an approved disposable/staging MySQL target, run migration compatibility checks and integration tests there only, with verified backup/rollback plan before any production change. Production migration/seed remains unauthorized.
4. Complete manual review of all 76 endpoints and their HTTP methods, including temporary-permission expiry/revocation, Acting-As attribution/stop behavior, document/download/export access, salary/privacy, leave balances/approvals, manager UIs, team/assignment lead lifecycle, and dashboard scope.
5. Execute authenticated browser checks across representative employee roles/designations/branches/countries, including denied and expired-permission cases. Confirm the Student Dashboard is unchanged.
6. Resolve business decisions before implementation where required: leave accrual/consumption rules and Student ID format conflict (`AE-YYYYNNNN` versus the alternative zero-padded specifications). No speculative policy change has been made.

**No production database/provider/migration/deployment/Hostinger/DNS action was taken.**
