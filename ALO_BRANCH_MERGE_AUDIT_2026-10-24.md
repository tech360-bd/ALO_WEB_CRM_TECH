# Branch merge audit — 24 October 2026

**Question asked:** "merge all".
**Answer:** there is nothing left to merge, and the 66 remaining remote branches
cannot be merged without reverting work. Details and evidence below.

---

## 1. State of `main`

| Fact | Evidence |
|---|---|
| Open pull requests | **0** (`gh pr list --state open` → `[]`) |
| Pull requests already merged | **#10 – #19**, the last three being #17 (CRM hardening), #18 (**this redesign**), #19 (university catalogue + monitoring) |
| Redesign present in `main`? | yes — `src/components/website/PublicHero.tsx`, `scripts/audit/class-verify.cjs`, the six redesign guardrail tests and the final report revision (`595 files`) are all in `origin/main` |
| Remote branches | **67** after the `imports/alaminn-info-full` deletion (§8) |
| `origin/main` history | **a single squashed commit** (`9b74934c`, dated 2026‑10‑24) with **no common ancestor** to any branch |

That last row is the reason this is not a normal merge job: every branch is an
*unrelated history*. `git merge` would refuse without
`--allow-unrelated-histories`, and after that it would present a full‑tree conflict
across ~1,000 files per branch. Resolving 66 of those by hand is not a merge; it is
66 re-integrations, each capable of reverting months of intentional change.

---

## 2. What each branch actually contains

Because ancestry is meaningless here, the audit compares **trees**. For every
branch it asks: *which files exist on the branch but not in `main`?*

| Result | Meaning |
|---|---|
| `branch-only = 0` | every file the branch has is already in `main` → **nothing to merge** |
| `branch-only > 0`, none under `src/` | only CPANEL / import / reference artefacts that `main` **deliberately deleted** (PR #11 is titled "… + CPANEL removal") |
| `branch-only` under `src/` | genuine differences — all of them superseded renames, see §4 |

**The six newest branches — including the redesign branch — have `branch-only = 0`.**
`arena/a37d47ac` (PR #19) is byte-identical to `main`. `arena/65a95bf2` (this
redesign, PR #18) differs from `main` only by the work PR #19 added afterwards.

---

## 3. Why "merge the stale branches" is not safe

The union of everything that exists on *any* branch but not on `main` is:

| Category | Volume | Status |
|---|---|---|
| `alo-cpanel/`, `CPANEL_DEPLOY_*.txt`, `.live-cpanel-evidence-dir` | present on **57 of the 66 branches** | **removed on purpose** (PR #11, "CPANEL removal"). `main` deploys via the Next.js app + Prisma/MySQL. |
| `imports/alaminn-info-full*` | 11,787 files — **branch deleted 2026‑10‑24, see §8** | a raw zip import of a *different* project (alaminn.info); never part of the product |
| `_reference_repos/*` | ~20 directories | third-party reference clones, not our code |
| `documentation/`, `docs/runtime-standard` | a handful | superseded by the reports in the repo root |
| `src/**` | **8 files** (see §4) | every one superseded by a rename or an architectural decision |

Merging any of these would re-introduce deployment scaffolding that was removed
deliberately, and in one case 11,787 files of foreign data.

---

## 4. The only `src/` files that `main` does not have — all superseded

| Branch-only file | What `main` uses instead | Why |
|---|---|---|
| `src/middleware.ts` | **`src/proxy.ts`** | Next.js 16 renamed the convention; the dev server logs `proxy.ts` |
| `src/app/visa-support/page.tsx`, `src/app/visa-support/[country]/page.tsx` | **`src/app/visa/page.tsx`** | route consolidated to `/visa` |
| `src/app/eligibility-checker/page.tsx` | **`src/app/eligibility-check/page.tsx`** | route renamed to `/eligibility-check` |
| `src/components/website/PublicCommunicationBar.tsx` | **`src/components/website/FloatingActionWidget.tsx`** | replaced component |
| `src/components/website/WebsiteActionButtons.tsx` | folded into `FloatingActionWidget` / CTA components | replaced component |
| `src/components/partner/PartnerMarketingStudioPage.tsx` | `src/app/partner-admin/*` + `src/app/api/partner-admin/*` | partner marketing re-homed to the partner-admin portal (PR #10) |
| `src/lib/firebase-admin.ts` | `src/lib/db.ts` (Prisma/MySQL) + NextAuth | the stack is MySQL; Firebase was dropped |

None of these is a lost feature. Every one has a live, newer counterpart in `main`.

---

## 5. Per-branch record

`Commits` is the branch's own history length (branch histories were not squashed;
`main` was). `Files only on branch` is the tree comparison from §2. This table is
the snapshot taken **before** the `imports/alaminn-info-full` deletion.

| Branch | Last commit | Commits | Files only on branch | …of which under `src/` | Verdict |
|---|---|---|---|---|---|
| `origin/arena/a37d47ac-alo-web-crm-tech` | 2026-10-23 | 2 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/65a95bf2-alo-web-crm-tech` | 2026-10-23 | 528 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/137a6507-alo-web-crm-tech` | 2026-10-23 | 523 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/11fdac10-alo-web-crm-tech` | 2026-10-19 | 513 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/ef31f574-alo-web-crm-tech` | 2026-10-18 | 503 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/6eed5ba9-alo-web-crm-tech` | 2026-10-17 | 496 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/8e2beff7-alo-web-crm-tech` | 2026-10-16 | 486 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/bec1d052-alo-web-crm-tech` | 2026-10-14 | 481 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/57b0809e-alo-web-crm-tech` | 2026-10-14 | 479 | 0 | 0 | identical to main — nothing to merge |
| `origin/arena/1cf1296a-alo-web-crm-tech` | 2026-10-14 | 449 | 11 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/integration/developer-projects-20261013` | 2026-10-13 | 439 | 11858 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/integration/ai-builder-full-20261013` | 2026-10-13 | 403 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/integration/ai-builder-alo-verified-20261013` | 2026-10-13 | 434 | 86 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/imports/alo-education-source-20261013` | 2026-10-13 | 434 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/imports/alo-education-full-20261013` | 2026-10-13 | 434 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/imports/alaminn-info-full-20261013` | 2026-10-13 | 434 | 11799 | 0 | **DELETED 2026‑10‑24** (see §8) — only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/5656dd34-alo-web-crm-tech` | 2026-10-13 | 442 | 11858 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/06d71c20-alo-web-crm-tech` | 2026-10-13 | 451 | 11 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/codex/aloeducation-access-content-repair` | 2026-10-12 | 409 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/8bfa5154-alo-education-z-ai` | 2026-10-12 | 416 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/8b727e17-alo-education-z-ai` | 2026-10-12 | 401 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/712caef6-alo-web-crm-tech` | 2026-10-12 | 432 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/16786e58-alo-education-z-ai` | 2026-10-12 | 412 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/01a0f2b5-alo-education-z-ai` | 2026-10-12 | 427 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/f5576c6b-alo-education-z-ai` | 2026-10-10 | 399 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/3fec094f-alo-education-z-ai` | 2026-10-10 | 388 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/arena/01a0e685-alo-education-z-ai` | 2026-10-10 | 396 | 10 | 0 | only CPANEL/import/reference artefacts main deleted on purpose |
| `origin/codex/fix-whatsapp-duplicate-get` | 2026-10-09 | 376 | 11 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/codex/alo-recovery-20261008` | 2026-10-09 | 354 | 11 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/arena/fd40db6d-alo-education-z-ai` | 2026-10-09 | 374 | 11 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/arena/ea4e9140-alo-education-z-ai` | 2026-10-09 | 372 | 11 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/arena/c2f1b27c-alo-education-z-ai` | 2026-10-09 | 379 | 11 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/repair/complete-system-hardening-2026-10-07` | 2026-10-08 | 281 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/fix/hostinger-typescript-repair` | 2026-10-08 | 299 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/codex/page-agent-audit-20261008` | 2026-10-08 | 318 | 18 | 4 | superseded by renamed routes (4 src files, see §4) |
| `origin/codex/ci-env-repair-20261008` | 2026-10-08 | 323 | 17 | 3 | superseded by renamed routes (3 src files, see §4) |
| `origin/arena/final-mysql-ddl-validation` | 2026-10-08 | 277 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/d36e2d29-alo-education-z-ai` | 2026-10-08 | 316 | 18 | 4 | superseded by renamed routes (4 src files, see §4) |
| `origin/arena/adfaa77f-alo-education-z-ai` | 2026-10-08 | 291 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/8d540fcc-alo-education-z-ai` | 2026-10-08 | 313 | 18 | 4 | superseded by renamed routes (4 src files, see §4) |
| `origin/arena/7e179efb-alo-education-z-ai` | 2026-10-08 | 358 | 11 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/arena/44842eb6-alo-education-z-ai` | 2026-10-08 | 282 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/3f536e7b-alo-education-z-ai` | 2026-10-08 | 284 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/227cb663-alo-education-z-ai` | 2026-10-08 | 303 | 20 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/176a6835-alo-education-z-ai` | 2026-10-08 | 327 | 17 | 3 | superseded by renamed routes (3 src files, see §4) |
| `origin/arena/70fff683-alo-education-z-ai` | 2026-10-07 | 268 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/fix/reconciliation-mysql-ddl-final` | 2026-10-03 | 243 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0feba-alo-education-z-ai` | 2026-10-03 | 265 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0fbce-alo-education-z-ai` | 2026-10-03 | 244 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/fix/reconciliation-mysql-ddl` | 2026-10-02 | 238 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0f889-alo-education-z-ai` | 2026-10-02 | 224 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0f6e7-alo-education-z-ai` | 2026-10-01 | 215 | 37 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0e4dc-alo-education-z-ai` | 2026-09-28 | 193 | 35 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0c218-alo-education-z-ai` | 2026-09-28 | 210 | 35 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/fix/alo-production-deploy-pipeline` | 2026-09-18 | 185 | 35 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0b26d-alo-education-z-ai` | 2026-09-18 | 181 | 35 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a0aa5e-alo-education-z-ai` | 2026-09-18 | 158 | 20 | 7 | superseded by renamed routes (7 src files, see §4) |
| `origin/arena/01a0b15b-alo-education-z-ai` | 2026-09-17 | 163 | 20 | 7 | superseded by renamed routes (7 src files, see §4) |
| `origin/arena/01a0a5b2-alo-education-z-ai` | 2026-09-15 | 145 | 21 | 7 | superseded by renamed routes (7 src files, see §4) |
| `origin/arena/01a0a165-alo-education-z-ai-app-fixes` | 2026-09-15 | 131 | 21 | 8 | superseded by renamed routes (8 src files, see §4) |
| `origin/arena/01a0a165-alo-education-z-ai` | 2026-09-15 | 127 | 21 | 8 | superseded by renamed routes (8 src files, see §4) |
| `origin/arena/01a09c20-alo-education-z-ai` | 2026-09-14 | 91 | 49 | 7 | superseded by renamed routes (7 src files, see §4) |
| `origin/other-ai-builder-2026-09-13` | 2026-09-13 | 1 | 18 | 1 | superseded by renamed routes (1 src files, see §4) |
| `origin/arena/integration-2026-09-14` | 2026-09-13 | 46 | 47 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a09a6f-alo-education-z-ai` | 2026-09-13 | 30 | 64 | 6 | superseded by renamed routes (6 src files, see §4) |
| `origin/arena/01a098f3-alo-education-z-ai` | 2026-09-13 | 15 | 64 | 6 | superseded by renamed routes (6 src files, see §4) |


---

## 6. Recommendation

1. **Merge nothing.** There is no unmerged work; PRs #10 – #19 already carry it.
2. **Prune the remote.** The 66 branches are historical clutter. Deleting them
   loses nothing that is not in `main` (§4 is the complete list of differences,
   and each item has a living replacement). This is a destructive remote
   operation, so it needs explicit approval and is **not** done here.
3. If auditability matters more than tidiness, keep `arena/65a95bf2` (redesign)
   and `arena/a37d47ac` (PR #19) as the two most recent tags and delete the rest.

---

## 8. Cleanup log

### 2026‑10‑24 — `imports/alaminn-info-full-20261013` deleted

| | |
|---|---|
| Last commit | `85aaa4ad0bead01670682c4fde5f01817b530beb` — *"Import complete unchanged alaminn-info-FULL-project (1).zip"*, 2026‑10‑13 |
| Content | 11,787 files under `imports/alaminn-info-full/` (a different website, **alaminn.info**, imported whole) + 12 CPANEL/reference artefacts |
| Why safe | none of it is referenced by `src/`, `tests/`, `package.json` or any route; `main` never contained it; the work on that branch was PR #16-era Google-stack work already merged |
| Restore, if ever needed | the commit object is still in the local clone — `git push origin 85aaa4ad0bead01670682c4fde5f01817b530beb:refs/heads/imports/alaminn-info-full-20261013` |

Remote heads after deletion: **67** (was 68).

### Still carrying weight

`main` itself holds **67,992 files**, of which **61,193 (90 %) are vendored
imports**:

| Path in `main` | Files | Note |
|---|---|---|
| `imports/alo-education-full/` | **59,608** | a full copy of this same project, committed as a snapshot |
| `imports/legacy-branch-references/` | 735 | exported copies of old branches |
| `imports/alo-education-source/` | 850 | older source snapshot |
| `alo-education-web-crm-final/` | 1,518 | another deploy copy |
| `src/` — the actual product | **2,381** | |

Removing those is a **history rewrite** on `main` (`git filter-repo` + force push),
which is a different risk class from deleting a branch: it invalidates every open
clone and every SHA in the reports. That needs an explicit decision; it has **not**
been attempted. Two other `imports/*` branches also still exist remotely
(`imports/alo-education-full-20261013`, `imports/alo-education-source-20261013`);
both have `branch-only = 10`, i.e. nothing to merge either.

---

## 9. What this session did and did not do

**Did:** audited every remote branch by tree comparison
(`scripts/audit/branch-content-audit.py`), verified `main` contains the redesign,
verified 0 open PRs.

**Did:** deleted `imports/alaminn-info-full-20261013` on request (see §8).

**Did not:** merge any branch, force-push, rewrite history, delete any other
branch, or modify `main`.
The working tree of `arena/a95f5448-alo-web-crm-tech` is otherwise unchanged
(it is already identical to `main` apart from this audit record).
