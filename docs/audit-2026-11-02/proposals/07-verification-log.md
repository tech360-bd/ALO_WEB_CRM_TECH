# 07 — Verification log

Every claim in this folder is backed by a command whose output was captured on
2026-11-02, on branch `arena/ececf40c-alo-web-crm-tech`, working tree otherwise clean.

---

## 1. Environment limits (read this before interpreting any result)

| Limit | Evidence | Consequence |
|---|---|---|
| Prisma client cannot be generated | `npx prisma generate` → `request to https://binaries.prisma.sh/all_commits/c2990dca…/schema-engine.sha256 failed, reason: Client network socket disconnected` ; `node_modules/.prisma` absent ; `node_modules/@prisma/engines` ships no binary | 20 test files cannot load and 10 tests fail with `Cannot find module '.prisma/client/default'`. These are **not** code findings. |
| No database connection | by instruction | no migration, seed or import was run; no row counts were verified against a live DB |
| Only `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org` reachable | sandbox egress policy | this is why `binaries.prisma.sh` fails |

**CI is not claimed green.** The strongest true statement available from this environment is
in §4.

## 2. Patch validation

All 15 patches were produced from the real source files (edit → `git diff` → `git checkout --`),
so each is a genuine diff against the branch head, not a hand-written approximation.

```
$ for p in docs/audit-2026-11-02/proposals/patches/*.patch; do git apply --check "$p"; done
OK   2001-offline-copy.patch
OK   3001-whatsapp-authz-before-validation.patch
OK   3002-whatsapp-display-phone-slice.patch
OK   4101-brand-chrome-footer-owners.patch
OK   4102-employee-access-identity-owner.patch
OK   4103-ucc-acceptance-token-drift.patch
OK   4104-alo-study-steps-title-and-config.patch
OK   4105-public-brand-config-fixture.patch
OK   4106-employee-communication-config-fixture.patch
OK   4107-whatsapp-numbers-config-fixture.patch
OK   4108-whatsapp-routing-mock-surface.patch
OK   4109-webhook-handler-config-fixture.patch
OK   4110-language-prep-service-double.patch
OK   9002-prisma-limited-publication-model.patch
OK   9003-course-page-limited-branch.patch
```

Cumulative application of all 15 also succeeds (`15 files changed, 338 insertions(+), 25 deletions(-)`),
then the tree was restored with `git checkout -- .`. **No proposed change is left applied.**

## 3. Proposed new tests — proven to fail before, pass after

### 3.1 Section C — authorization order

`tests/whatsapp-numbers-authorization-order.test.ts` was run from `tests/unit/` with only a
copy-in (no `src/` change) so the pre-patch behaviour could be observed.

Before patch `3001`:

```
❯ tests/unit/zz-proposed-whatsapp-authz-order.test.ts (6 tests | 1 failed)
  ✓ denies an unauthorized caller with a well-formed payload before any lookup
  × denies an unauthorized caller with a malformed payload with the same 403, not a 400
      AssertionError: expected 400 to be 403
  ✓ answers 400 for an authorized caller whose payload is invalid
  ✓ answers 400 for an authorized caller using a number absent from the deployment configuration
  ✓ allows an authorized caller with a configured number and audits atomically
  ✓ keeps the explicit pool-initialisation action Super-Admin-only and unchanged
```

After patch `3001`: `6 passed (6)`.

The single pre-patch failure is the oracle itself: an unauthorised caller with a malformed
payload received `400`, i.e. the route told them their payload was malformed *before* it
told them they were forbidden.

### 3.2 Section A — limited publication policy

`tests/limited-publication-policy.test.ts` → 20 tests, run against
`files/limited-publication-policy.ts`:

```
✓ renders exactly the evidenced fields and marks the rest "Not confirmed"
✓ never turns an unset numeric column into a fact
✓ suppresses every money, timing and eligibility claim in this phase
✓ rejects evidence that is not about this exact course
✓ rejects evidence whose institution does not match (the Phase 0D relink defect)
✓ rejects an evidence excerpt with no content hash
✓ rejects evidence that was never verified, and non-https sources
✓ parses fieldScope defensively
✓ publishes nothing without an approval record
✓ publishes nothing while approval is only requested
✓ publishes nothing when the approver was not a Super Admin
✓ publishes nothing when the approval belongs to a different course
✓ publishes nothing for an untimestamped or revoked approval
✓ invalidates an approval whose evidence snapshot changed after sign-off
✓ keeps fully verified records on the existing gate
✓ never publishes synthetic or unreviewed records
✓ never publishes a record that is already public
✓ honours the hard deny list even with a perfect approval and real evidence
✓ honours the deny list for the unpublished Aston records
✓ publishes nothing when there is no course-specific evidence at all
Tests  20 passed (20)
```

One real bug was caught by these tests during authoring: the first version of
`evaluateLimitedPublication` emitted evidence-scope keys instead of output keys, so
`course_title` was unreachable and every field would have rendered "Not confirmed". The
suite failed, the module was corrected, the suite passed. That is recorded here because it
is the strongest available evidence that the tests test something.

## 4. Full suite, before and after

Commands (identical, only the tree differed):

```bash
npx vitest run --reporter=json --outputFile=/tmp/baseline.json   # clean tree
# apply 2001,3001,3002,4101..4110
npx vitest run --reporter=json --outputFile=/tmp/after.json      # patched tree
```

| | Baseline | After 13 patches |
|---|---|---|
| Files | 340 | 340 |
| Tests | 3,528 | 3,528 |
| Passed | 3,469 | **3,490** |
| Failed | 31 | **10** |
| Files that fail to load | 20 | 20 |
| Failures explained by the missing Prisma client | 10 of 31 | **10 of 10** (the same ten) |

The 20 unloadable files were unchanged by design (they need `prisma generate`).

Remaining 10 failures, all identical error:

```
Error: Cannot find module '.prisma/client/default'
  ai-security-remediation.test.ts            (1 test)
  business-hours-policy.test.ts              (2 tests)
  AI Command Center schema-mutation suite    (7 tests)
```

Verified programmatically over the JSON report:

```
files=340 tests=3528 passed=3490 failed=10 loadfail=20
Counter({"Error: Cannot find module '.prisma/clien": 10})
```

and for the 20 unloadable files:

```
=== load-failure messages ===
20 x PRISMA_MISSING
```

## 5. Per-patch runtime evidence

| Patch | File(s) touched | Command | Result |
|---|---|---|---|
| `2001` | `src/app/offline/page.tsx` | `git apply --check` | applies; string replaced verbatim; no logic touched |
| `3001` | `src/app/api/whatsapp/numbers/route.ts` | proposed authz test (6) + existing route test (5) | 6/6 pass; existing file 3/5 → and the 2 remaining were caused by `3002` + config |
| `3002` | `src/lib/whatsapp-number-pool.ts` | `whatsapp-employee-communication` (19) | 14/19 → **19/19** |
| `4101` | `brand-chrome-partner-footer.test.ts` | same file | 16/17 → **17/17** |
| `4102` | `employee-access-acceptance.test.ts` | same file | 20/21 → **21/21** |
| `4103` | `ucc-acceptance-steps.test.ts` | same file | 24/27 → **27/27** |
| `4104` | `alo-study-steps.test.ts` | same file | 2/3 → **3/3** |
| `4105` | `public-brand-guideline.test.ts` | same file | 5/6 → **6/6** |
| `4106` | `whatsapp-employee-communication.test.ts` | same file | 14/19 → **19/19** |
| `4107` | `whatsapp-numbers-route.test.ts` | same file + `3001` + `3002` | 3/5 → **5/5** |
| `4108` | `whatsapp-routing-route.test.ts` | same file | 2/5 → **5/5** |
| `4109` | `whatsapp-webhook-handler.test.ts` | same file + `3002` | 7/8 → **8/8** |
| `4110` | `language-prep-requirements.test.ts` | same file | 2/4 → **4/4** |
| `9002` | `prisma/schema.prisma` | `git apply --check` | applies; schema-only relation + new model; **not** generated (offline) |
| `9003` | `src/app/course/[slug]/page.tsx` | `git apply --check` | applies; existing full-gate path unchanged, limited branch only reachable when the full lookup returns nothing |

Cross-file validation (all 13 test/code patches at once, the ten previously-failing
files plus the two proposed suites):

```
Test Files  12 passed (12)
     Tests  141 passed (141)
```

`apply --check` across all 15 patches from a clean tree: **15/15 OK**. Cumulative apply of
all 15: **15 files changed, 338 insertions(+), 25 deletions(-)**, tree then restored with
`git checkout -- .` so that no proposed change is left applied.

## 6. What is *not* verified

* **Nothing was type-checked.** `tsc`/`next build` cannot run meaningfully without a
  generated Prisma client, and `files/limited-publication-approval-route.ts` and
  `files/LimitedCourseDetail.tsx` reference `db.crmCourseLimitedPublication`, which does
  not exist until `9002` is generated. They are reviewed by reading, not by a compiler —
  state this plainly when asking for approval.
* `src/proxy.ts` was not modified, so no route-visibility change was testable.
* No statement in section E was executed against a live route; the consumer census is
  static (`grep`), as recorded there.
* The 31 baseline failures split cleanly: **21 were addressable and are repaired**, and
  **10 were Prisma-client-blocked before and after** (`ai-security-remediation` 1,
  `business-hours-policy` 2, the AI Command Center suite 7). The patch set moved 21 tests
  from failing to passing and touched nothing in the other 10.
