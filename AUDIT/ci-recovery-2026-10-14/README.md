# PR #10 post-merge CI recovery — 2026-10-14 (Asia/Dhaka)

Base: `28ecf4b4d575d4778f70250644879e34f2044f53` (PR #10 merge).
Session branch: `arena/06d71c20-alo-web-crm-tech`.
Scope: Stage 1.0 CI diagnosis/repairs, authorized by the owner in this session. No production operations, schema/migration changes, seed, dependency version changes, DNS, mailbox or credential actions.

## Actual failures on the merged tree

GitHub Actions run `38481832145`:
- Quality gates: failed at tracked-file secret scan; downstream checks skipped.
- MySQL job: fresh migration, migration status, drift check and real MySQL integration tests passed; production build failed. Check annotations reported nine TypeScript errors in the partner-marketing route (missing conditional-update helper, missing publishing flag, status normalizer called with a string).
- This is different from the Phase 0 sandbox's missing Prisma engine/client failure.

## Repairs

1. Partner marketing: restore a typed conditional-update helper for asset generation, submission, approval, rejection and archive. Update and read-back occur in one transaction. Compare tenant, status, approval status and `updatedAt`; stale transitions return 409 without a success audit, and asset reservations are released on failed/stale persistence. Use the row-shaped status normalizer and remove the undefined publishing flag; publishing/scheduling still refuse with 409. Enforce marketing/reviewer roles on PATCH and preserve the persisted ALO-review requirement even if a package's current flag is lowered.
2. Credential gate: retain all existing scan patterns and tracked-file scope (including documentation, tests and imported vendor files). Move the shell gate to a testable script; Git scan errors now fail closed. Output locations only. Seven upstream-example matches in five vendored files have narrowly reviewed **whole-file SHA-256** exceptions. Any changed file digest stops suppression. Byte-for-byte identity was verified against published npm tarballs (`oauth@0.9.15`, `dotenv@16.6.1`, `prisma@6.19.2`); the manifest records URLs and reasons. No blanket vendor/docs/test exclusion. Replace a local synthetic SMTP test password with explicit dummy wording and reword a prose configuration-status false positive.
3. Lint: exclude historical `imports/` snapshots from root-application ESLint only (no imports from the active root source/build config were found). They remain credential-scanned. Replace four CommonJS test imports with ESM rather than disabling the lint rule.
4. Reviewer test: explicitly pass reviewer authorization in the positive approval/rejection test; add negative assertions that omitted/false authorization still throws and leaves the proposal pending. No change to the fail-closed implementation.

## Executed local verification

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | PASS; 1,233 packages installed from unchanged lockfile |
| Prisma native client generation and `npm run db:verify-client` | PASS; actual generated Prisma 6.19.3 client, 532 models |
| `npx prisma validate` with explicit disposable localhost DSN and local engine overrides | PASS |
| `node scripts/ci/npm-security-audit.mjs` | PASS; 0 effective high/critical, existing advisory waiver #1240992 disclosed by the script |
| tracked-file credential scan | PASS; 7 reviewed upstream-example matches, no remaining unreviewed matches |
| `npm run audit:env -- --check` | PASS |
| `npm run lint` | PASS; zero errors/warnings |
| `npx vitest run` | PASS; 1,951 passed, 72 skipped, 0 failed; 177 passed files, 6 skipped files |
| partner marketing focused tests | PASS; 32 tests (28 canonical + 4 compatibility); 17 new workflow/security regressions |
| `node --test tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs tests/secret-findings.test.mjs` | PASS; 25 tests, including 9 credential-gate regressions |
| full typecheck / production build / new-branch GitHub CI | In progress at initial evidence commit; final results will be appended |

### Sandbox constraints and mitigations

- Native Prisma engine downloads from `binaries.prisma.sh` are blocked. The existing tracked imported engine was checked against `@prisma/engines-version`: both use engine commit `c2990dca591cba766e3b7ef5d9e8a84796e47ab7`. Local generation/validation use explicit `PRISMA_SCHEMA_ENGINE_BINARY` / `PRISMA_QUERY_ENGINE_LIBRARY` paths to that matching native engine, **not a fake engine or placeholder client**. No repository defaults are changed to use this fallback. CI uses normal engine installation.
- Initial default-heap typecheck exited 134 (V8 OOM). A temporary 4 GiB swapfile was enabled only in this sandbox and typecheck rerun with the CI's 6 GiB heap allowance. This is not a production or repository change.
- The 72 skipped tests require an explicitly configured disposable MySQL database; no local MySQL service exists. They are not claimed passed. GitHub's MySQL job remains the authoritative real-database gate.
- GitHub log downloads redirect to hosts blocked here. Check/job metadata and annotations remain accessible and were used for diagnosis.

## Remaining boundaries

Green CI does not certify Phases 1–6, live data provenance, external provider delivery, hosting topology or production readiness. The existing Phase 0 plan remains the implementation roadmap. Historical tracked vendor snapshots are a repository-hygiene issue; removing tens of thousands of files is deliberately not part of this bounded recovery.
