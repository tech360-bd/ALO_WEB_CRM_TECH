# Deployment artifact cleanup — 2026-10-13

**Instruction:** remove the cPanel deployment artifacts and other foreign-project
files from this repository.

**Branch:** `arena/57b0809e-alo-web-crm-tech` · **HEAD:** `7c26aad4`
**Status:** applied to the working tree — **not committed, not pushed, not deployed.**

## Why this is consistent with the project's own decision

`docs/runtime-standard/RESULT.md` already states the authoritative runtime is
**Hostinger only → Node.js 22.x → npm → aloeducation.com**, and that cPanel
instructions were replaced. The remaining cPanel-named files were leftovers from
before that decision, plus one compatibility filename.

## Removed — 10 files

| File | Reason |
|---|---|
| `CPANEL_DEPLOYMENT_GUIDE.md` (root) | obsolete cPanel settings containing the real cPanel account name, production database name and database user, and absolute server paths (a reconnaissance aid, not a guide) |
| `public/docs/CPANEL_DEPLOYMENT_GUIDE.md` | the same document **served publicly** from `public/` — readable by anyone at `/docs/CPANEL_DEPLOYMENT_GUIDE.md` |
| `documentation/CPANEL-DEPLOYMENT-GUIDE.md` | generic cPanel guide; the CI secret-scan comment records that a **real production database password was once committed in this exact file** |
| `CPANEL_DEPLOY_COMMANDS.txt` | obsolete cPanel SSH commands (directory tree, `chmod 700`, symlinked `.env`, `migrate deploy`, `tmp/restart.txt`) |
| `cron/CPANEL_CRON_COMMANDS.txt` | cPanel crontab lines invoking `cron/*.php` wrappers that **do not exist in this repository**, plus `/home/aloeduca/...` log paths |
| `docs/runtime-standard/LEGACY-CPANEL-GUIDE.md` | retired cPanel discovery record, kept only as history for a runtime that is no longer authorized |
| `.live-cpanel-evidence-dir` | 43-byte pointer to `evidence/live-cpanel-final-20260801-021935`, **a directory that no longer exists** |
| `alo-education-web-crm-final/CPANEL_DEPLOYMENT_GUIDE.md` | duplicate inside the legacy exported copy |
| `alo-education-web-crm-final/CPANEL_DEPLOY_COMMANDS.txt` | duplicate inside the legacy exported copy |
| `alo-education-web-crm-final/.live-cpanel-evidence-dir` | duplicate dangling pointer |

## Removed — 1 foreign-project file

| File | Reason |
|---|---|
| `_original_archives/alaminn-info-full.zip` | Git LFS pointer to **56 MB of a different project's source** (`oid sha256:c915fad9…`, `size 56290419`), tracked through the `_original_archives/*.zip` LFS rule. The two sibling entries are this project's own source archives and were kept. |

## Renamed — 1 file

| From | To | Why not deleted |
|---|---|---|
| `CPANEL-DEPLOYMENT-GUIDE.md` | `HOSTINGER-DEPLOYMENT-GUIDE.md` | Its content was already Hostinger-only ("Hostinger deployment guide (compatibility filename)"), and **`tests/runtime-standard.test.mjs` asserts against that path**. Deleting it would have broken a test that protects the runtime contract; the filename was retained only for an old link. |

## Dependants updated (so nothing references a removed path)

| File | Change |
|---|---|
| `tests/runtime-standard.test.mjs` | 2 assertions point at `HOSTINGER-DEPLOYMENT-GUIDE.md` |
| `scripts/package-production-source.sh` | `DOCS` array lists the renamed guide |
| `tests/unit/deployment-config.test.ts` | describe title "managed cPanel" → "Hostinger runtime" (assertions were already Hostinger/npm/standalone) |
| `scripts/audit-runtime-standard.py` | the now-dead `LEGACY-CPANEL-GUIDE.md` exclusion was removed, so the whole `docs/runtime-standard/` directory is derived scan output again |
| `.github/workflows/ci.yml` | one comment referenced the deleted guide while explaining the secret-scan scope; reworded, rationale kept |
| `CRON_JOBS.md` | the obsolete "`cron/CPANEL_CRON_COMMANDS.txt` must be corrected" warning replaced with the Hostinger hPanel curl scheduling form and the UTC-vs-Asia/Dhaka warning |
| `docs/runtime-standard/RESULT.md` | dated entry recording the removal next to the earlier "retained as legacy" decision |
| `docs/WHATSAPP-PLATFORM-MERGE-REPORT.md` | risk item 3 marked resolved |

## Deliberately NOT changed

Historical evidence artifacts still mention cPanel by name:
`COMPLETE_PROJECT_MANIFEST.txt`, `FILE_MANIFEST.csv`, `FINAL-FILE-INVENTORY.csv`,
`DOCUMENTATION_INVENTORY.csv`, `docs/FULL_FUNCTIONALITY_INVENTORY.md`,
`docs/BRANCH-MERGE-LEDGER.csv`, `delivery-evidence-*/reports/*`,
`AUDIT-2026-09-27-ARENA-EVIDENCE-REPORT.md`, `.repair-backup-20260819/*`.
These are frozen records of a past state; rewriting them would falsify evidence.
They are inventories and audit reports, not deployment instructions.

## Verification after removal

| Check | Result |
|---|---|
| cPanel-named files remaining | **0** |
| `node --test tests/runtime-standard.test.mjs` | **5 passed, 0 failed** |
| `vitest` deployment-config + cron-quarantine | **2 files, 15 tests passed** |
| `cron-scheduler-policy-check.ts` | **221 passed, 0 failed** |
| `document-access-policy-check.ts` | **86 passed, 0 failed** |
| `b2b-access-policy-check.ts` | **94 passed, 0 failed** |
| `communications-policy-check.ts` | **119 passed, 0 failed** |
| `eslint` (all changed files) | **0 problems** |
| `prisma generate` + verify | **533 models** |

### Environment incident during this work (recorded, resolved)

Mid-task the sandbox restored itself to the base commit: `HEAD` reverted to
`c2cc79e9` and `node_modules` was emptied. Verified before repairing that **all
work was intact on disk** and that the only files missing were the 12 paths
deleted/renamed by this task — nothing else was lost. Repaired with
`git fetch` → **mixed** `git reset origin/arena/57b0809e-alo-web-crm-tech`
(never `--hard`) → `npm ci --ignore-scripts` → `prisma generate`. HEAD is back at
`7c26aad4` and every suite above was re-run after the repair.
