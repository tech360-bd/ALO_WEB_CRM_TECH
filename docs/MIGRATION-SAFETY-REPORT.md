# Migration safety review — 2026-10-01

> **UPDATE (2026-10-01, re-baseline):** the migration chain was REPLACED today.
> A column-level simulation of the legacy chain proved it could never be applied
> to a fresh database: its first migration ALTERed tables before creation, it
> contained 13 duplicate `ADD COLUMN` statements, and 76 schema models / 404
> scalar columns had no `CREATE` in any migration. The legacy chain is preserved
> verbatim in `prisma/legacy-migrations-20261001/` (forensic history, never
> executed). The active chain is now:
>
> | Migration | Content | Generated |
> |---|---|---|
> | `0_init` | Full 498-model schema (480 CREATE TABLE incl. `@@map` names + implicit m2m) | `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` |
> | `20261001000001_hrm_holiday_baseline` | The 2 reference holiday rows previously seeded by the HRMS migration | hand-carried, idempotent on fresh DBs |
> | `20261001000002_accounting_ledger` | ChartOfAccount, FiscalPeriod, JournalEntry, JournalLine | `prisma migrate diff --from-schema-datamodel <prev> --to-schema-datamodel` |
> | `20261001000003_erp_procurement_assets_models` | Vendor, PurchaseRequest/Line, PurchaseOrder/Line, VendorInvoice, FixedAsset, AssetAssignment, AssetMaintenance, DepreciationEntry, AiModel, AiModelVersion, AiModelEvaluation, AiModelDeployment, AiModelDepartmentAssignment | `prisma migrate diff --from-schema-datamodel <prev> --to-schema-datamodel` |
>
> **Guards now in place**
> * `tests/unit/migration-order.test.ts` statically replays the active chain and
>   fails CI on any ALTER/FOREIGN KEY before table creation, duplicate columns,
>   or drift between the chain and `schema.prisma` scalar fields.
> * The CI `mysql-integration` job applies the chain to a REAL fresh MySQL 8.4
>   service, asserts `migrate status` reports up to date, and runs the
>   authoritative `prisma migrate diff --from-migrations --to-schema-datamodel`
>   check — the build fails if the diff is non-empty.
>
> **Baselining an existing database** (only if one is ever confirmed): take and
>   verify a backup, run `prisma migrate diff --from-url <DATABASE_URL>
>   --to-schema-datamodel prisma/schema.prisma --script` and reconcile any
>   output, then `prisma migrate resolve --applied 0_init` (and
>   `20261001000001_hrm_holiday_baseline` if the holiday rows already exist).
>   NEVER `prisma migrate reset` on a database with data.
>
> The historical review below is retained as evidence of what was found and why
> the re-baseline was necessary.

Status (historical baseline of this report): BLOCKED. Static source review only; no database connection, migration or seed executed. MySQL provider. Applied migration history, engine/version, collation, orphan records and backup restore remain unverified.

## Ordered migration chain (LEGACY — pre re-baseline, preserved in prisma/legacy-migrations-20261001/)

- `20250915000000_hrms_enterprise`: 13 CREATE TABLE; 81 ALTER TABLE statements.
- `20260731000000_init_mysql`: 212 CREATE TABLE; 52 ALTER TABLE statements.
- `20260801000000_course_data_provenance`: 4 CREATE TABLE; 7 ALTER TABLE statements.
- `20260801024630_official_source_checks`: 1 CREATE TABLE; 0 ALTER TABLE statements.
- `20260913000000_content_management`: 8 CREATE TABLE; 0 ALTER TABLE statements.
- `20260913010000_auth_audit_compatibility`: 1 CREATE TABLE; 1 ALTER TABLE statements.
- `20260913020000_crm_communication_compatibility`: 9 CREATE TABLE; 0 ALTER TABLE statements.
- `20260913030000_keyword_and_lead_linkage`: 2 CREATE TABLE; 2 ALTER TABLE statements.
- `20260913040000_content_intelligence_compatibility`: 37 CREATE TABLE; 1 ALTER TABLE statements.
- `20260913050000_benchmark_capabilities`: 116 CREATE TABLE; 34 ALTER TABLE statements.
- `20260928000000_payroll_safety`: 0 CREATE TABLE; 2 ALTER TABLE statements.

## Verified blockers and data risks

- **Fresh install dependency failure:** the first migration alters `EmployeeHR` before initialization. The later init creates `EmployeeHRProfile`, not the required predecessor. Do not rename or mark historical migrations applied blindly. Obtain `_prisma_migrations` and a schema-only export, reconcile on a disposable restored copy, then design an approved baseline/forward repair.
- **Payroll safety migration:** adds `employeeId` and `period` with empty defaults then creates a unique pair. Multiple historical rows can therefore collide even without prior duplicate business payroll periods. Requires verified backfill mapping and backup before applying; it is not safe merely because it is additive.
- **Foreign keys:** CASCADE deletions include Payment → Student, Document → Student, agent task/audit/schedule → AgentDefinition and other relations. Parent deletion can erase financial/audit history; review retention policy and application delete paths. New FK/unique constraints can fail against orphans/duplicates.
- **Column alteration:** benchmark migration changes TimelineEvent.studentId to nullable VARCHAR(191); validate existing lengths, table locks and FK compatibility. No executable DROP, TRUNCATE or DELETE statements were found in migration SQL by the current static scan. This does not establish migration safety.
- MySQL DDL may commit independently; a multi-statement failure can leave a partially applied migration. No automatic retry/resolve is approved.

## Seeds and utilities

- `package.json` exposes `db:reset`, `db:push`, `db:migrate`, `db:deploy`, and defaults `db:seed` to `prisma/seed-complete.ts`. These are operator tools, not deployment steps. Never run reset/push/dev against production.
- `prisma/seed.ts`, `prisma/seed-complete.ts`, and `scripts/seed-alo.ts` require `SEED_SUPER_ADMIN_PASSWORD` but can overwrite an existing portal password and elevate roles. Seed-complete also imports CSV university data. Initial admin provisioning must be explicitly approved and must not be rerun as a deployment action.
- Destructive seed candidates below contain deletion operations; filtered deletes still remove existing records. No seed is approved for production based on its name or log message.

- `prisma/seed-ai-agents.ts:66`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:81`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:82`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:83`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:84`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:85`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:86`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:87`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:88`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:89`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:90`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:91`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:92`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:93`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:94`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:95`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:96`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:97`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:98`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:99`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:100`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:101`: deletion operation; inspect target/filter before any use.
- `prisma/seed-counselor.ts:102`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:117`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:118`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:119`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:120`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:121`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:122`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:123`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:124`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:125`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:126`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:127`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:128`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:129`: deletion operation; inspect target/filter before any use.
- `prisma/seed-employee-access.ts:130`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:151`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:152`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:153`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:154`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:155`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:156`: deletion operation; inspect target/filter before any use.
- `prisma/seed-enterprise-ai.ts:157`: deletion operation; inspect target/filter before any use.
- `prisma/seed-expanded.ts:933`: deletion operation; inspect target/filter before any use.
- `prisma/seed-expanded.ts:936`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:9`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:10`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:11`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:12`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:13`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:14`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:15`: deletion operation; inspect target/filter before any use.
- `prisma/seed-homepage.ts:16`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:11`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:12`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:13`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:14`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:15`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:16`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:17`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:18`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:19`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:20`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:21`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:22`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:23`: deletion operation; inspect target/filter before any use.
- `prisma/seed-hr-appmanager.ts:24`: deletion operation; inspect target/filter before any use.
- `prisma/seed-knowledge.ts:8`: deletion operation; inspect target/filter before any use.
- `prisma/seed-knowledge.ts:9`: deletion operation; inspect target/filter before any use.
- `prisma/seed-knowledge.ts:10`: deletion operation; inspect target/filter before any use.
- `prisma/seed-knowledge.ts:11`: deletion operation; inspect target/filter before any use.
- `prisma/seed-knowledge.ts:12`: deletion operation; inspect target/filter before any use.
- `prisma/seed-knowledge.ts:13`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:8`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:9`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:10`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:11`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:12`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:13`: deletion operation; inspect target/filter before any use.
- `prisma/seed-marketing.ts:14`: deletion operation; inspect target/filter before any use.
- `prisma/seed-massive-universities.ts:272`: deletion operation; inspect target/filter before any use.
- `prisma/seed-massive-universities.ts:274`: deletion operation; inspect target/filter before any use.
- `prisma/seed-massive-universities.ts:275`: deletion operation; inspect target/filter before any use.
- `prisma/seed-mega.ts:900`: deletion operation; inspect target/filter before any use.
- `prisma/seed-mega.ts:901`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:8`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:9`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:10`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:11`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:12`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:13`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:14`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:15`: deletion operation; inspect target/filter before any use.
- `prisma/seed-omnichannel.ts:16`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:13`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:14`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:15`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:16`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:17`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:18`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:19`: deletion operation; inspect target/filter before any use.
- `prisma/seed-partner-portal.ts:20`: deletion operation; inspect target/filter before any use.
- `prisma/seed-public.ts:1386`: deletion operation; inspect target/filter before any use.
- `prisma/seed-public.ts:1387`: deletion operation; inspect target/filter before any use.
- `prisma/seed-public.ts:1388`: deletion operation; inspect target/filter before any use.
- `prisma/seed-public.ts:1389`: deletion operation; inspect target/filter before any use.
- `prisma/seed-services-deep.ts:2476`: deletion operation; inspect target/filter before any use.
- `prisma/seed-services-deep.ts:2529`: deletion operation; inspect target/filter before any use.
- `prisma/seed-services-deep.ts:2584`: deletion operation; inspect target/filter before any use.
- `prisma/seed-services-deep.ts:2614`: deletion operation; inspect target/filter before any use.
- `prisma/seed-ssr.ts:475`: deletion operation; inspect target/filter before any use.
- `prisma/seed-ssr.ts:510`: deletion operation; inspect target/filter before any use.
- `prisma/seed-ssr.ts:533`: deletion operation; inspect target/filter before any use.
- `prisma/seed-university-data.ts:242`: deletion operation; inspect target/filter before any use.
- `prisma/seed-university-data.ts:243`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:108`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:109`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:110`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:111`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:112`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:113`: deletion operation; inspect target/filter before any use.
- `scripts/seed-400-universities.ts:114`: deletion operation; inspect target/filter before any use.
- `scripts/seed-universities.ts:291`: deletion operation; inspect target/filter before any use.
- `scripts/seed-universities.ts:292`: deletion operation; inspect target/filter before any use.
- `scripts/seed-universities.ts:293`: deletion operation; inspect target/filter before any use.
- `scripts/seed-universities.ts:294`: deletion operation; inspect target/filter before any use.
- `scripts/seed-universities.ts:295`: deletion operation; inspect target/filter before any use.
- `scripts/seed-universities.ts:296`: deletion operation; inspect target/filter before any use.
- `scripts/seed-website.ts:12`: deletion operation; inspect target/filter before any use.
- `scripts/seed-website.ts:171`: deletion operation; inspect target/filter before any use.
- `scripts/seed-website.ts:404`: deletion operation; inspect target/filter before any use.
- `scripts/seed-website.ts:581`: deletion operation; inspect target/filter before any use.
- `scripts/seed-website.ts:641`: deletion operation; inspect target/filter before any use.
- `scripts/seed-website.ts:793`: deletion operation; inspect target/filter before any use.
- `scripts/seed_agents.py:208`: deletion operation; inspect target/filter before any use.
- `scripts/seed_agents.py:209`: deletion operation; inspect target/filter before any use.

## Required database handoff

Secure DATABASE_URL outside Git; confirmed MySQL version and privileges; schema and applied-history export; verified restorable backup; disposable staging restore; duplicate/orphan/length analysis; approved initial-admin procedure; staging migration rehearsal and application smoke results. Keep SKIP_MIGRATIONS=true. No production migration has been authorized or run.
