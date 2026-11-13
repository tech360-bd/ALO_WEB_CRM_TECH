# Phase 0D approved decisions — proposed diffs, tests and reports

**Status: PROPOSAL ONLY.** No source file, schema file or migration is modified in this
branch by these artifacts. No database was contacted. Nothing was committed, pushed, merged
or deployed. The eight recovered courses remain unpublished.

Branch: `arena/ececf40c-alo-web-crm-tech` · base `1e30e812` · generated 2026-11-02.

---

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 01 | [`01-sectionA-limited-publication.md`](01-sectionA-limited-publication.md) | separate limited-information pathway: rules, schema, API, UI, rollback, non-goals |
| 02 | [`02-sectionB-offline-copy.md`](02-sectionB-offline-copy.md) | the exact false sync promise and the one-string correction |
| 03 | [`03-sectionC-whatsapp-authorization-order.md`](03-sectionC-whatsapp-authorization-order.md) | authorization moved before validation, with the four required regression cases |
| 04 | [`04-sectionD-test-corrections.md`](04-sectionD-test-corrections.md) | all 31 failures triaged, 21 repaired, 10 environment-blocked, 1 new finding |
| 05 | [`05-sectionE-eligibility-retirement-plan.md`](05-sectionE-eligibility-retirement-plan.md) | consumer census, sequencing, and the anonymous-write finding |
| 06 | [`06-sectionF-approval-record-template.md`](06-sectionF-approval-record-template.md) | the eight attestations and the per-change approval record |
| 07 | [`07-verification-log.md`](07-verification-log.md) | command-by-command evidence, including what is *not* verified |
| — | [`MANIFEST.md`](MANIFEST.md) | sha256 of every artifact in this folder |

## Directory layout

```
proposals/
├── 01..07-*.md              # the reports
├── patches/                 # 15 reviewable diffs, each applies cleanly to the branch head
├── files/                   # new files the patches would introduce
│   ├── limited-publication-policy.ts        -> src/lib/partial-publication/…
│   ├── limited-publication-approval-route.ts-> src/app/api/admin/courses/[id]/limited-publication/route.ts
│   └── LimitedCourseDetail.tsx              -> src/components/website/…
├── sql/                     # 9002 up/down migration, no data
├── tests/                   # 2 new test files, both executed (see 07)
└── MANIFEST.md
```

## The 15 patches

Apply in this order; none conflicts with another (verified by cumulative apply).

| Patch | Kind | Touches | Why |
|---|---|---|---|
| `2001-offline-copy` | copy | `src/app/offline/page.tsx` | removes the offline-sync promise |
| `3001-whatsapp-authz-before-validation` | **code** | `src/app/api/whatsapp/numbers/route.ts` | authorization before validation |
| `3002-whatsapp-display-phone-slice` | **code** | `src/lib/whatsapp-number-pool.ts` | `slice(2)` → `slice(3)`; configured numbers were corrupted to `0018…` |
| `4101`–`4104` | test | 4 stale assertions | footer owners, identity owner, UCC tokens, study-step title |
| `4105`–`4107` | test | deployment config fixtures | contact numbers, 20-number sender pool |
| `4108` | test | `whatsapp-routing-route.test.ts` | partial module mock → route `catch` returned 503 |
| `4109` | test | `whatsapp-webhook-handler.test.ts` | sender-registry re-export needs configuration |
| `4110` | test | `language-prep-requirements.test.ts` | service short-circuit made the inspected query unreachable |
| `9002-prisma-limited-publication-model` | schema | `prisma/schema.prisma` | approval table + relation field, no `CrmCourse` column |
| `9003-course-page-limited-branch` | **code** | `src/app/course/[slug]/page.tsx` | limited branch, only reachable when the existing gate returns nothing |

`9002` and `9003` belong to section A and should **not** be applied before the section A
design is approved and the migration is separately approved (section F).

## What the evidence supports

* 31 → 10 failing tests with 13 patches, and **all 10 remaining failures (plus 20 files that
  cannot load) are `Cannot find module '.prisma/client/default'`** — the sandbox cannot run
  `prisma generate`, so they are unverifiable here, not defects.
* Two genuine product defects were found and fixed: the corrupted display-phone
  normalisation, and authorization ordered after validation on the WhatsApp number route.
* One genuine product gap was found and **deliberately not fixed**: `WhatsAppContact.countryCode`
  is never written (section D §7) — it needs its own approval.
* Section A's policy is proven by 20 passing unit tests, including that Monash (HOLD) and
  the Aston records cannot publish even with a perfect approval row.

## What is explicitly still open

1. **Section A approval** — design plus a signed migration record. Nothing publishes until
   the owner signs; even then the 8 recovered courses stay unpublished in this phase.
2. **Sensitive-field flag** — `LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED = false` stays false
   until fees/deadlines are approved separately.
3. **Fixture numbers in `tests/`** — an owner decision: the repo forbids phone numbers in
   `src/`, and this proposal puts fixture numbers in `tests/` rather than a global setup file
   (section D §5 states both options).
4. **Indexing of limited pages** — proposed `noindex, follow`; flipping it is a separate call.
5. **`countryCode` write path** — propose, backfill, then verify; not in this phase.
6. **Phase 0E gate** — all eight attestations, still mandatory, still unanswered.

## Reproducing the validation

```bash
cd /home/user/ALO_WEB_CRM_TECH
for p in docs/audit-2026-11-02/proposals/patches/*.patch; do git apply --check "$p" || echo "FAIL $p"; done

# 13 test/code patches only (not 9002/9003), then the suite
for p in 2001-offline-copy 3001-whatsapp-authz-before-validation 3002-whatsapp-display-phone-slice \
         4101-brand-chrome-footer-owners 4102-employee-access-identity-owner 4103-ucc-acceptance-token-drift \
         4104-alo-study-steps-title-and-config 4105-public-brand-config-fixture \
         4106-employee-communication-config-fixture 4107-whatsapp-numbers-config-fixture \
         4108-whatsapp-routing-mock-surface 4109-webhook-handler-config-fixture \
         4110-language-prep-service-double; do
  git apply "docs/audit-2026-11-02/proposals/patches/$p.patch"
done
npx vitest run
git checkout -- src tests
```

## Corrections to earlier reports carried into this folder

* The Phase 0D "16 genuine failures" came from a 22-file subset. The full suite baseline is
  **31 failed tests + 20 unloadable files**; section D reconciles the two rather than
  replacing one with the other.
* Two items previously classified as pure configuration ("official numbers are exactly 20",
  "keeps provider state unverified") were partly a **product defect** (`toBdDisplayPhone`).
* `employee-access-acceptance` was not only pointing at the wrong file; the field it
  asserted (`countryCode`) is genuinely never written. Recorded, not papered over.
