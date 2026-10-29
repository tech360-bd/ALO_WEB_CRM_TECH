# Verified University Catalogue & 13-Month Coverage (Jan 2027 → Jan 2028)

This document describes the data pipeline added on 2026-10-29. It complements —
and does not replace — the existing university monitoring engine, approval
workflow and CRM schema.

## 1. What problem it solves

The previous delivery shipped a monthly UI, parser fixes and tests, but the CRM
contained no course-month record that could be traced to an official page, and
nothing enforced the rule *“never copy a 2026 fee, deadline or intake into 2027
or 2028 without official evidence”*. This pipeline makes that rule executable:

| Layer | Guarantee |
| --- | --- |
| Dataset | Every fact is a short verbatim excerpt from an official HTTPS page, with collection timestamp and publisher. |
| Validation | `src/lib/verified-catalogue/validation.ts` rejects: non-HTTPS or off-domain sources, unsupported statuses, missing evidence, duplicate course-months, fees whose academic year does not cover the month, and deadlines that contradict each other. |
| Ingest | `ingest.ts` writes immutable evidence rows (SHA-256 over the normalised excerpt) plus **PENDING** course-month rows and Super Admin approval-queue items. Nothing is published here. |
| Approval | `publish.ts` re-resolves the actor from the database (RBAC), copies approved rows into `CrmCourseIntakeFee` / `CrmCourseRequirement`, and publishes courses only when at least one month is `VERIFIED_AVAILABLE`. |
| History | `CrmCoverageRevision` is append-only: created / updated / conflict / approved / rejected events are never deleted. An approved value is never overwritten — a conflict revision and a `CONFLICT` queue item are created instead. |
| Monitoring | `monitoring.ts` enforces a 7-day re-verification SLA on every published course-month and turns stale rows into durable, idempotent research-queue work items (`queueKey = recheck:<coverageKey>`). |

## 2. Status taxonomy

| Status | Meaning | What it is *not* |
| --- | --- | --- |
| `VERIFIED_AVAILABLE` | An official page states the intake exists (evidence required). | — |
| `VERIFIED_NOT_OFFERED` | The official availability table enumerates the programme’s intakes and the month is absent. | Not an inference from silence. |
| `NOT_PUBLISHED` | The page was read and does not state availability for that month. | **Not** proof of absence. |
| `VERIFICATION_PENDING` | Research queued; page not yet read. | — |
| `SOURCE_UNAVAILABLE` | The official source could not be retrieved. | Not a negative finding. |
| `CONFLICT_REQUIRES_REVIEW` | Two official sources disagree. | Requires a human decision. |

## 3. Database changes (additive only)

New MySQL migration:
`prisma/migrations/20261029120000_verified_catalogue_monthly_coverage/migration.sql`

| Model | Purpose |
| --- | --- |
| `CrmOfficialEvidence` | Immutable evidence: URL, final URL, publisher, page title, retrieval/publication dates, HTTP status, SHA-256 content hash, verbatim excerpt, field scope, confidence, version. |
| `CrmCourseMonthlyCoverage` | One row per course-month (13 per course): status, intake name, start date, application open/close, international deadline, fee (+currency, academic year, period, category), application fee, deposit, scholarships, academic requirements, Bangladesh-specific requirements, English tests JSON, work experience, portfolio, interview, documents, eligibility, campus, study mode, four source URLs, collection/verification dates, approval status, publication flag, evidence link, confidence, conflict note, reviewer. |
| `CrmCoverageRevision` | Append-only revision log with previous/new JSON values and actor. |
| `CrmCatalogueTraversal` | Per-catalogue traversal checkpoints: pages/links observed, courses discovered/verified, pagination completeness, next page URL, completeness state. |
| `CrmResearchQueueItem` | Outstanding university-by-university research queue with priority, status, attempts and next action. |

No existing table, column or index is altered; `prisma migrate diff` output
contains only `CREATE TABLE` and foreign-key `ALTER TABLE ... ADD CONSTRAINT`.

## 4. Commands

```bash
# validate the research dataset (no DB, CI-safe)
npm run verified:validate

# stage into the CRM (dry run first), then apply
npm run verified:ingest:dry
npm run verified:ingest

# Super Admin decision (RBAC enforced against the database)
npm run verified:decide -- --actor <portalUserId> --approve-all
npm run verified:decide -- --actor <portalUserId> --reject 2027-09:manchester-msc-accounting --reason "superseded fee"

# 13-month matrix from published rows only
npm run verified:report

# 7-day coverage SLA check (dry run / apply)
npm run verified:coverage-monitor
npm run verified:coverage-monitor -- --apply

# full end-to-end proof against a real database
npm run verified:e2e
```

API surface:

* `GET /api/university-catalogue/coverage` — Super Admin matrix + monitoring report.
* `GET /api/university-catalogue/coverage?published=1` — published rows only (safe for public surfaces).
* `POST /api/university-catalogue/coverage/decide` — `{ action: 'APPROVE' | 'REJECT', coverageKeys?, reason? }`.
* `POST|GET /api/cron/university-monitoring` — unchanged 7-day scheduler; now also runs the coverage SLA pass and returns a `coverage` block.

## 5. Offline / sandbox execution

`prisma generate` normally downloads engines from `binaries.prisma.sh`, which is
blocked in this sandbox. If the repository already contains cached engines
(`imports/alo-education-full/node_modules/@prisma/engines/`), point Prisma at
them:

```bash
export PRISMA_QUERY_ENGINE_LIBRARY="$PWD/imports/alo-education-full/node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node"
export PRISMA_SCHEMA_ENGINE_BINARY="$PWD/imports/alo-education-full/node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x"
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

SQLite sandbox (no MySQL server):

```bash
node scripts/dev-sqlite/generate-dev-schema.mjs           # adds engineType="client"
npx prisma generate --config prisma/dev-sqlite.config.ts
node scripts/dev-sqlite/patch-wasm-loader.mjs
DATABASE_URL="file:$PWD/prisma/dev.db" npx prisma db push --config prisma/dev-sqlite.config.ts --skip-generate
ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/prisma/dev.db" npx tsx scripts/verified-catalogue/e2e-verify.ts
```

Afterwards re-run `npx prisma generate` (default config) so the production
MySQL client is the one on disk.

## 6. Data provenance policy

1. Only official institutional, government, authority or test-provider pages are
   accepted; aggregator sites are never evidence.
2. Excerpts are whitespace-normalised but otherwise verbatim and in source order
   (table cell separators collapse to single spaces). The SHA-256 of the stored
   excerpt is persisted so later edits are detectable.
3. A page is not "verified" because it loaded — it is verified because it states
   the specific fact recorded against it.
4. Absence of publication is recorded as `NOT_PUBLISHED`, never as
   `VERIFIED_NOT_OFFERED` unless the programme publishes an explicit intake
   enumeration.
5. Fees carry the academic year they were published for; the validator blocks any
   fee whose academic year does not cover the course-month.

## 7. Known limitations of this cycle

* Course-level verification was completed for **eight programmes at ten
  institutions in nine countries** (UK, Canada, Australia, Ireland, Japan,
  Germany, New Zealand, Denmark, South Korea).
* Three of the twelve supported countries still have **no course-level record**:
  the USA, the UAE and Malaysia. Their verified progress and exact blockers are
  recorded in `researchQueue` (e.g. ASU does not publish a 2027/28 international
  tuition figure or term start on the pages read; AUS publishes Fall 2027
  application periods but no semester start date; the UM admission host failed
  to load, and aggregator figures are not acceptable as evidence).
* Remaining countries and universities are listed in
  `data/verified-2027/dataset.json → researchQueue` and in the CRM table
  `CrmResearchQueueItem`; they are reported as outstanding coverage, never as
  verified data.
* Live production MySQL was not reachable from this environment; all pipeline
  and approval behaviour is proven against a real SQLite database through the
  repository's existing libsql/WASM driver adapter.
