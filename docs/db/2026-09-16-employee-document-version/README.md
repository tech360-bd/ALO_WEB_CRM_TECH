# EmployeeDocumentVersion — schema drift reconciliation (PROPOSED, not executed)

**Date proposed:** 2026-09-16
**Status:** PROPOSED ONLY — nothing in this folder has been run against any database.
**Blocks:** `prisma validate` P1012 (already fixed in `prisma/schema.prisma` on this branch) and runtime writes from `api/employee/documents`, `api/hrm/agreements`, and HRM employee-access routes.

## Why this exists

`prisma/schema.prisma` failed validation with **P1012**: `EmployeeDocument.versions`
declared a relation to `EmployeeDocumentVersion` with no opposite field. The code
history shows the table was implemented twice with two incompatible shapes:

| | Shape A (deploy-build / `.repair-backup-20260819`) | Shape B (migration `20260913050000_benchmark_capabilities`) |
|---|---|---|
| link to parent | `documentId` VARCHAR NOT NULL (no default) | `employeeDocumentId` VARCHAR NOT NULL |
| version col | `versionNumber` | `version` |
| extra cols | fileHash, reviewerId, reviewNote, effectiveDate, supersededDate | — |
| status default | `'pending'` | `'ACTIVE'` |

Which shape the production DB actually has **cannot be verified from this
sandbox** (no `DATABASE_URL`, no SSH). The precheck script determines it.

### Field semantics (answer to the open schema question)

- **`employeeDocumentId`** — the canonical scalar that references `EmployeeDocument.id`
  (Prisma relation `document EmployeeDocument? @relation(fields: [employeeDocumentId], ...)`).
  Nullable on purpose: agreement-only version rows have no employee document.
- **`documentId`** — legacy alias kept for existing writers/readers. Two producers use it:
  HRM/employee-access routes store `EmployeeDocument.id` here, while
  `api/hrm/agreements` stores `EmployeeAgreement.id` here. `@default("")` keeps both valid.
- **`agreementId`** — the field used for **agreement history**
  (relation to `EmployeeAgreement`).

The schema fix already applied on this branch (smallest correct change, no fields
removed): added `documentId String @default("")`, `employeeDocumentId String?` plus the
two relations and indexes. This folder reconciles the *database* to that schema.

## Files

| File | Purpose |
|---|---|
| `00-precheck.sql` | Read-only. Determines shape A vs B vs union, counts rows, finds dangling `documentId` values. Output must be captured and reviewed first. |
| `01-migration.sql` | Idempotent reconciliation (guarded stored procedure). Adds missing columns/indexes, relaxes NOT NULL only, backfills `employeeDocumentId` from `documentId` **only where it truly references an EmployeeDocument**, copies `versionNumber` → `version` if present. Deletes nothing. |
| `02-rollback.sql` | Best-effort reverse, split by starting shape. Primary rollback is always **restore from the verified backup**. |

## Mandatory gate before execution (owner checklist)

1. [ ] Identify the production database host/name (not available in this sandbox).
2. [ ] `mysqldump --single-transaction` backup taken **and test-restored** into a scratch DB (verify readable; record row counts of `EmployeeDocumentVersion`, `EmployeeDocument`, `EmployeeAgreement`).
3. [ ] Run `00-precheck.sql`, attach output, determine starting shape.
4. [ ] Review `01-migration.sql` against that output; change owner approves.
5. [ ] Schedule a maintenance window; stop writers to the two HRM routes or accept brief write errors (the ALTERs are metadata-only and fast on small tables, but take MDL locks).
6. [ ] Execute `01-migration.sql`; run its built-in POST-RUN VERIFICATION queries.
7. [ ] Run the app's smoke path: `POST /api/employee/documents` (version create) and the agreements archive route; confirm no P20xx errors in PM2 logs.
8. [ ] Keep the backup for ≥ 14 days.

## Explicit non-goals / cautions

- **No FK constraints by default.** The optional block at the bottom of
  `01-migration.sql` may be run only when precheck 4b/5 show zero dangling rows.
  Prisma functions without DB-level FKs, and `deploy/ubuntu/deploy.sh` uses
  `prisma db push --accept-data-loss` — which is itself a standing risk: it can
  silently drop columns the schema no longer declares. Until that deploy script
  is switched to `prisma migrate deploy`, any schema edit is a potential data-loss
  event on production. **Flagged as a deployment blocker in the final report.**
- The `versionNumber` column is never dropped (shape-A rollback relies on it).
- If `02-rollback.sql` Section 1/2 `MODIFY ... NOT NULL` fails, stop and restore
  from backup; do not force it.
