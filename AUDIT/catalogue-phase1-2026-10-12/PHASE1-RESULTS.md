# Catalogue Phase 1 — Security Remediation Results (K1–K4)

- **Date:** 2026-10-12
- **Branch:** `arena/8b727e17-alo-education-z-ai`, HEAD `c5bfcbba`. **Nothing committed, pushed, merged or deployed.**
- **Not done (by instruction):** no migration, seed, data import, dependency install, schema change or production access.
- **Pre-existing user changes:** preserved. `src/proxy.ts` already had uncommitted changes before Phase 1; they are saved in `proxy-preexisting-uncommitted-baseline.diff` and are still present. The Phase 1 proxy hunk in `phase1-changes.diff` is relative to that baseline, not to HEAD.
- **Working-tree count:** 384 entries before Phase 1 → 396 after (6 route files newly modified, `src/proxy.ts` already modified, 4 new source/test files, 2 new AUDIT folders).

## Files changed

| File | Change |
|---|---|
| `src/app/api/import-center/route.ts` | K1: approve/reject/publish no longer write `verificationStatus`. Publish requires an already VERIFIED record with an https official source. New explicit `verify` action (SUPER_ADMIN only, not while impersonating, https source required, does not publish). Action/type/slug validation, control fields refused, optimistic-concurrency guard, before/after audit. Guard switched to the shared `requireCatalogAdmin` (ADMIN/SUPER_ADMIN by verified user type; same-origin for PATCH). |
| `src/app/api/university-monitoring/changes/[id]/route.ts` | K1: approving one field change no longer marks the whole UniversityPage/CoursePage `VERIFIED`. Field value, history and audit unchanged. `lastVerifiedAt` is still refreshed (see remaining risks). |
| `src/app/api/course-finder/admin/route.ts` | K2: create always stores `UNVERIFIED` with `lastVerifiedAt = null`; only DRAFT/PENDING_REVIEW at creation. Update no longer spreads the body: allow-listed, validated content fields only; control fields refused; verification can only be downgraded; a factual edit to a VERIFIED record → `NEEDS_REVIEW` (and PUBLISHED → `PENDING_REVIEW`); publish needs ADMIN/SUPER_ADMIN + VERIFIED + https source; identical re-sent values are ignored; optimistic concurrency; DELETE limited to ADMIN/SUPER_ADMIN. |
| `src/lib/course-finder/content-page-guards.ts` (new) | Shared field allow-list, source-URL check (https, no credentials, no synthetic hosts), fact-change detection. |
| `src/app/api/source-logs/route.ts` | K3: GET and POST now catalogue-admin only (previously any authenticated account, including STUDENT/PARTNER). POST: client `verificationStatus`/`checkedBy`/`verifiedBy`/`lastVerifiedAt` refused; always `pending`; checker = session actor; https official URL required; entity/source types allow-listed; same-origin; generic error messages. |
| `src/app/api/data-quality/route.ts` | K3: catalogue-admin only. GET is now read-only (the upsert-on-read was removed). New explicit POST to recalculate and save one score (same-origin). Generic error messages. |
| `src/app/api/crm/course-import/download-errors/route.ts` | K4 follow-on: this route relied on the proxy alone and returns raw failed-import rows. It now has a handler check (ADMIN/SUPER_ADMIN), matching its sibling `/errors`; `batchId` format validated. |
| `src/proxy.ts` | K4: new exported `isStaticAssetBypass()`. The "any path with a dot" bypass no longer applies to `/api/**` or to role-gated portal prefixes (`/admin`, `/crm`, `/super-admin`, `/partner-admin`, `/student`, …), including percent-encoded and case variants. Public static files are unaffected. |
| `tests/unit/catalogue-phase1-security.test.ts` (new) | 23 handler-logic tests (mocked DB and auth). |
| `tests/unit/catalogue-phase1-real-auth.test.ts` (new) | 9 tests with the real auth middleware (DB and next-auth mocked). |
| `tests/unit/catalogue-phase1-proxy.test.ts` (new) | 4 proxy-policy tests. |

## Test evidence

| Check | Result | Scope / caveat |
|---|---|---|
| New Phase 1 tests | **36/36 PASS** | Mocked DB. Not database proof. Log: `test-new-phase1.log` |
| Same tests against the pre-Phase-1 code (files temporarily swapped, then restored and byte-compared) | **27 failed, 9 passed** | Shows the tests detect the old behaviour. The 9 that passed on old code: 6 unauthenticated-401 cases the old code already handled, 2 guard-helper tests, 1 proxy public-API assertion |
| Related existing suites (proxy, catalogue, course-finder, public catalogue, safety, monitoring) | **330 passed, 28 skipped** | The skipped tests are the 2 MySQL integration files for university monitoring: **BLOCKED** (no disposable MySQL) |
| Full unit suite | **1833 passed, 20 failed** | Same 20 failures as before Phase 1: 14 **BLOCKED** by the Prisma client stub (accounting-ledger, cms-revisions, journal-integrity), 6 pre-existing standalone-verification failures. Phase 1 adds 36 passes and no new failures. Summary: `test-full-unit-summary.log` |
| Scoped type-check (changed files + new tests) | **0 errors** | The Prisma client is a stub, so Prisma call shapes are not type-checked |
| ESLint (changed files + new tests) | **0 errors, 0 warnings** | |
| Full type-check, production build | **NOT RUN / BLOCKED** | Prisma generate blocked |
| MySQL integration, E2E, browser check of the admin screens | **NOT RUN / BLOCKED** | No disposable MySQL; no running app |

## Security impact

- Approval, rejection, publication and ordinary edits can no longer make catalogue content VERIFIED. Verification is an explicit SUPER_ADMIN action that requires an https source on the record.
- Unverified content can no longer be published through `/api/import-center` or `/api/course-finder/admin`.
- Request bodies can no longer mass-assign `verificationStatus`, `lastVerifiedAt`, `approvalStatus`, ids, timestamps or relations on CoursePage.
- Students, partners and ordinary staff can no longer read source logs, create source records or trigger data-quality writes.
- Catalogue API and portal paths can no longer skip the proxy's authentication and role checks by adding a dot or an extension.

## Behaviour changes users may notice

- Marketing managers can still list, create drafts, edit and unpublish course pages. They can no longer publish or delete.
- Editing a fact on a verified, live course page takes it offline (`PENDING_REVIEW`, `NEEDS_REVIEW`) until it is re-verified and republished.
- The admin screens show a generic failure toast (e.g. "API 409") when publishing is refused. **There is no UI button for the new `verify` action**; it is API-only. Adding UI was outside Phase 1.
- Users whose access to `/api/import-center` relied only on a lowercase `admin` role claim lose access.
- APPLICATION_TEAM can no longer download import error CSVs (the sibling `/errors` route already excluded them).
- `/api/data-quality` GET no longer saves scores; use POST.

## Remaining risks (not fixed in Phase 1)

1. **Schema defaults:** `CoursePage.verificationStatus` defaults to `"VERIFIED"` and `approvalStatus` to `"PUBLISHED"`. Any create path that omits them inherits both. Fixing this needs a migration (not authorised).
2. **AI command fallback:** the inline `DEPLOY_CONTENT` branch in `/api/ai-command/execute` creates CoursePage records without setting `verificationStatus` (so they inherit VERIFIED from the schema default), with placeholder facts, and writes `payload.data` directly on update. It only runs when `ai-action-executor` fails or is missing. Not changed.
3. **Existing data:** records already marked VERIFIED by the old code stay VERIFIED. Finding them needs a read-only database audit (**BLOCKED**, no DB access).
4. **Content-only surfaces:** the homepage and search APIs list `*Page` records by `approvalStatus = PUBLISHED` only, so legacy published-but-unverified pages can still appear there.
5. **Monitoring:** approving one field still refreshes the record's `lastVerifiedAt`.
6. **Proxy-only routes:** about 85 routes still rely on the proxy alone (only download-errors gained a handler check). They are no longer bypassable by dotted paths, but defence in depth is incomplete.
7. **Origin check:** same-origin enforcement depends on `NEXTAUTH_URL` matching the production origin.
8. **Earlier audit items still open:** C1, H1–H8 and M1–M12 outside K1–K4 (e.g. `/api/partner-packages`), no backups (K6), fabricated CSVs (K5).

## Rollback

Nothing is committed. To undo every Phase 1 change and keep the user's earlier uncommitted work (including the earlier `src/proxy.ts` edits), run from the repository root:

```bash
git apply -R --check AUDIT/catalogue-phase1-2026-10-12/phase1-changes.diff   # dry run
git apply -R AUDIT/catalogue-phase1-2026-10-12/phase1-changes.diff
```

`git apply -R --check` passed on 2026-10-12. Reversing also deletes the four new Phase 1 source/test files. The AUDIT folders can be removed separately if wanted. Do **not** use `git checkout -- src/proxy.ts`: that would also discard the earlier, unrelated uncommitted proxy changes.

## Artefacts in this folder

- `phase1-changes.diff`: the complete Phase 1 diff (proxy hunk relative to the pre-existing baseline).
- `proxy-preexisting-uncommitted-baseline.diff`: the user's uncommitted proxy changes as found before Phase 1.
- `test-new-phase1.log`, `test-full-unit-summary.log`: test outputs.
