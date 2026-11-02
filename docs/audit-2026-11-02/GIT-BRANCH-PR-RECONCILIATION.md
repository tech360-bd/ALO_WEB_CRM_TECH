# 7 · GIT · BRANCH · PR RECONCILIATION

**Method:** `git` (local clone, shallow depth 2) + GitHub API via `gh` (47 PRs, 94 branch heads, 48 branch comparisons). Raw data: [`git-reconciliation.json`](git-reconciliation.json).
**Nothing was merged, reverted, deleted or force-pushed.**

---

## 1. Repository state

| Item | Value |
| --- | --- |
| Remote | `https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git` |
| Default branch | `main` |
| Audited branch | `arena/ececf40c-alo-web-crm-tech` @ `7e4c3922` |
| Base of audited branch | `main` @ `1e30e812` |
| Working tree | clean |
| Local clone type | **shallow (depth = 2)** — deep history is not present locally; branch comparisons used the GitHub API instead |
| Remote branches | **94** (`arena/` 67, `codex/` 14, `fix/` 4, `integration/` 3, `imports/` 2, `revert-*` 1, `repair/` 1, `other-ai-builder` 1, `main`) |
| Pull requests | **47** — **46 merged**, 1 closed-unmerged, **0 open** |

---

## 2. Unmerged work — definitive result

48 remote branches have no merged PR. Each was compared to `main` through the GitHub compare API:

| Result | Branches | Meaning |
| --- | --- | --- |
| **`ahead_by = 0`** | **47** | Branch content is **fully contained in `main`** — stale pointers left over from merged work. Nothing is lost. |
| **`ahead_by = 1`** | **1** — `arena/ececf40c-alo-web-crm-tech` | The current session branch (see §3) |
| `ahead_by > 1` | 0 | — |

**Conclusion:** there is **no hidden feature work on any other branch**. The only unmerged code in the repository is this session's single commit. No reconciliation merge is required; the 47 stale branches can be pruned after approval (housekeeping only).

Branch families audited: `arena/*-alo-education-z-ai` (26), `arena/*-alo-web-crm-tech` (41), `codex/*` (14), `fix/*` (4), `integration/*` (3), `imports/*` (2), plus singles.

---

## 3. Commit `7e4c3922` — reviewed as requested

| Field | Value |
| --- | --- |
| SHA | `7e4c392244d06aae3f6e8bf3429ca049eea957c1` |
| Author | `tech360-bd` |
| Date | 2026-11-02 08:23 UTC |
| Subject | `fix(catalogue): approved records now pass the public gate; add visibility diagnostic` |
| Size | **5 files, +576 / −12** |
| Contained in `main`? | **No** — only on `arena/ececf40c-alo-web-crm-tech` |

Files:

| Status | File | What it does | Risk |
| --- | --- | --- | --- |
| M | `src/lib/verified-catalogue/publish.ts` | Approval now writes `status: 'active'` (was `'published_verified'`) and publishes the parent university via `coursePublicationPatch` / `universityPublicationPatch` | **Behaviour change**: more records become publicly visible after approval. Intended, matches the public gate, but must be reviewed by the owner |
| A | `tests/unit/public-catalogue-publish.test.ts` | 5 tests locking writer to reader (all pass) | None |
| A | `scripts/diagnose-public-catalogue.ts` | Read-only funnel report; `--apply` repairs `published_verified` → `active`; `--normalize-verification` is opt-in | **`--apply` writes to the database** — must not be run against production without approval |
| M | `package.json` | Adds `catalogue:diagnose` script | None |
| A | `docs/PUBLIC-CATALOGUE-VISIBILITY.md` | Documents the gate and the vocabulary problem | None |

Verification performed: the 5 new tests pass; the 5 pre-existing catalogue suites pass (67 tests); ESLint clean; the excluded route is Super-Admin-only and re-resolves the actor from the database.

**Disposition:** keep, review, or revert on request. It is **not** merged and **not** deployed. Its value is independent of the catalogue project (it fixes a real publication bug), so it can either be merged on its own or dropped.

---

## 4. Drift against prior audits

| Prior artefact | Then | Now | Delta |
| --- | --- | --- | --- |
| `AUDIT/ARENA-ROUTE-INVENTORY.csv` | 818 routes | 1,099 route files | **+281 added, 0 removed** (no regressions detected) |
| `AUDIT/ARENA_FILE_MERGE_MANIFEST.csv` | 5,287 rows | 9,789 inspected files | Manifest covered only part of the tree |
| `AUDIT/ARENA-FINAL-FILE-MANIFEST.csv` | 104 rows | — | Small app-package manifest |
| `AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv` | 70 institutions | unchanged | Still the newest catalogue source work in the repo |

The absence of removed routes is a positive signal: recent merges appear additive.

---

## 5. Preservation rules applied in this audit

1. No `git reset`, `rebase`, `revert`, `clean`, branch deletion or force-push was executed.
2. No branch was merged; `main` was not touched.
3. The audit created **only untracked files** under `docs/audit-2026-11-02/` — they are deliberately **not committed** (instruction: prepare reports locally without committing).
4. Existing commits by other authors were not amended.

---

## 6. Recommended housekeeping (needs approval)

| Action | Reason | Risk |
| --- | --- | --- |
| Delete the 47 `ahead_by = 0` branches | Pure noise; content already in `main` | Low (recoverable from `main`; tag first) |
| Tag `main` as `pre-catalogue-audit-2026-11-02` | Restore point before any catalogue work | None |
| Decide on `7e4c3922` | It is the only unmerged code | Owner decision |
| Delete `alo-education-web-crm-final/` and `imports/*/node_modules` | 385 MB + 867 MB | Needs explicit approval; history rewrite **not** proposed |
