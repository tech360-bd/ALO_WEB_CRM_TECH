# Schema and migration reconciliation

**Status: BLOCKED. Applied production history: NOT VERIFIED.** No database connection or INFORMATION_SCHEMA result was obtained. App health reports database authentication failure; that is not a schema/migration diagnosis.

## Repository inventory

- 479 Prisma models, 7,117 scalar fields and 11 historical migrations inventoried from exact commit 9e504ad2.
- `schema-matrix.csv` has the requested **MODEL | REPOSITORY | MIGRATION | PRODUCTION | STATUS | RISK** columns, one row per model. Every production cell is explicitly NOT VERIFIED.
- `repository-schema-inventory.jsonl` preserves mapped physical table/column names, scalar/native type declarations, nullability, id/unique/index declarations and relation definitions. Unspecified native types are marked provider-default, not guessed. `defaultDeclared` records presence only; inspect original schema for default expression. This lexical inventory is not a generated DDL diff or a production introspection.
- `migration-checksums.json` lists original-byte SHA-256 values, migration-name timestamps and CREATE/ALTER object references. Directory timestamps are not applied timestamps.
- `docs/MIGRATION_DEPENDENCIES.json` contains the prior detailed chronological dependency graph. Historical SQL was not changed.

## Verified repository discrepancies, not assertions about production

1. `20250915000000_hrms_enterprise` ALTERs EmployeeHR before its CREATE in `20260913050000_benchmark_capabilities`. EmployeeHRProfile is a separate, used model; renaming one into the other is not a fix.
2. Payroll migration adds empty employeeId/period defaults then indexes them uniquely. Historical rows may collide. Production duplicate count and index existence are unknown; no reviewed backfill mapping exists.
3. Exact physical-name scanning finds 95 schema models without an exact-table CREATE in the historical SQL. Of these, 19 have CREATEs using the model name rather than the @@map physical name. Examples: AuditLog maps to audit_logs but historical SQL creates AuditLog; B2bApplication maps to b2b_applications but SQL creates B2bApplication. These are repository-name discrepancies, **not 95 proven missing production tables**. Case-folding does not itself reconcile snake_case changes. CREATE scanning alone is not a full SQL execution simulation.
4. LongText targets for journal/audit payloads were added in the branch; widening remains an unexecuted review candidate outside automatic migrations. Existing column types/collations/indexes are unknown. AuditLog already has @db.Text and maps to audit_logs; do not use its Prisma model name as a presumed physical table.
5. Financial/status fields inspected are Strings and comments, not Prisma enums enforcing a transition graph. Actual DB column enums, check constraints and persisted state distributions remain unknown.

## Requested comparison dimensions

| Dimension | Repository evidence | Production evidence | Status / effect |
|---|---|---|---|
| Tables missing/unexpected | Model-to-physical mappings + SQL CREATEs | None | NOT VERIFIED; no live mismatch count possible |
| Columns missing/unexpected | 7,117 scalar field inventory | None | NOT VERIFIED |
| Types/nullability/defaults | Schema declarations; provider-default types need engine-compatible DDL | None | NOT VERIFIED; no ALTER approved |
| Indexes/uniques | Field and model declarations; migration index text | None | NOT VERIFIED; concurrent/idempotency protections cannot be assumed installed |
| Foreign keys/cascade rules | Relation attrs + migration SQL | None | NOT VERIFIED; inspect orphan data and retention before change |
| Status/enum/check mismatches | Source allowed values and plain Strings | None | NOT VERIFIED; invalid live values cannot be identified |
| Financial/payroll duplicates | Query plan and known overlapping representations | None | NOT VERIFIED; no automatic deletion/backfill |
| Migration application/checksums | Local 11 hashes only | None | NOT VERIFIED; not classifiable as fully applied/partial/legacy/manual/divergent |

## Safest forward strategy (conditional; no migration proposed for execution)

1. Verify active app artifact and database target before modifying any credential or invoking migration tooling. Do not use the publicly exposed login identifier as a database name.
2. Obtain approved read-only metadata/history via READ_ONLY_DISCOVERY.sql. Compare hashes against the exact deployed artifact as well as this branch; record finished/rolled_back/applied_steps_count. Do not export sensitive migration logs.
3. Capture backup+restore evidence and rehearse on a private isolated clone. If migrations differ, distinguish manual DDL, artifact version mismatch and failed partial DDL; do not edit checksums or mark migrations applied without an approved reconciliation.
4. **Fresh empty target:** an explicitly reviewed baseline may be required because an appended migration cannot fix an earlier failed ALTER. Confirm genuinely empty state; preserve historical meaning. No baseline/reset is authorized now.
5. **Existing target:** derive narrowly scoped forward SQL from the real diff. Each object change must specify preconditions, locking/size impact, collation/default compatibility, rollback/restore options and evidence of existing-data safety. Do not generate DROP statements for unexpected objects.

| Candidate / reason | Objects | Expected impact if later validated | Rollback / safety conditions |
|---|---|---|---|
| Payload capacity to avoid short-column audit failures | CrmAuditLog beforeData/afterData; PortalAuditLog metadata; AgentAuditLog metadata/before/after; EmployeeAuditLog oldValue/newValue | Widen to LongText; DDL can lock/rebuild, engine/default/index dependent | Do not narrow back after long values exist. App rollback can retain wider columns. Backup+clone rehearsal required; current candidate is MySQL >=8.0.13 only, not MariaDB-approved |
| Payroll identity/backfill/index | EmployeePayroll, child items, HrmPayrollRun; related unique keys | Row-specific approved mapping and new uniqueness only after duplicate resolution | No automatic survivor/delete; preserve amounts/status/child links; independently validate totals. Impact/safe-existing-data verdict unknown |
| HR/name-mapping reconciliation | EmployeeHR, EmployeeHRProfile, AuditLog/audit_logs, other mapped pairs | Unknown until actual object inventory and data ownership known | Never merge/drop/rename by filename inference; all live-data safety judgments pending |

Do not run historical candidate SQL, prisma migrate deploy, resolve, reset, or db push to diagnose the current authentication failure. Restoring connectivity is a separate reviewed infrastructure/security change, not automatic migration approval.
