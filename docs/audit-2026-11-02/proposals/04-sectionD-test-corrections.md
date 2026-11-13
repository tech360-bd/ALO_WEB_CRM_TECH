# Section D — Test failures: corrected diagnosis and proposed repairs

Status: **PROPOSED.** Ten test-file patches + two code patches, all validated.
**CI is not claimed green** (see §6 — the sandbox cannot generate the Prisma client).

---

## 1. Correction to the Phase 0D numbers

The Phase 0D classification ("10 Prisma / 3 DB / 2 test-double / 16 genuine") was produced
from a **22-file subset** chosen for relevance to the audit. The full `vitest` run on this
branch is the authoritative baseline and is larger. Both are stated here; nothing is
withdrawn, but the full-suite number supersedes it as the working figure.

| Measure | Baseline (no patches) | After 13 proposed patches |
|---|---|---|
| Test files | 340 | 340 |
| Tests | 3,528 | 3,528 |
| Passed | 3,469 | **3,490** |
| Failed | **31** | **10** |
| Files that fail to load | **20** | **20** |
| Failed + unloadable attributable to a missing generated Prisma client | — | **all 30** |

Baseline command: `npx vitest run --reporter=json --outputFile=/tmp/baseline.json`
After command: identical, with patches `2001, 3001, 3002, 4101–4110` applied.

## 2. The 31 baseline failures, one row each

Every row was reproduced individually before being classified. "Fixed" means the exact
test now passes on this branch with the named patch applied and nothing else changed.

| # | File | Failing test(s) | Diagnosis | Patch | Result |
|---|---|---|---|---|---|
| 1 | `alo-study-steps.test.ts` | builds a country-specific guide | **Stale assertion** — source title is `Counseling & Profile Assessment`; test expected `Free Counseling & Profile Assessment`. Second cause: contact number is deployment config. | `4104` | fixed |
| 2 | `brand-chrome-partner-footer.test.ts` | has exactly one public footer… | **Stale assertion** — `src/app/dreamframe/page.tsx` is a self-contained microsite with its own `<footer>`; the test pinned "exactly two `<footer>` owners in `src`". | `4101` | fixed |
| 3 | `employee-access-acceptance.test.ts` | webhook upserts identity… | **Stale pointer** — asserted `whatsAppContact.upsert` + `deriveCountryCode` inside the UCC webhook, which deliberately does not duplicate WhatsApp contact handling. Live behaviour is in `src/app/api/whatsapp/webhook/route.ts:364`. | `4102` | fixed |
| 4 | `public-brand-guideline.test.ts` | preserves contact details and social order | **Config** — expected literal `+8801805020101` / `-10`, values that `src/lib/alo-site-info.ts` derives from `NEXT_PUBLIC_ALO_*` and deliberately ships blank. | `4105` | fixed |
| 5 | `ucc-acceptance-steps.test.ts` | (7) unmatched contacts… | **Stale token** — route now uses `resolution.candidates`; test asserted `identity.candidates`. | `4103` | fixed |
| 6 | same | (8) review decisions… | **Stale token** — `CREATE_NEW_ROLES` no longer exists (`CREATE_NEW` is the decision); `authenticateRequest` was replaced by `withAuth`. | `4103` | fixed |
| 7 | same | (16) inbound receivers populate sender/recipient… | **Stale literal** — `senderContact: senderPhone` is now `senderContact: from`; `matchReviewRequired: true` is now computed (`!verifiedStudentId \|\| !documentMedia`). | `4103` | fixed |
| 8 | `whatsapp-employee-communication.test.ts` | official numbers are exactly 20 in range… | **Code + config** — see #12; and the pool needs operator configuration. | `3002` + `4106` | fixed |
| 9 | same | seedOfficialNumberPool remains additive… | same | `3002` + `4106` | fixed |
| 10 | same | routing: explicit number takes precedence | same | `3002` + `4106` | fixed |
| 11 | same | routing: urgent goes to COO 24/7 | same | `3002` + `4106` | fixed |
| 12 | same | routing: defaults to main with fallback flag | same | `3002` + `4106` | fixed |
| 13 | `whatsapp-numbers-route.test.ts` | requires Super Admin for Meta identifiers… | **Code** — authorization ordered after validation (section C). | `3001` | fixed |
| 14 | same | keeps provider state unverified… | **Code + config** — `OFFICIAL_NUMBERS` empty *and* corrupted by #12. | `3002` + `4107` | fixed |
| 15 | same | allows explicit Super Admin pool initialization | same | `3002` + `4107` | fixed |
| 16 | `whatsapp-routing-route.test.ts` | limits assigned-view users… | **Test double** — the file mocked 4 of the 7 names the route imports from the sender registry; the rest were `undefined`, every call threw, and the route's `catch` returned `503` instead of the expected `200`. | `4108` | fixed |
| 17 | same | rejects non-official explicit sender values… | same (`503` vs `400`) | `4108` | fixed |
| 18 | same | labels routing previews as previews… | same | `4108` | fixed |
| 19 | `whatsapp-webhook-handler.test.ts` | re-exports number-pool and AI helpers | **Code + config** — re-exported `MAIN_NUMBER` corrupted by #12. | `3002` + `4109` | fixed |
| 20 | `language-prep-requirements.test.ts` | enforces the named test and course… | **Test double** — the route first asks the language-prep service which tests are currently source-reviewed; under a mocked db that list is empty, the route short-circuits, and the query the test inspects is never issued. | `4110` | fixed |
| 21 | same | uses real related course and university fields… | same | `4110` | fixed |
| 22 | `ai-security-remediation.test.ts` | defaults unknown actions to HIGH risk | **Environment** — `Cannot find module '.prisma/client/default'`. | — | blocked |
| 23–24 | `business-hours-policy.test.ts` | persisted-policy status (2) | **Environment** — same error. | — | blocked |
| 25–31 | AI Command Center schema-mutation suite | 7 tests | **Environment** — same error. | — | blocked |

**Cause tally of the 21 repaired tests**

| Cause | Tests | Patches |
|---|---|---|
| Product code defect: `toBdDisplayPhone` country-code slice | 8 (rows 8–12, 14, 15, 19) | `3002` |
| Product code defect: authorization after validation | 1 (row 13) | `3001` |
| Stale assertion / stale token in the test | 6 (rows 1, 2, 3, 5, 6, 7) | `4101`–`4104` |
| Test double incomplete (partial module mock) | 5 (rows 16–18, 20, 21) | `4108`, `4110` |
| Deployment configuration absent from the test environment | overlaps the above | `4105`–`4109` |

## 3. Code defect #1 — the country-code slice (not a test problem)

`src/lib/whatsapp-number-pool.ts`

```diff
-  return normalized ? `0${normalized.slice(2)}` : '';
+  return normalized ? `0${normalized.slice(3)}` : '';
```

`normalizeBdPhone()` returns E.164 **without** `+`, i.e. `880` + 10 subscriber digits.
`slice(2)` left the `0` of `01…`, so `01805020100` round-tripped to **`001805020100`**.

Impact in any deployment that configures numbers:

* `MAIN_NUMBER`, `COO_NUMBER`, `EMPLOYEE_POOL`, `OFFICIAL_NUMBERS` are all derived through
  this function → every configured sender is stored and compared in a corrupted form;
* `seedOfficialNumberPool()` would persist corrupted `phoneNumber` rows;
* `POST /api/whatsapp/numbers` validates input through the same function, so it compared a
  corrupted input against corrupted configuration — which is why the tests could not tell
  the difference until an assertion pinned the literal value;
* inbound-message routing to the configured sender cannot match.

This is the highest-value finding in section D: it is a real production defect that was
masquerading as "configuration noise" in the earlier classification.

## 4. Code defect #2 — authorization ordered after validation

Section C, patch `3001`. One test, but the finding is about an information oracle rather
than the test.

## 5. CONFIG failures — the proposed convention

Numbers, contact details and social handles are **deployment configuration**; `src/lib`
deliberately ships them blank (`whatsapp-number-pool.ts` even forbids putting numbers in
source). A test that asserts a literal therefore tests the environment, not the code.

Proposed convention (implemented in the patches, per file):

```ts
// Declare the deployment this test assumes, before the module under test reads env.
vi.hoisted(() => {
  process.env.ALO_MAIN_WHATSAPP_NUMBER = '01805020100';
  process.env.ALO_COO_WHATSAPP_NUMBER = '01805020101';
  process.env.ALO_EMPLOYEE_WHATSAPP_NUMBERS = Array.from(
    { length: 18 },
    (_, index) => `0${1805020102 + index}`,
  ).join(',');
});
```

* Scoped to the file, so a test that asserts the *unconfigured* contract is unaffected.
* Mirrors the operator's documented pool (main `…100`, COO `…101`, employees `…102–…119`),
  so the assertion and the deployment describe the same thing.
* **Owner decision needed:** whether these fixture numbers may live in `tests/` at all,
  given the "no numbers in source" rule in `src/lib/whatsapp-number-pool.ts`. The
  alternative — a `vitest` `setupFiles` entry — moves the same literals into a config file
  and makes every test inherit them, which is worse for the tests that assert blanks. This
  proposal takes the per-file approach and flags the policy question rather than deciding it.

## 6. Environment blocker — do not read the remaining 30 as code failures

```
npx prisma generate
Error: request to https://binaries.prisma.sh/all_commits/c2990dca…/schema-engine.sha256
       failed, reason: Client network socket disconnected before secure TLS connection
       was established
```

`node_modules/.prisma` does not exist and `node_modules/@prisma/engines` ships no binary.
This sandbox can reach `github.com`, `codeload.github.com`, `api.github.com`,
`registry.npmjs.org`, `pypi.org` and `files.pythonhosted.org` — not `binaries.prisma.sh`.

Consequence: **20 test files cannot be loaded and 10 individual tests fail solely because
`@prisma/client` was never generated here.** All 30 report the identical error
`Cannot find module '.prisma/client/default'` (verified programmatically across the JSON
report). They are recorded as *unverifiable in this environment*, not as defects, and no
patch is proposed for them.

Therefore:

* **CI is not claimed green.** After the 13 patches, 3,490 of 3,528 tests pass and every
  remaining failure is the Prisma-client artifact above — but that is not the same as a
  full required-check run.
* The production claim can only be made in an environment where `prisma generate`
  succeeds: re-run `npx vitest run` there and expect 10 failures to disappear without
  further code changes. If any survive, they are new information.

## 7. New finding not fixed in this phase (needs its own approval)

**`WhatsAppContact.countryCode` is never written.** The model declares
`countryCode String @default("")` with `@@index([countryCode])`, and the spec names the
identity triple `phone_normalized, country_code, external_contact_id`. The live inbound
handler writes `normalizedPhone` and `externalContactId` (`src/app/api/whatsapp/webhook/route.ts:364`)
but never `countryCode` — the column is permanently `''` and its index is dead.
`deriveCountryCode()` exists (`src/lib/access-control/object-scope.ts:76`) and is only
exercised by the self-audit route.

Proposed, **not applied**: add `countryCode: deriveCountryCode(normalizedFrom)` to the
upsert's `create`/`update` in the inbound handler. It is a write-path change to production
messaging data, so it needs its own approval and a backfill plan for existing rows (a
backfill is a write and therefore also needs a section F record). Recommended sequencing:
ship the code change behind the existing deployment, backfill later, do not block section D
on it.

The earlier Phase 0D note that the `employee-access-acceptance` assertion merely "pointed
at the wrong file" is **correct but incomplete**: the pointer was stale *and* the field is
genuinely missing. The corrected test asserts the real contract (upsert keyed on
`normalizedPhone`, `externalContactId`, decisions in the matcher) and does not paper over
the gap.

## 8. How to review this section

```bash
cd /home/user/ALO_WEB_CRM_TECH
for p in docs/audit-2026-11-02/proposals/patches/*.patch; do git apply --check "$p"; done
# apply the 13 test/code patches, run the full suite
for p in 2001-offline-copy 3001-whatsapp-authz-before-validation 3002-whatsapp-display-phone-slice \
         4101-brand-chrome-footer-owners 4102-employee-access-identity-owner 4103-ucc-acceptance-token-drift \
         4104-alo-study-steps-title-and-config 4105-public-brand-config-fixture \
         4106-employee-communication-config-fixture 4107-whatsapp-numbers-config-fixture \
         4108-whatsapp-routing-mock-surface 4109-webhook-handler-config-fixture 4110-language-prep-service-double; do
  git apply "docs/audit-2026-11-02/proposals/patches/$p.patch"
done
npx vitest run            # 3,490 passed / 10 failed (all Prisma-client)
git checkout -- src tests # restore the review baseline
```
