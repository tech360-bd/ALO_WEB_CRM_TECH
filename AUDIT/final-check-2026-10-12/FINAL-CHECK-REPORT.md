# Final Check — 2026-10-12

- **Branch:** `arena/1cf1296a-alo-web-crm-tech` (from `main` @ `e4f26a1`, merge of PR #4)
- **Scope:** post-merge verification of the whole repository; tests, lint, scoped type-check, and merge-damage triage.
- **Starting state:** clean working tree at HEAD. **Nothing pushed; no PR opened. No schema change, migration, seed, dependency change or production access.**

## Headline

| Gate | Before | After |
|---|---|---|
| Unit tests | **1850 passed / 33 failed** (11 failing files) | **1889 passed / 14 failed** (4 failing files) |
| Whole suite (unit + integration) | — | **1911 passed / 14 failed / 35 skipped** |
| ESLint (all changed files) | — | **0 errors, 0 warnings** |
| Scoped `tsc` (all changed files) | — | **0 errors in changed files** (only the 6 documented Prisma-stub errors in `access-scope.ts` / `lead-access.ts` remain repo-wide) |
| Parse-level scan of `src/app` + `src/lib` | — | No remaining syntax errors |
| `prisma generate` → `next build`, MySQL integration, E2E | **BLOCKED** | **BLOCKED** (unchanged; see below) |

All remaining test failures are the documented **missing generated Prisma client** environment block. Every failing test at the start of this check that was NOT in that block is now fixed.

## What the final check found (merge damage in PR #4)

The merge of `arena/01a0f2b5-alo-education-z-ai` combined two sessions' versions of several files. Some files merged cleanly but inconsistently; two were broken outright.

### 1. `src/app/sitemap.ts` — syntax error (build-breaking) — FIXED

`Identifier 'courses' has already been declared` (and `coursesRaw`, `universitiesRaw`, `conflicts` referenced but never defined). `next build` and any import of the sitemap failed to parse. This broke `tests/unit/sitemap-db-runtime.test.ts` and `tests/unit/catalogue-phase1-review-publication.test.ts` (17 tests) at file load.

**Fix:** restored the intended P0-C policy implementation from the recorded change diff (`AUDIT/catalogue-phase1-2026-10-12/review-remediation-changes.diff`), adapted to the current 9-query shape: `loadOpenConflicts()` + `publicCoursePageWhere` / `publicUniversityPageWhere` in SQL + `passesPublicPagePolicy` re-check, `sourceUrl` selected for the JS check. Also completed the half-merged `tests/unit/sitemap-db-runtime.test.ts` (added the `dataConflict` mock and the university `sourceUrl` the same diff introduced). **20/20 tests pass**, including "sitemap omits pages named by an open conflict".

### 2. `src/lib/auth-middleware.ts` — duplicate interface members — FIXED

`AuthContext` declared `partnerId` / `partnerRole` twice (both merged branches added them). `tsc` reports Duplicate identifier; whole-app type-check/build would fail. Removed the bare duplicate pair, kept the documented one.

### 3. `src/app/api/partner-admin/marketing/route.ts` vs `tests/unit/partner-marketing-api.test.ts` — contract drift, resolved in favour of the test + UI — FIXED (11/11 pass)

The test (10 failures) encoded the contract the merged UI (`src/components/alo/views/partner-marketing-studio.tsx`) also expects; the route had regressed relative to both. Concrete defects found and fixed in the route:

| Defect | Evidence | Fix |
|---|---|---|
| `approvalStatus` returned raw lowercase (`'draft'`) while the UI compares against `DRAFT`/`APPROVED`/`PENDING_APPROVAL` | UI lines 552–1164 (`["DRAFT","REJECTED"].includes(...)`, `STATUS_LABELS` keys) — buttons/badges were dead against the route's values | `normalizeApprovalStatus()` mapping to the UI vocabulary |
| AI output in `imagePrompt` / `videoPrompt` skipped the claim sanitizer — "Guaranteed £5,000 scholarship poster…" was stored | `sanitizeCopy` checked 6 fields, not the 2 prompt fields; route's own rule 3 says any guarantee/money output is rejected | added both fields to the sanitizer (output violating → grounded template) |
| Provider error messages leaked to the client (`notice: aiError`) | test: `JSON.stringify(payload)).not.toContain('provider credential detail')` | generic disclosure notice; `aiError` stays in audit/row only |
| Claim-laden user input persisted (e.g. `cta: 'Guaranteed free admission with a £5,000 scholarship'`) | no input-side check existed | `hasProhibitedClaim` scan of `idea`/`cta`/`targetAudience` → 400 `fields` before provider/quota/persistence |
| Draft + monthly idea counter written non-atomically | counter upsert preceded create with no transaction | single `db.$transaction` for both; `requiresAloApproval` stamped from the quota row |
| No ALO review-queue mode (ALO staff got 403 without a `partnerId`) — dead-ends the merged UI's `alo_review` flow | test + UI `scope?: 'alo_review'` | GET review mode for ALO staff with no named partner; partner-scoped query unchanged |
| Cross-origin mutations accepted (no same-origin check) | test: "refuses a cross-origin mutation before reading or changing a campaign" | `mutationOriginAllowed` on POST + PATCH before parsing/DB (platform convention) |
| Approve had no optimistic concurrency (silent overwrite of concurrent edits) | stale-transition test | `updateMany` transition conditioned on `id/partnerId/approvalStatus/status/updatedAt`; `count === 0` → 409, no audit write |
| `schedule` reported success with "the publisher applies the wall time" although **no scheduled publisher exists**; `publish` role-gated before the capability check | UI states "no scheduled publisher, or live publishing endpoint"; `capabilities` in the test | `schedule` and `publish` now both refuse honestly with 409 (capability absent for everyone) |
| Regeneration allowed on submitted campaigns (UI gates it; `usage.update` could 500) | image-generation-after-submission test | `generate_image`/`generate_video` limited to `draft`/`rejected` rows → 409 otherwise |
| ALO staff approving from the review queue 403'd without a body `partnerId` | stale-transition test | staff fall back to the row's own tenant; forged `partnerId` still never used |

### 4. Stale test-side drift (code was the newer/hardened side) — FIXED

| File | Problem | Fix |
|---|---|---|
| `tests/unit/catalog-import-safety.test.ts` (5 fails) | auth mock lacked `identityDomain`/`userType`/`authenticationMethod` required by the hardened import routes; `tuition_fee: 20000` numeric cell (route contract: string cells ≤191); non-admin case only flipped `roles` while the route gates on `userType` | mock + one cell updated; all 6 pass |
| `tests/unit/catalog-import-quarantine.test.ts` (2 fails) | mocked `portalAuditLog` while the routes write `crmAuditLog`; expected `status: 'draft'` while the routes/schema use record-lifecycle `status: 'active'` + `publicationStatus: 'draft'` (the security property — no verified flags pass through, nothing invented — is preserved and asserted) | aligned to the route; all 4 pass |
| `tests/unit/legacy-lead-surfaces.test.ts` (1 fail) | tested a "legacy identity matching" surface that no longer exists anywhere in the codebase (`automaticIdentityMatching` appears only in this test) | block rewritten to the current intake contract: no auto-matching/registration advertised, invalid write refused before any DB access (the file's DB proxy throws if touched) |
| `tests/unit/critical-safety-remediation.test.ts` (1 fail) | demanded `process.exit(1)` as the disabled-script guard; `scripts/run-production-real-collection.ts` deliberately uses an earlier, stronger top-level `throw new Error('Legacy collection disabled…')` (the same pattern `tests/unit/catalog-import-quarantine.test.ts` blesses for `scripts/run-real-data-audit.ts`) | guard detection now accepts either form, earliest one wins; danger-ordering assertions unchanged |

## Remaining failures — environment only (cannot be fixed in this sandbox)

| Files | Failure | Cause |
|---|---|---|
| `tests/unit/accounting-ledger.test.ts` (6), `tests/unit/cms-revisions.test.ts` (6), `tests/unit/journal-integrity.test.ts` (2), `tests/unit/partner-marketing-compatibility.test.ts` (load), `tests/integration/{communication-ownership,content-publication-security,partner-b2b-security}.test.ts` (loads) | `@prisma/client did not initialize` / DMMF / `Prisma.sql` missing | `prisma generate` needs `binaries.prisma.sh`, which is unreachable from this sandbox (TLS blocked). Verified again this session. |
| 35 skipped tests | MySQL integration | no disposable MySQL in the sandbox |

These same blocks were recorded in `AUDIT/catalogue-phase1-2026-10-12/PHASE1-RESULTS.md` and `AUDIT/final-blockers-2026-10-11/`. They are **not** regressions. To clear them on a normal machine: `npx prisma generate && npm run typecheck && npx vitest run` (and a disposable MySQL for the skipped integration files), then `npm run build`.

## Behaviour changes a user may notice (all aligned with the merged UI and its own labels)

- Marketing Studio status badges/buttons now work (uppercase `DRAFT`/`PENDING_APPROVAL`/`APPROVED`/… the UI always expected).
- ALO staff opening Marketing Studio without a partner id get the cross-partner review queue (`scope: 'alo_review'`) instead of a 403.
- `schedule`/`publish` are refused with an explicit "not connected in this deployment" 409 (the UI already disabled both; `SCHEDULED` is labelled "Scheduled (legacy)").
- Claim-heavy input (guarantees, money/percentage offers) is rejected at the door with field-level errors.
- Cross-origin POST/PATCH to `/api/partner-admin/marketing` is refused (403) like other mutation APIs.
- Sitemap lists only published + VERIFIED + https-sourced catalogue pages with no open data conflict (same policy as homepage/search).

## Changed files

```
src/app/sitemap.ts                                  (parse fix + P0-C policy restored)
src/app/api/partner-admin/marketing/route.ts        (contract + security fixes above)
src/lib/auth-middleware.ts                          (duplicate AuthContext members removed)
tests/unit/sitemap-db-runtime.test.ts               (completed half-merged update)
tests/unit/catalog-import-safety.test.ts            (auth mock / cell)
tests/unit/catalog-import-quarantine.test.ts        (audit model / record status)
tests/unit/legacy-lead-surfaces.test.ts             (stale block modernized)
tests/unit/critical-safety-remediation.test.ts      (guard-form detection)
```

## Not done (deliberately)

- No commit policy change to data files, no dependency/schema/migration/seed changes, no production or GitHub deployment actions.
- `next build` still cannot run here (Prisma generate blocked). Recommend running the four environment gates above on CI/a normal machine before release.
- Owner-decision items from earlier reports (fabricated CSV disposition, VERIFIED-downgrade policy, intake unique index, merge workflow) are untouched and still open.
