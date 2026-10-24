# Main CI repair: interview migrations and employee payslips

Base: `71279773a829e2587cee425835e50d23d5b4a8fd`, which includes the deliberate PR #24 revert. This repair does not undo that revert or remove the interview/AI functionality from PR #27.

## Evidence

- Run 40100755427, quality job 120892226490: secret scan stopped on three unit-test dummy database URLs (`interview-question-api.test.ts:136`, `student-interview-prep-api.test.ts:126,171`). They are fixtures, not demonstrated production credentials. The scanner and its exclusions remain unchanged; fixtures now explicitly say dummy and use `.invalid`.
- Same run, MySQL job 120892226341: migrations applied, but five ALTER statements were real schema drift. Four interview tables lacked declared text/JSON-string defaults; `InterviewQuestion.sourceUrl` was VARCHAR(500) in migration but implicit VARCHAR(191) in Prisma.
- Run 40091152343, integration job 120868150312: own salary and draft-download assertions returned 403 because the disposable test employee had no explicit `h6` permission. The API had also changed from approved payroll to raw salary records, contrary to the approved-payslip contract.
- Current salary page had duplicate `error` state and an undefined `payslipHistory` left across edits. Those defects were masked by earlier CI failures.

## Changes

- Preserve VARCHAR(500) URLs in Prisma. Add migration `20261024220000_interview_column_defaults` to set missing defaults without rewriting/deleting existing rows or editing already-applied migrations. Use the repository's explicit MySQL expression-default representation. No drift-check relaxation.
- Retain explicit own-salary `h6`, active-account and student/partner denial. Serve only the current employee's approved/paid payroll plus approved/paid commissions and bonuses. Do not read raw salary drafts or unrestricted increment records. Preserve the current `data` response and provide the existing `payslips` contract/download with mandatory access audit.
- Update the existing salary page for actual approved payroll fields, remove duplicate/undefined state, preserve loading/error/refresh/summary/breakdown/history, and add the authorized HTML payslip download. Do not invent a payroll currency that is absent from the model.
- Grant only `h6` through real PortalRole/PortalPermission records in the disposable integration fixture and clean up its role. Strengthen unit assertions for approved-only reads, private raw-data withholding, draft/foreign denial, download and audit failure.
- Regenerate environment classification rather than bypassing its stale-manifest check.

## Verification

Local full suite: 3,207 passed, 86 database-dependent skipped. Changed-file ESLint and secret-finding guard tests passed. Prisma client generated. Full secret scan, TypeScript, fresh MySQL migration/drift/integration and production build results must be checked on this PR's final commit; no production deployment or all-platform completion is claimed here.

## Deployment and rollback

After review and passing CI, apply the additive migration with `prisma migrate deploy`, generate the client, build and release through the existing deployment process. No production database was touched during this repair. Revert the reviewed application commit if necessary while retaining records and the additive defaults. Never reset the database or remove historical payroll/audit records to roll back.
