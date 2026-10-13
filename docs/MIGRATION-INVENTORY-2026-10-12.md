# ALO Education — Repository Migration Inventory (2026-10-12)

Old source repository : `engralaminn-collab/alo_education_z....ai` (private)
New destination       : `tech360-bd/ALO_WEB_CRM_TECH` (public) — **single source of truth from this date**
Production            : https://aloeducation.com (Hostinger, branch `main`)

Status vocabulary: PASS / FAIL / BLOCKED / NOT VERIFIED. Nothing below is assumed.

---

## 1. What was actually migrated

| Item | Evidence | Status |
| --- | --- | --- |
| Full git history | 428 commits on `main`, first commit `29170280` 2026-07-18 by `engralaminn-collab`; authors preserved (326 engralaminn-collab, 57 alaminiubateee969-cmd, Arena/Codex/AutoCoder bots) | PASS — complete mirror, not a re-upload |
| All branches | 49 remote branches incl. every `arena/*-alo-education-z-ai`, `codex/*`, `fix/*`, `repair/*` branch | PASS |
| Only branch not merged into `main` | `other-ai-builder-2026-09-13` (1 commit, **no merge base** — an unrelated "other AI builder" source dump kept for comparison, 2026-09-13) | Intentionally excluded from `main`; keep as reference or delete after review |
| Direct diff old → new | Old repo returns **404** for the connected account (deleted, renamed, or access revoked) | BLOCKED — cannot be re-diffed; history evidence above is the proof of completeness |
| Tracked secrets | `.env.example` / `.env.production.example` only (placeholders); no `.env`, `.pem`, `.key` tracked; CI secret scan green after fixture fix | PASS (tracked files). Git **history** was never purged — see §4 |

Conclusion: the new repository is **not** missing old code. Migration of source is complete; what was broken was CI, caused by merge conflicts resolved badly inside the new repository (PRs #1–#4).

---

## 2. Confidentiality

The old repository was private; the new one is **public**. The code base contains the complete CRM, AI-agent, payment and portal implementation. Public visibility is a business decision that must be confirmed explicitly:

- If confidentiality is required → owner (`tech360-bd`, admin) must set *Settings → General → Danger zone → Change visibility → Private*.
- Trade-off: private repositories have a **2,000 free Actions minutes/month** cap on the Free plan (public repos are unmetered on standard runners). Each full CI run here uses ~2 jobs × ~25 min ≈ 50 min, i.e. ~40 runs/month before Actions stops — the same class of blocker that killed CI on the old account. Options if private: GitHub Pro/Team (paid — needs authorisation), fewer CI triggers, or a self-hosted runner.

Decision required: **BLOCKED — owner approval**.

---

## 3. GitHub Actions billing — evidence

| Repository | Evidence | Verdict |
| --- | --- | --- |
| Old (`engralaminn-collab`) | Commit `7b31d840` (2026-10-09) documents PR #48 checks concluding in 2 s with empty `steps[]` and the annotation *"The job was not started because recent account payments have failed or your spending limit needs to be increased"* (89/100 runs). | **Billing-blocked** (account-level payment failure on `engralaminn-collab`). |
| New (`tech360-bd`) | Runs 38267839931 / 38271073220: both jobs start, execute 23 and 16 steps respectively, run ~100 s–25 min on GitHub-hosted `ubuntu-latest`. Step-level pass/fail is visible. | **Not billing-blocked.** Public repo ⇒ unmetered standard-runner minutes. Failures are code. |
| Hostinger subscription | Not reachable from this environment. | NOT VERIFIED |
| AI Builder credits | Not applicable to GitHub CI. | n/a |
| GitHub API rate limit | None hit during this work. | PASS |

Nothing was purchased, upgraded or configured for billing.

---

## 4. Residual security items (owner action)

1. Commit `7b31d840`'s own notes state a real production DB password previously lived in `OPERATIONS-BOOK.md` / `documentation/CPANEL-DEPLOYMENT-GUIDE.md`. It was removed from tracked files, **but git history still contains it and the repository is now public.** That credential must be considered compromised and rotated on Hostinger if it has not already been. Verify: NOT VERIFIED from here.
2. 89 files still reference the old repository name (docs, runbooks). Update after the Hostinger cutover is approved (see `docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md` §1–2, which currently names the old repo).
