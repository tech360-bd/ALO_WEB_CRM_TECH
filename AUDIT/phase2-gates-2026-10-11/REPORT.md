# Phase 2 — Gate1 reconciliation / Gate2 private-upload batch

**2026-10-11 · NOT READY / RELEASE HOLD**

## 1. Gate1 — BLOCKED pending exact original five audits

No matching Requirements Registry / five-document set was identified in the checkout. Do not invent the missing ten requirement IDs or the missing API status. Please supply the exact documents/paths and original portal acceptance specification.

| User discrepancy | Verified result / disposition |
|---|---|
| 165 requirements; statuses total 155 | Ten-row classification remains BLOCKED: original registry not identified. |
| 161 routes; portal breakdown 189 | Original 28-count excess cannot be assigned to duplicates without the original rows. Current tree has 404 page files / 404 normalized paths, no duplicates by documented method. |
| 86 APIs; statuses total 85 | Missing status remains BLOCKED. Current tree has 899 API route files / 899 normalized paths; these are files, not HTTP-method totals or functional passes. |
| 132 models versus 532 generated | Current canonical schema has 532 anchored model declarations, zero enums; installed generated DMMF has exactly the same 532 names. 22 migration.sql files. Source/scope of 132 remains unknown. No schema edit in this batch. |

Reproduce: `node scripts/audit-phase2-counts.mjs`; row-level paths, first-segment group counts, duplicate detection and audit source hashes are in `repository-counts.json`. Current source only: excludes nested archived project, strips route groups/parallel slots. Requirements cannot be inferred from these counts.

Inspected alternatives do NOT match the requested audits: `docs/final-master` reports 146 requirements / 336 pages / 748 APIs / 450 models (September 14); `docs/audit` reports 367 pages / 819 APIs / 479 models (September 18); root register reports 531 models (October 9). Root CSVs contain 167 API rows, 52 page rows, and 9 route rows. Original-source text search has no matching lines; absence of a match is not proof that no differently named source exists.

Partner Admin already has 23 page files; Application Manager has 19. These are NOT completion claims. The specified missing 7/6 routes cannot be selected safely until original requirement IDs, permissions, models and acceptance criteria are supplied. No portal pages built.

## 2. Gate2 / P0-1 — bounded mitigation, NOT resolved

### Actual findings and root causes
- `public/uploads` absent at initial local inspection, not a deployment finding. No real student documents opened or copied.
- Student, partner, employee, generic document and UCC byte handlers already use private-file-store; student download scopes query to authenticated Student.id; UCC applies conversation and B2B visibility. Existing legacy secure-download returns 410, generic storage upload returns 503. Preserved, not rebuilt.
- Private storage previously checked only lexical production paths, so an alias could resolve into public storage. Canonical path validation now applies in all environments, rejects overlap with public/public_html/.next, and retains safe operator-managed private aliases. Flat identifiers and descriptor O_NOFOLLOW/nonregular-file rejection remain.
- Proxy previously excluded dotted URLs and bypassed static extensions. Now checks all paths before static bypass, denies normalized/encoded uploads and nested public copies, including image optimizer source URLs; returns 403/no-store. Optimizer independently allows only curated local image paths; unapproved image paths may now fail closed.
- Standalone preparation copied the public tree wholesale. New metadata-only preflight refuses uploads directories (including empty/nested/case variants) and symlinks in both source and stale destination before any copy. Verification has the same gate. Does not migrate/delete files.

### Files changed in this batch
`src/lib/storage/private-file-store.ts`, `src/proxy.ts`, `next.config.ts`, `scripts/{prepare-standalone,verify-standalone}.mjs`, new `scripts/lib/public-upload-guard.mjs`; reproducible counting script; five new security test files plus extended private filesystem tests; this report and audit cross-references. Pre-batch snapshots under `before/` preserve existing uncommitted implementation.

### Executed evidence
- **104 PASS, 0 FAIL**, 9 focused test files (`security-tests.txt`). Real isolated filesystem tests; student route uses real authentication/authorization code and separate synthetic A/B session fixtures with mocked database, NOT independent live accounts. Owner bytes/headers/audit writes, missing/invalid session, cross-student denial, traversal/symlink rejection, tamper and audit-failure denial tested. Partner/UCC regression tests included.
- **18/18 local Next dev HTTP GET/HEAD checks PASS**, including an existing synthetic marker in a newly created test-owned public/uploads directory, encoded names/separators, nested aliases and image optimizer. 403/no marker/no-store. No DB URL passed to this server. Server stopped afterwards. Marker removed only after content/ownership verification; empty test-owned directory removed. No preexisting uploads changed. See `http-results.json`, `http-fixture-cleanup.json`.
- Packaging command **exit 1 as expected** with synthetic upload fixture: refusal before copying. Not a successful build claim.
- Focused TypeScript passed earlier in batch; final rerun recorded separately. ESLint touched application/tests passed; four script paths were ignored by repository lint config (warnings, not checked). Node syntax checks recorded separately.
- Initial direct-URL test invocation failed six tests due to unavailable `unstable_doesProxyMatch` helper; corrected to installed Next helper `unstable_doesMiddlewareMatch`. Failure log retained; final suite passes.

### Residual risks / owners
1. Hosting operator: actual Hostinger static aliases/CDN, existing public copies and optimizer caches remain uninspected. App proxy cannot protect a front server serving files without Node. Approved server denial and cache invalidation verification required; do not assume local 403 proves deployed protection.
2. Storage/security owner: inventory mount canonical paths, ownership/permissions, persistence, backups/restore and private-volume exposure. Privileged concurrent mount replacement/hardlinks are outside this root check. No backup/approved migration exists; no automatic move/delete permitted.
3. Storage-service still reads metadata `absolutePath` / joined paths with ordinary fs.readFile; generic download currently admin-only, but containment/leaf symlink hardening needs a separate legacy-compatible batch.
4. Video-engine local helper still writes public/uploads/videos; recording handler still fabricates a public recording URL. The new denial/packaging gate intentionally blocks publication; do not label video workflow complete. No media moved. Separate privacy/classification and working private-media pipeline needed.
5. HRM document endpoint accepts caller filePath metadata; UI suggests /uploads. Not fixed/certified in this batch. Resource-specific authorization coverage beyond executed tests remains incomplete.
6. Curated image allowlist and all-path proxy matcher need full UI/performance regression in approved staging. Public video URLs deliberately unavailable pending review.

## 3. Unchanged release blockers / sequencing

Official Prisma engine restriction; 63 DB tests BLOCKED/not executed; full build/typecheck; Hostinger plan/runtime; independent live-role tests; provider sandbox; private-repository access restrictions and DB cleanup harness gaps remain open. Historical 1594/63 and 1625/63 test runs remain separate, not replaced by 104 focused tests.

No production access, messages, migration, deployment, commit, push or merge performed. No 20-pass QA certification: these are specific tests, not twenty independent QA passes.

Next: obtain original five audits and exact portal requirements → reconcile rows → complete remaining P0 evidence/remediation → verified Partner Admin → Application Manager → P1 → P2 → remaining routes and 20 distinct QA passes. Broader implementation remains blocked at Gate1.

## 4. Rollback

No data/schema migration in this batch. For application rollback, manually reverse ONLY this batch against `before/` snapshots, preserving earlier uncommitted changes. Remove new test/guard imports only with corresponding code reversal. Do not git-reset the dirty tree. Do not restore public serving as a production workaround: retain edge denial/release hold while investigating. Existing uploads must remain untouched pending backup and an approved reversible migration plan.
