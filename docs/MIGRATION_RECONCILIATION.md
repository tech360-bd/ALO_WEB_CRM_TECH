# Migration and payroll reconciliation — 2026-10-01 continuation

**APPLIED HISTORY UNKNOWN. PRODUCTION DATA VERIFICATION REQUIRED.** No approved database is available. No database query, seed, migration, resolve, reset, or push was executed.

## Dependency graph

`MIGRATION_DEPENDENCIES.json` records each chronological migration timestamp, table creates/alters/drops, ALTER column additions/removals, index definitions, foreign keys, data transformations and dependency edges. CREATE-table column definitions remain in the original SQL (the JSON is a lexical inventory, not a SQL execution proof). `MIGRATION-SAFETY-REPORT.md` lists destructive seeds. No historical migration bytes were changed.

EmployeeHRProfile is created in `20260731000000_init_mysql` and used by CRM HRM, employee dashboard and admin employee APIs. EmployeeHR is a distinct current schema model, created in `20260913050000_benchmark_capabilities`, used by HRM profiles, attendance, leave, documents, counselor self-service and analytics. The first migration `20250915000000_hrms_enterprise` alters EmployeeHR before that CREATE; it cannot be corrected by renaming the model to EmployeeHRProfile. Later CREATEs may also collide with tables introduced by earlier scripts. The inventory reports such duplicate CREATEs, not just missing dependencies.

A forward migration appended to this chain cannot repair an earlier failed ALTER on a fresh database. Nor can changing checksums be called safe without applied-history evidence. The correct next step is the read-only preflight, schema-only export and restored staging rehearsal, not a speculative baseline or manual `migrate resolve`.

## Safe operator plan

1. Confirm target and approved read-only access; inspect engine version, SQL mode, table existence, column types and `_prisma_migrations` checksums. `scripts/preflight/database-readonly.sql` contains SELECT-only sections; run a section only when its referenced columns exist.
2. Obtain backup timestamp, restore evidence and schema-only export. Establish which history is authoritative and whether manual DDL was used.
3. On a disposable restored copy, compare actual schema to both historical SQL and current Prisma schema. Do not delete either HR model.
4. Choose and review either an explicit fresh-install baseline for genuinely empty databases or a forward reconciliation for existing databases. Historical migrations remain immutable until that decision. No approval to mark migrations applied is implied here.
5. Verify payload column capacity before deploying new audit writers. Prisma target now explicitly uses LongText for previously short payload fields. `scripts/preflight/candidates/audit-payload-capacity.mysql8.sql` is **not** in automatic migrations: it is a widening candidate requiring MySQL >=8.0.13 expression-default support, live charset/collation/index checks, backup and rehearsal. Do not execute generic MODIFY against uninspected production columns. Unsupported schema must fail, never truncate audit evidence.
6. Only after reconciliation and explicit approval run controlled `prisma migrate deploy`. Ordinary pushes retain SKIP_MIGRATIONS=true.

## Payroll uniqueness/backfill

Schema `EmployeePayroll` has `@@unique([employeeId, period])`. Per-employee creation uses Employee.id (not universally the human-readable employee code). The admin run API deliberately uses employeeId="" for aggregate runs. HRM payroll instead creates a separate HrmPayrollRun plus per-employee EmployeePayroll rows. These are overlapping representations, not enough evidence for an automatic merge.

The historical payroll migration adds employeeId/period with empty defaults, then unique-indexes them. Two existing rows can collide on ('','') immediately. Actual duplicate count: UNKNOWN. Existing indexes/FKs: UNKNOWN until preflight. No automatic survivor selection is defensible.

Review export per row: id, monthYear, period, status, preparedBy, child item employee identities, amounts and settlement references. Derive period from monthYear only when valid and unambiguous. Distinguish aggregate runs from one-employee rows using children and originating workflow. Do not assign every aggregate to one employee, discard duplicate rows, reset paid status, or infer salary payments from amounts. An operator must approve a row-ID keyed mapping and reconcile duplicates/overlapping obligations; unresolved cases block uniqueness. Rehearse and validate totals/child links before adding an index. Neither production uniqueness nor the complete migration chain is declared safe.
