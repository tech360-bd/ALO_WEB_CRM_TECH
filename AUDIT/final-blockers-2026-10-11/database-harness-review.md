# Database harness review — execution remains blocked

Reviewed 2026-10-11, without a database connection. Review covers runner, shared validator, Vitest setup and all five DB suites. No database suite was enabled or run.

| Safeguard | Finding | Evidence |
|---|---|---|
| Explicit TEST_DATABASE_URL required | PASS static + local guard tests | `scripts/run-integration-tests.mjs`, `scripts/lib/test-database-safety.mjs` |
| Validate target before process/import | PASS static + local guard tests | Runner validates before spawn; Vitest setup precedes suite imports |
| Disposable acknowledgment | PASS static + local guard tests | Requires `ALLOW_DISPOSABLE_DATABASE_TESTS=1` |
| Reject unknown/remote/provider/query overrides | PASS within implemented checks | Only loopback MySQL `alo_test_*`, distinct original schema, no query/hash; production-mode/SQLite denial |
| Do not inherit app URL as test target | PASS within implemented checks | Explicit test URL replaces DATABASE_URL only after validation |
| Prove no production access | BLOCKED | No server/grants/environment inventory. Localhost could be a production tunnel; acknowledgment is not proof. Original-schema metadata is an internal runner mechanism, not independent verification |
| Avoid broad unscoped deletion | PASS inspected source | Deletions found in five suites have `where` filters. Removed consultation broad deletes remain removed |
| Run-owned fixture IDs | PARTIAL | Consultation uses UUID run prefix; other suites largely timestamp/run-derived IDs. Monitoring deliberately uses stable production-code scheduler job ID |
| Deterministic cleanup | BLOCKED / incomplete source contract | Several cleanup calls swallow rejection; monitoring changes shared scheduler state and omits complete audit/run cleanup |
| Actual FK/rollback/concurrency/cleanup behavior | BLOCKED | No MySQL or native Prisma engine |

## Specific cleanup findings before execution approval

1. `tests/integration/university-monitoring.test.ts` cleanup at approximately lines137–149 catches and discards deletion failures. Tests call `ensureMonitoringJob()` and mutate the stable `MONITORING_JOB_ID`. Teardown does not restore/remove that job. Tests create AuditLog and VerificationRun rows not comprehensively cleaned in teardown. An AuditLog→User Restrict FK can prevent user removal while the catch hides failure. Confirm against actual migration/FK state; this is a source-level risk, not an observed database failure.
2. `tests/integration/university-monitoring-rbac.test.ts` teardown (approximately lines99–105) discards cleanup errors; `tests/integration/partner-b2b-security.test.ts` does likewise in global and nested teardown. A passed assertion can leave fixtures behind without failing the suite.
3. `tests/integration/content-publication-security.test.ts` teardown filters ContentRelationship.sourceId using slugs, while resource records use generated primary IDs. A test removes one relationship inline, but early failure can leave it. Teardown uses delete for some rows, so partial setup may also prevent later cleanup/disconnect. Inspect exact IDs and deletion order before certifying deterministic cleanup.
4. Consultation cleanup is scoped, but failure at an early delete can skip later cleanup (disconnect is protected by finally). Real failure-injection testing is required before calling this deterministic.

## Required resolution

QA/database owner must approve a throwaway database with no production grants or tunnels first. Before enabling these suites, repair cleanup to track exact created primary IDs, attempt all cleanup actions, surface an aggregate cleanup failure rather than swallow it, and preserve dependent-row deletion order. For the stable scheduler, require a clean suite-owned database or refuse a pre-existing job; do not silently claim someone else's row. Test partial setup and assertion/audit failure cleanup. Verify zero remaining run-owned fixtures afterward on real MySQL.

The existing shell/test URL protections do not authorize running this suite on a reusable shared database. No `DROP`, reset, truncate, migrate, or DB test execution was performed in this review. All63 test declarations have individual **BLOCKED_NOT_EXECUTED** records in `database-test-status.json`.
