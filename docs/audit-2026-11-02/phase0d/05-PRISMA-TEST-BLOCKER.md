# Phase 0D · 05 — Prisma Test Blocker Analysis & Remediation

**Evidence:** `test-blocker-analysis.csv` (per-failure classification), `test-blocker-summary.json`
**Method:** one run of the 22 named files with `--reporter=json`, then every failure classified
individually from its own error message. Nothing was blanket-labelled infrastructure.
**No assertion was weakened, skipped or deleted. No security control was bypassed.**

---

## 1. Raw result

```
Files:   22        Tests: 173        Passed: 142        Failed: 31
```

Nine of the 22 files fail to **load at all**, so their tests never run and do not appear in the 31.

## 2. Classification of the 31 failed assertions

| Class | Tests | Evidence used to decide |
|---|---:|---|
| `BLOCKED_PRISMA_CLIENT` | **10** | message is literally `Cannot find module '.prisma/client/default'` |
| `ENVIRONMENT_NO_DATABASE` | 3 | handler caught a DB error and returned `503`, while the test expected 200 |
| `ENVIRONMENT_TEST_DOUBLE` | 2 | the test's own DB mock was never called (`mock.calls[0]` undefined) |
| **`GENUINE_FAILURE`** | **16** | an assertion about product behaviour that the environment does not explain |

Plus **9 file-level collection failures**, all `BLOCKED_PRISMA_CLIENT` (0/10, 0/1 … never started).

**So the honest statement is: 10 of 31 (32%) are provably Prisma-blocked; 16 (52%) are genuine failures
that must be triaged.** The Phase 0A claim that all 31 were "pre-existing code failures" was wrong in one
direction; the Phase 0C claim that they were merely unmeasured was wrong in the other. Both are replaced
by the per-test table.

## 3. The 16 genuine failures, with their own causes

| File | Test | First error | Reading |
|---|---|---|---|
| `alo-study-steps` | country guide content | expected guide to contain `Step 1: Free Counseling…` | generated guide content differs from the contract |
| `brand-chrome-partner-footer` | one public + one portal footer | file list includes `src/app/dreamframe/page.tsx` | a third consumer of footer chrome appeared; test list stale **or** duplicate chrome |
| `employee-access-acceptance` | webhook upserts identity | source text lacks `whatsAppContact.upsert` | source-contract test; implementation refactored |
| `public-brand-guideline` | contact details | `expected '' to be '+8801805020101'` | a phone constant now resolves empty (the number *does* exist elsewhere, e.g. `website/lead`, `MasterCountryDestinationView`) |
| `ucc-acceptance-steps` ×3 | (7) identity.candidates, (8) CREATE_NEW_ROLES, (16) senderContact | source-grep assertions fail | implementation moved; contract tests need updating or a real regression |
| `whatsapp-employee-communication` ×5 | pool length 20, seed additive, routing precedence, urgent→COO, default fallback | `[]` length 0; `''`; `no_configured_sender` | number pool is empty in this environment; routing falls back to `no_configured_sender` |
| `whatsapp-numbers-route` ×2 | Meta identifier requires Super Admin; state stays unverified | `400` where `403`/`200` expected | **authorisation-after-validation** (report 04 §5b) |
| `whatsapp-numbers-route` ×1 | explicit pool initialisation | `created: 0` vs `20` | pool seeding depends on a DB |
| `whatsapp-webhook-handler` | re-exports number-pool helper | `''` vs `'01805020100'` | number pool empty |

Two of these are security-relevant rather than cosmetic: the `whatsapp-numbers` 400-vs-403 ordering, and
the empty official-number pool (20 numbers expected, 0 configured) which is a *production configuration*
question, not a code question.

**Not claimed:** that these 16 are pure test debt. Several (empty number pool, empty phone constant) look
like real defects. They stay `GENUINE_FAILURE` until triaged on a machine with a database.

## 4. Why the Prisma client cannot be generated here

```
$ npx prisma generate
Error: request to https://binaries.prisma.sh/all_commits/c2990dca…/schema-engine.gz.sha256 failed,
reason: Client network socket disconnected before secure TLS connection was established
```

The audit sandbox can reach `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`,
`pypi.org`, `files.pythonhosted.org` — **not `binaries.prisma.sh`**, where Prisma downloads its engines.
This is an environment boundary, not a repository defect. `schema.prisma` (618 models) is present and
parses; only the generated client is missing.

## 5. Reproducible remediation options

### Option A — generate in CI or on any networked machine (recommended)

```bash
npm ci
npx prisma generate            # needs binaries.prisma.sh
npx vitest run tests/unit --reporter=verbose
```

Expected outcome: the 9 collection failures and 10 assertion failures either disappear (proving they were
environmental) or reproduce with real assertion messages (proving they are code). Either result is
useful; both replace a guess with a measurement.

### Option B — vendor the engines for a hermetic run

Run `npx prisma generate` once on a networked machine, then archive `node_modules/.prisma/` and
`node_modules/@prisma/engines/` as a build cache keyed by the Prisma version and `schema.prisma` hash.
Restore it in the offline environment. **Caveat:** this is a CI artefact, not a repository change, and it
must be verified to match the schema hash or it will silently test the wrong client.

### Option C — decouple these tests from Prisma

9 files fail at *import* time because the module under test imports `@/lib/db`. Splitting the pure logic
from the DB access (or injecting the client) would let them run without a generated client. Correct, but
it is an application refactor and is **not authorised** in this phase.

### Option D — mark them skipped

**Rejected.** Skipping would make the gate green while hiding both an environment gap and 16 genuine
failures. It is exactly the "weaken the gate to pass it" move the instruction forbids.

## 6. What the gate can and cannot be said to be

| Claim | Status |
|---|---|
| "31 tests fail because of code defects" | **Not established** — 13 of 31 are environment-attributable with evidence |
| "All 31 failures are infrastructure" | **False** — 16 are genuine and listed above |
| "The test gate is green" | **False** — 142/173 |
| "The Prisma-dependent subset is `BLOCKED — PRISMA CLIENT GENERATION`" | **True where proven:** 10 assertions + 9 file-loads |
| "CI would be green after `prisma generate`" | **Unknown** — 16 failures are independent of Prisma |

## 7. Recommended release-gate wording

> The unit suite reports 142 passed / 31 failed in the audit environment. 10 failures and 9 unloadable
> files are blocked on Prisma client generation (`binaries.prisma.sh` unreachable). 16 failures are
> genuine and unclassified as infrastructure; they are triaged in
> `phase0d/test-blocker-analysis.csv` and must be resolved or explicitly accepted before the test gate
> can be used as release evidence.
