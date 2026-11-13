# Second complete audit — 2026-10-26

Scope: the whole repository for regressions, plus a deeper pass over every file
created or changed since the first audit (`docs/audit/COMPLETE-REPOSITORY-AUDIT-2026-10-25.md`).
Every statement below is backed by a command that was actually run; where a gate
could not be executed in this environment it is reported as **BLOCKED**, never as
passed.

## 1. What was re-checked (and how)

| Area | Method | Result |
|---|---|---|
| Type safety of the new surface | `tsc` shards (routes, UI, SOP) with `--noEmit` | **PASS** — 0 errors |
| Whole-repo type check | `tsc -p tsconfig.json --noEmit` at 3200 MB | **BLOCKED** — V8 OOM (see §5) |
| Lint | `npx eslint src` | **PASS** — 0 errors, 0 warnings |
| Unit + integration tests | `npx vitest run` | **PASS** — 303 files, 3 420 tests passed, 143 skipped, 0 failed |
| PhD service contracts on a real DB | `vitest tests/integration/phd` against SQLite mirror | **PASS** — 49 tests |
| Scheduler certification | `npx tsx scripts/cron-scheduler-policy-check.ts` | **PASS** — 225/225 assertions |
| Prisma schema | `npx prisma validate` | **PASS** — schema valid |
| Verification mirror | `npm run awf:mirror` + `prisma generate` | **PASS** — 603 models (51 PhD) |
| Production build | `next build` | **BLOCKED** — OOM in this sandbox |
| MySQL migrations | `prisma migrate deploy` | **BLOCKED** — no MySQL server |
| Backup / restore drill | `mysqldump` restore into disposable DB | **BLOCKED** — `mysqldump` absent |

## 2. Files and folders

- 51 PhD API routes (`src/app/api/phd/**`), 2 public research routes
  (`src/app/api/research/programmes/**`), 1 cron route
  (`src/app/api/cron/phd-maintenance`).
- 11 student pages under `src/app/student/phd/**` (all `noindex`), 2 public
  research pages under `src/app/research-opportunities/**`.
- 10 workspace panels + shared primitives under `src/components/phd/**`.
- 51 PhD Prisma models across two additive migrations
  (`20261025120000_phd_proposal_builder`, `20261026120000_phd_sop_builder`).
- No empty file, no `TODO`/`FIXME`/`HACK` marker, no `console.log`, no
  placeholder or lorem-ipsum copy in any PhD surface (grep-verified).

## 3. Dead code and duplication removed in this pass

- `SOP_AI_DISCLOSURE_MINIMUM` — an unused template constant. Removed: a template
  disclosure defeats the purpose of a personal statement, and unused code is a
  maintenance liability.
- `OPTIONAL_SOP_SECTIONS` — previously declared and never used; now the single
  source for "which sections may be blank", consumed by the review checks.
- Status labels are now shared between the service vocabulary and the UI, so the
  panel cannot drift from the server's status names.
- `src/lib/phd/proposals/citations.ts` carried an unused `eslint-disable`
  directive; the URL parse is now `void new URL(…)` with an explanatory comment.

## 4. Security review (new surface)

| Check | Evidence |
|---|---|
| Every PhD route resolves the actor server-side | `tests/unit/phd/route-authorization.test.ts` walks all 51 route files and requires `phdRoute`; no route reads a client-supplied `userId`/`role` |
| Public catalogue never exposes a supervisor identity or contact detail | Static assertions on `public-catalogue.ts` + both research routes |
| Student workspace is not indexable | All 11 pages assert `robots: { index: false }` |
| Downloads are private and audited | Document GET resolves ownership then audits; no public URL exists |
| Uploads are bounded and type-checked | 15 MB limit, MIME allow-list, signature re-check in storage layer |
| No secrets in the module | Regex scan for `sk-…`, `AKIA…`, `ghp_…` — no hits |
| No scheduled deletion of student data | Cron handler is report-only; the scheduler policy check asserts no `deleteMany`/`fs.rm` in the PhD handler |
| Rate limits | Enqueue, generate, upload, outreach and commission paths enforce per-actor limits |
| Statement access control | Integration test proves another student receives 404 and that a data verifier cannot open a personal statement |

## 5. Environment blockers (reported, not worked around)

1. **Whole-repo `tsc`** — aborts with `JavaScript heap out of memory` at 3.2 GB
   (container total 3.9 GB). Coverage was obtained by three overlapping shards
   (routes incl. cron, UI incl. pages, SOP library/service) that together include
   every changed file; all three exit 0.
2. **`next build`** — the same memory ceiling. Not run to success, so the
   production bundle is **unverified** in this environment.
3. **MySQL** — no server, no client, no `mysqldump`. Migration apply, seeded-data
   reconciliation and the restore drill are **unverified**; the SQLite verification
   mirror proves the ORM contracts only and is explicitly not MySQL evidence.
4. **StarRocks** — an Apache-2.0 backup tool for StarRocks 3.5+ is reviewed, not
   adopted; a restore test requires a disposable StarRocks cluster that does not
   exist here. "Recoverable" is therefore not claimed.

## 6. Data-honesty audit

- A programme is public only when `verificationStatus = VERIFIED_OFFICIAL`, it has
  an `officialUrl`, and its university's research-degrees page is verified.
- Fees, deadlines, requirements and funding each carry their own status; an
  unverified child row is not shown as if verified.
- Home and international fees remain separate rows with an academic year, currency
  and student category — never merged.
- "Not found" is never rendered as "not offered": the public directory
  distinguishes *catalogue unavailable* (503) from *no verified match* (empty).
- The SOP builder leaves unsupported sections empty and names the missing input.
- No AI-detector score is measured, promised or stored anywhere; a static test
  enforces the wording.

## 7. Outstanding work (explicit)

- Marketing/CRM modules are untouched by this phase; their pre-existing audit items
  remain as recorded in the first audit.
- Course-catalogue import counts (17 581 / 17 653 seeded, 472 verified) are
  unchanged; the import pipeline has not been re-run in this pass.
- `docs/course-catalogue/source-policy.md` rule 1 (no guessed URLs) is consistent
  with the quarantined CSV rows; the earlier suspected fabricated example is not
  present in the current document (verified by reading §4).
