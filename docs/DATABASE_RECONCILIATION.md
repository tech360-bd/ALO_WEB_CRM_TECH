# Database reconciliation — 2026-10-01

**BLOCKED.** Production `/api/health` reported database authentication failure at `2026-09-30T21:42:45.839Z` (2026-10-01 Asia/Dhaka). This is evidence of a connection/configuration/grant problem, **not evidence that migrations will fix it**. No authorized database connection or production SQL execution was available. No data changed.

## Three independent sources of truth

| Source | Evidence | Result |
|---|---|---|
| Repository schema | 479 models / 7,117 scalar fields | Inventoried, not production introspection |
| Repository migrations | 11 files; original-byte SHA-256 retained | Applied history unknown; ordering/duplicate CREATE conflicts remain |
| Production database | Health body only; no metadata/row access | BLOCKED |

Full model/table matrix: [schema-matrix.csv](production-reconciliation/2026-10-01/schema-matrix.csv). Every production cell is NOT VERIFIED. Structured fields/indexes/relations: [schema inventory](production-reconciliation/2026-10-01/repository-schema-inventory.jsonl). Lexical scan found 95 models without an exact physical-table CREATE, including 19 model-name/`@@map` mismatches. These are **not 95 proven missing production tables**.

`EmployeeHR` and `EmployeeHRProfile` are separate models with separate consumers. Do not rename or merge them to satisfy the first migration. `AloPayment`, `Payment`, application finances, test credits/payments and payroll representations are not interchangeable.

## Approved sequence required before any write

1. Operator verifies the actual deployed process, artifact hash, redacted `DATABASE_URL` host/port/database/user mapping, provider account and grants. Keep passwords/tokens out of chat and git. Restart/configuration changes require deployment approval; do not guess credentials or database name from an error's login identifier.
2. Execute only bounded SELECT discovery under authorized access. The existing [discovery SQL](production-reconciliation/2026-10-01/READ_ONLY_DISCOVERY.sql) is a handoff, **not an executed result**. Verify actual table/column names before dependent queries.
3. Obtain schema-only export, `_prisma_migrations` records/checksums, engine version, collation, SQL mode, constraints and orphan/duplicate counts. Distinguish absence from insufficient privileges.
4. Obtain a current backup identifier and successful isolated restore evidence. The user's daily-backup statement is control-plane evidence, not restore verification.
5. Rehearse explicit forward reconciliation on the restored staging copy. Historical migrations stay immutable; no `reset`, destructive push, blind `resolve`, seeds, or automatic duplicate survivor selection.
6. Review row-ID-keyed repair mapping and original/target counts, sums by currency and status, relation sets, audit capacity and rollback. Separate schema DDL from data repair. Apply only after explicit approval.
7. Verify actual constraints, per-owner visible sets, counts, balances, failed-write rollback and complete journeys. Keep `SKIP_MIGRATIONS=true` until an approved migration plan exists.

## Payment identity reconciliation: must precede a canonical-key change

Evidence in current source:
- Student payment list/create keys `AloPayment.studentId` by `PortalStudentProfile.id`.
- Student dashboard uses `PortalStudentProfile.studentId` (human-readable code).
- CRM finance name lookup uses `Student.id`; its create accepts a caller-specified student ID.
- `AloPayment.studentId` has no FK/namespace discriminator. Portal registration creates its profile independently of canonical Student registration.

The local security repair keeps student writes at the **existing profile.id key**, rejects forged target/status, and writes pending record + audit atomically. It does **not** remap old records or claim settlement. Unioning the three keys or switching keys now could expose another person's data or hide old rows. ID-format assumptions, equal names/emails or equal amounts are not enough.

After metadata verification, use the [SELECT-only payment classification handoff](functionality/PAYMENT_IDENTITY_READ_ONLY.sql) to count namespace overlap/orphans and one-to-many user mappings. This SQL uses repository physical names; an operator must reconcile them to production before execution. A matching count is not proof of identity. Aggregate queries may need an off-peak window/read replica for large tables.

Require approved mapping, explained orphan buckets, resolved cross-namespace collisions, and per-owner before/after visible-set comparison: no old row hidden and every added row belongs to that same owner. Partition counts/amounts by **currency**, status and creation window; timestamps suggest provenance but do not prove it. Rehearse deliberate collision cases that fail closed. Do not infer paid/refunded truth from status strings.
