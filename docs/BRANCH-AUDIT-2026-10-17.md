# Remote branch audit — 2026-10-17

## Scope and method

Fetched every remote head and the full Git history (the checkout initially had only a shallow `main` ref). Compared each branch tip to `origin/main` with `git merge-base --is-ancestor` and `git rev-list --left-right --count`.

Baseline main: `15001b4dd743b59614a45fb29f7d8b5387357b8f`.
Remote inventory at audit: **61 heads including main; 60 non-main branches**.
**56 non-main tips are ancestors of main; 4 are not.** An ancestry result means the commits are incorporated, not that every historic line remains unchanged or every feature is functional.

## Final reconciliation requested by the user

After reviewing the initial exclusions below, the user reiterated “please add all”.
The consolidation candidate therefore includes **all 60 original non-main branch
histories**, without activating unsafe legacy applications:

- 56 were already ancestors of main.
- 1 university-monitoring hardening branch is merged into the active application.
- 3 legacy branches are preserved via `imports/legacy-branch-references/manifest.json`
  and inert reference files. Their histories are reconciled with the current tree
  after preservation, not used to replace the live app. This is explicitly an
  archive-preserving `ours` reconciliation, **not a claim that every legacy feature
  has been ported or certified**.

The manifest inventories all 1,937 changed donor paths. Identical blobs refer to
existing paths at pinned commit `809fd425cc8be33ff56ac26a1faa6e7e7cccbeb9`.
Differing source is stored as non-executable `.txt`/`.asset` files with hashes.
Potential credential-bearing lines are scrubbed. One process-id file and six
private-storage files are inventoried but deliberately not republished.
No branch is deleted or force-pushed. Main integration is through PR #14 after CI.

## Initial review (before the user's all-branches confirmation)

- `arena/bec1d052-alo-web-crm-tech` (`6b09c785fe63737ca9edff389520d302c8842fc8`): consolidate its university monitoring and verified-catalogue hardening into the current session branch, together with the CI fixes. Preserve current brand colours when resolving UniversityHub; keep the incoming source-evidence requirements and unrestricted-year international course pagination. Resolve test import-order conflicts and update the explicit intake-policy test. Fix the optional search-parameter inference error caught by TypeScript. This includes three additive/widening MySQL migrations; no live database migration was run locally.
- `integration/ai-builder-full-20261013` (`9b99840ebcec2a0d67a0f89603b8db824bf9c217`): **not merged**. PR #7 was closed unmerged. Rechecked that this snapshot uses SQLite instead of the root MySQL datasource and lacks the root AI execution route's session guard. See `PR7-INTEGRATION-VERIFICATION-2026-10-14.md` and merged PR #9 for the prior manual reconciliation. A blanket merge would undo later safeguards.
- `integration/ai-builder-alo-verified-20261013` (`5b27f58b68e34b73223b4a55107ffc7852a828f3`): **not merged**. Adds a separate 451-file application under `integration-sources/alo-verified`, not a patch to the root runtime. Only 60 donor blobs have byte-identical counterparts anywhere in baseline main; the remaining 391 are not proven equivalent. Needs an explicit archive-versus-feature-port decision and security/compatibility review, not an assumption that the name “verified” means validated.
- `other-ai-builder-2026-09-13` (`b22a18ae282452049686c8f3251b7680c6cdb523`): **not merged**. Unrelated history; no merge base with main. Its 747-file tree includes the removed `alo-cpanel` PHP application. 424 blobs have identical counterparts in baseline main; 323 do not. Prior reports document selective integration of useful code. Do not force an unrelated-history merge into the live application.

These initial exclusions led to the explicit archive-preserving reconciliation described above. The donor branches remain available unchanged. The following baseline inventory is historical, not the final ancestry result.

## Local validation of the consolidated candidate

- `npm test`: **2,001 passed, 72 skipped**, 184 test files passed and 6 DB-integration files skipped (no `TEST_DATABASE_URL`).
- `npm run lint`: passed.
- `npm run typecheck`: passed after fixing optional search-parameter inference.
- Prisma schema validation: passed using bundled WASM. Native engine download host is blocked in this sandbox, so the generated client uses `--no-engine` for static validation and mocked unit tests.
- `npm run audit:env -- --check`: passed.
- Live MySQL migrations/integration and production build require the remote CI checks; local passes do not certify them.

## Complete baseline inventory

The table records ancestry **before** this consolidation, excluding the local session branch, which had not yet been pushed.

| Branch | Tip | Commits absent from main | Baseline status |
|---|---|---:|---|
| `arena/01a098f3-alo-education-z-ai` | `d99c0de1702e` | 0 | Already in main history |
| `arena/01a09a6f-alo-education-z-ai` | `ac4ce944a161` | 0 | Already in main history |
| `arena/01a09c20-alo-education-z-ai` | `91d64509be70` | 0 | Already in main history |
| `arena/01a0a165-alo-education-z-ai` | `d14d040b1717` | 0 | Already in main history |
| `arena/01a0a165-alo-education-z-ai-app-fixes` | `8fbcd12967ec` | 0 | Already in main history |
| `arena/01a0a5b2-alo-education-z-ai` | `8347b483dfbf` | 0 | Already in main history |
| `arena/01a0aa5e-alo-education-z-ai` | `f3fe2478ef69` | 0 | Already in main history |
| `arena/01a0b15b-alo-education-z-ai` | `b77b7d95e7df` | 0 | Already in main history |
| `arena/01a0b26d-alo-education-z-ai` | `dea208380d08` | 0 | Already in main history |
| `arena/01a0c218-alo-education-z-ai` | `f18a79c495bd` | 0 | Already in main history |
| `arena/01a0e4dc-alo-education-z-ai` | `4d0486a0a234` | 0 | Already in main history |
| `arena/01a0e685-alo-education-z-ai` | `944feabfdd0f` | 0 | Already in main history |
| `arena/01a0f2b5-alo-education-z-ai` | `74b11e6fcda1` | 0 | Already in main history |
| `arena/01a0f6e7-alo-education-z-ai` | `4969141289fb` | 0 | Already in main history |
| `arena/01a0f889-alo-education-z-ai` | `34e02734005c` | 0 | Already in main history |
| `arena/01a0fbce-alo-education-z-ai` | `5bb284659141` | 0 | Already in main history |
| `arena/01a0feba-alo-education-z-ai` | `6c456828bc6b` | 0 | Already in main history |
| `arena/06d71c20-alo-web-crm-tech` | `91f65298bb8f` | 0 | Already in main history |
| `arena/16786e58-alo-education-z-ai` | `a88265cd9ccc` | 0 | Already in main history |
| `arena/176a6835-alo-education-z-ai` | `4ba0078671fb` | 0 | Already in main history |
| `arena/1cf1296a-alo-web-crm-tech` | `34f7c29df74e` | 0 | Already in main history |
| `arena/227cb663-alo-education-z-ai` | `cca03f9c00d0` | 0 | Already in main history |
| `arena/3f536e7b-alo-education-z-ai` | `41af7e24dda8` | 0 | Already in main history |
| `arena/3fec094f-alo-education-z-ai` | `d0a29a1d5b94` | 0 | Already in main history |
| `arena/44842eb6-alo-education-z-ai` | `1399ed87193c` | 0 | Already in main history |
| `arena/5656dd34-alo-web-crm-tech` | `2f308c01e841` | 0 | Already in main history |
| `arena/57b0809e-alo-web-crm-tech` | `ccf6e620a242` | 0 | Already in main history |
| `arena/70fff683-alo-education-z-ai` | `e389694ab010` | 0 | Already in main history |
| `arena/712caef6-alo-web-crm-tech` | `ed555aa1bfe4` | 0 | Already in main history |
| `arena/7e179efb-alo-education-z-ai` | `cdd299a9551e` | 0 | Already in main history |
| `arena/8b727e17-alo-education-z-ai` | `de6b558f4409` | 0 | Already in main history |
| `arena/8bfa5154-alo-education-z-ai` | `813ddccb4d7d` | 0 | Already in main history |
| `arena/8d540fcc-alo-education-z-ai` | `2f13ca24d674` | 0 | Already in main history |
| `arena/8e2beff7-alo-web-crm-tech` | `4500ab3c02cb` | 0 | Already in main history |
| `arena/adfaa77f-alo-education-z-ai` | `9e7dd27d5723` | 0 | Already in main history |
| `arena/bec1d052-alo-web-crm-tech` | `6b09c785fe63` | 1 | Not in main history; see decision above |
| `arena/c2f1b27c-alo-education-z-ai` | `4ab9f2506ad8` | 0 | Already in main history |
| `arena/d36e2d29-alo-education-z-ai` | `27ff81931ff7` | 0 | Already in main history |
| `arena/ea4e9140-alo-education-z-ai` | `b6dc51448eec` | 0 | Already in main history |
| `arena/f5576c6b-alo-education-z-ai` | `270b3542711f` | 0 | Already in main history |
| `arena/fd40db6d-alo-education-z-ai` | `5c7e3bb71c4b` | 0 | Already in main history |
| `arena/final-mysql-ddl-validation` | `c822b3fa16d6` | 0 | Already in main history |
| `arena/integration-2026-09-14` | `5bdd2a14c8b3` | 0 | Already in main history |
| `codex/alo-recovery-20261008` | `9b5d5379f60b` | 0 | Already in main history |
| `codex/aloeducation-access-content-repair` | `35a26edd8483` | 0 | Already in main history |
| `codex/ci-env-repair-20261008` | `b4ccb6f19187` | 0 | Already in main history |
| `codex/fix-whatsapp-duplicate-get` | `97ecabf8ca18` | 0 | Already in main history |
| `codex/page-agent-audit-20261008` | `4e42687a1975` | 0 | Already in main history |
| `fix/alo-production-deploy-pipeline` | `7a458c0aa14b` | 0 | Already in main history |
| `fix/hostinger-typescript-repair` | `cf8edcabab6a` | 0 | Already in main history |
| `fix/reconciliation-mysql-ddl` | `caaeb227ff18` | 0 | Already in main history |
| `fix/reconciliation-mysql-ddl-final` | `baf8e70e5b73` | 0 | Already in main history |
| `imports/alaminn-info-full-20261013` | `85aaa4ad0bea` | 0 | Already in main history |
| `imports/alo-education-full-20261013` | `fc636ca09c27` | 0 | Already in main history |
| `imports/alo-education-source-20261013` | `316179173b9d` | 0 | Already in main history |
| `integration/ai-builder-alo-verified-20261013` | `5b27f58b68e3` | 1 | Not in main history; see decision above |
| `integration/ai-builder-full-20261013` | `9b99840ebcec` | 1 | Not in main history; see decision above |
| `integration/developer-projects-20261013` | `a707b94b779d` | 0 | Already in main history |
| `other-ai-builder-2026-09-13` | `b22a18ae2824` | 1 | Not in main history; see decision above |
| `repair/complete-system-hardening-2026-10-07` | `59528db2b9fc` | 0 | Already in main history |
