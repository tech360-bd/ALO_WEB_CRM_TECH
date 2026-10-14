# 00 — Repository, Branches and Pull Requests (read-only snapshot)

**Captured:** 2026-10-12 · method: `git branch -a -vv`, `git log`, `git status`, `gh pr list`, `gh pr view 6` — all read-only.

## Git state

| Item | Value |
|---|---|
| Remote | `origin` → `https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git` |
| Session branch | `arena/1cf1296a-alo-web-crm-tech` @ `be9081f` ("final check: fix post-PR#4 merge damage, align partner-marketing with UI contract", 2026-10-12) |
| `main` | `e4f26a1` = merge of PR #4 (`arena/01a0f2b5-alo-education-z-ai`) |
| Working tree | clean except this untracked Phase 0 package (`AUDIT/phase0-master-instruction-2026-10-12/`) |
| Open GitHub issues | none |

## Pull request history (all merged today except #6)

| PR | Title | Branch | State |
|---|---|---|---|
| 1 | Codex/aloeducation access content repair | `codex/aloeducation-access-content-repair` | MERGED |
| 2 | Fix tenant isolation, seat limit, quota and voucher integrity in B2B … | `arena/16786e58-alo-education-z-ai` | MERGED |
| 3 | Arena/8bfa5154 alo education z ai | `arena/8bfa5154-alo-education-z-ai` | MERGED |
| 4 | Arena/01a0f2b5 alo education z ai | `arena/01a0f2b5-alo-education-z-ai` | MERGED (is `main`) |
| 5 | Fix duplicate GET export in WhatsApp webhook route | `codex/fix-whatsapp-duplicate-get` | MERGED |
| **6** | **CI recovery: fix schema duplicate relation, restore fail-closed audit gate, repair merge-damaged build/tests** | `arena/712caef6-alo-web-crm-tech` | **OPEN** (mergeable, +627/−445, 21 files) |

## ⚠ PR #6 coordination finding (must not be clobbered)

PR #6 is **in-flight parallel work repairing the same PR#4 merge damage**, and its file list overlaps 8 files also changed by this session's `be9081f`:

| File | be9081f (this session) | PR #6 |
|---|---|---|
| `src/app/sitemap.ts` | parse fix + P0-C policy | ✔ touched |
| `src/lib/auth-middleware.ts` | duplicate `partnerId`/`partnerRole` removed | ✔ touched |
| `src/app/api/partner-admin/marketing/route.ts` | contract/security alignment (11/11 tests) | ✔ touched |
| `tests/unit/sitemap-db-runtime.test.ts` | completed half-merge | ✔ touched |
| `tests/unit/catalog-import-safety.test.ts` | auth mock alignment | ✔ touched |
| `tests/unit/catalog-import-quarantine.test.ts` | audit-model/status alignment | ✔ touched |
| `tests/unit/legacy-lead-surfaces.test.ts` | stale block modernized | ✔ touched |
| `scripts/run-production-real-collection.ts` | (test-side guard fix) | ✔ touched |

PR #6 additionally (not in `be9081f`): `prisma/schema.prisma` **duplicate-relation fix**, `scripts/ci/npm-security-audit.mjs` (fail-closed audit gate), `docs/MIGRATION-INVENTORY-2026-10-12.md`, `docs/environment-classification.json`, route fixes in `partner-admin/users`, `partner/marketing/generate`, `UniversitiesListing.tsx`, and more test repairs.

**Implication for the plan:** before Phase 1 code work starts, the owner should decide merge order for PR #6 vs `be9081f`. Both branches repair the same defects in possibly different ways; merging both blindly risks conflicting resolutions and silent behaviour regressions. Proposed reconciliation (recorded in `04-RISK-REGISTER.md` as R19):

1. Diff `be9081f` vs PR #6 file-by-file on the 8 shared files.
2. Prefer whichever side is strictly stronger per file (test evidence decides — both sides can run the same suites).
3. Keep PR #6's unique additions (schema duplicate-relation fix, CI security audit gate, migration inventory) — these map to plan stages 1.0/1.5/1.6.
4. Merge in the order the owner chooses; re-run the full suite on the merged result before any further work.

## Branch-protection / history preservation

No repository settings were read or changed. Git history is untouched by this Phase 0 package (untracked documentation only). The instruction's preservation rules for branch protection, required checks and uncommitted work are carried as standing rules in `05-IMPLEMENTATION-PLAN.md`.
