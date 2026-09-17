# ALO Education — CI/CD System: Workflow Inventory, Secrets Checklist, Runbook

**Date:** 2026-09-17 · **Repository:** `engralaminn-collab/alo_education_z....ai` (private, default branch `main`)
**Production target:** `aloeducation.com` → PM2 `alo-education` → port **3044**, deploy dir `/root/alo-github-main`
(auto-detected on the VPS: live PM2 `exec cwd` wins, then remote-matching checkout, then the intended dir).
**Protected, never touched:** `learn.aloeducation.com` → PM2 `alo-learning-journey` → port **3017**.

> **LIVE STATUS (2026-09-17): all four workflows are INSTALLED in `.github/workflows/` and ACTIVE
> on GitHub** (ids: CI 360057612 · deploy 356862745 · recovery 360076097 · monitor 360076098).
> CI ran **green** on a real runner: run `35161864642` (all steps pass, PR #11 check pass, merged
> to `main` = `d425d458cbf4`). The production gate executed for real (run `35162872547`) and
> failed fast **by design**: repository variable `DEPLOY_HOST_SSH_FINGERPRINT` is missing —
> the single outstanding owner action before the first supervised deployment
> (recipe: `ssh-keyscan -p <DEPLOY_PORT> <DEPLOY_HOST> | ssh-keygen -lf -`, verify out-of-band).
> Evidence chain: `docs/CICD_REPAIR_REPORT_2026-09-17.md` (ADDENDUM 2026-09-17) and
> `docs/workflows-ready/README.md`.

---

## 1. Why this document exists — the 29 failed runs

All 29 historical runs of `deploy-production.yml` (2026-09-13 → 2026-09-16) failed. Evidence-backed root causes:

| Class | Runs | Evidence | Root cause |
|---|---|---|---|
| **A — invalid workflow file** (0s, no jobs) | From `Update deploy-production.yml` (run `34933688496`, 09-15 05:40) through run `35045477181` (main @ `f97a5ec`) | `gh run view` → "This run likely failed because of a workflow file issue"; `git show f97a5ec:.github/workflows/deploy-production.yml` = **25-line fragment** starting mid-step (`- name: Verify deployment secrets`) with no `name:`/`on:`/`jobs:` | The workflow file was truncated/corrupted in the repo — GitHub could not parse it, so every push (including docs-only commits) produced an instant failure |
| **B — deploy-step failure** (~10–12s, job ran) | Runs `34733218541` … `34918884227` | Annotations: `Unexpected input(s) 'script_stop'` (invalid for `appleboy/ssh-action` v1.x) and `'/usr/bin/git' failed with exit code 128`; old workflow (fetched at headSha `3b73e66`) did `cd /root/alo-live` + bare `git fetch origin` + health checks against port **3025** | (1) VPS `git fetch` cannot authenticate — the repo is **private** and the VPS holds no credentials → git exit 128; (2) invalid action input; (3) wrong directory and wrong port; (4) no CI gate, no host-key pinning, no backup/rollback, deploys a moving branch ref, builds inside the live directory |

Cross-cutting flaw: **every** push to main — including documentation-only commits — attempted a production deployment with zero validation.

## 2. Workflow inventory (current)

| File | Purpose | Triggers | Jobs | Can deploy? | Secrets needed | Success condition |
|---|---|---|---|---|---|---|
| `.github/workflows/ci.yml` | PR quality gate: lockfile install, secret-leak scan, prisma validate/generate, lint, typecheck, **blocking** tests, production build with dummy env | `pull_request` → main; `workflow_dispatch` | `quality-gates` | **No** | **None** (fork-PR safe) | Job conclusion = success |
| `.github/workflows/deploy-production.yml` | Validate exact SHA on runner (same gates, blocking tests) → SSH-deploy that exact SHA → health checks → auto-rollback on failure | `push` → main (docs-only paths ignored); `workflow_dispatch` (ref + skip_migrations); `workflow_call` (from recovery) | `validate-and-build` → `deploy` (environment `production`) | **Yes** | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT` (optional), var `DEPLOY_HOST_SSH_FINGERPRINT`, built-in `GITHUB_TOKEN` (read) | Deploy summary shows exact SHA; local `/api/health` 200; port 3044 listening; protected 3017 untouched |
| `.github/workflows/deploy-recovery.yml` | Operator recovery: redeploy an exact 40-hex-char SHA through the same protected pipeline | `workflow_dispatch` only | `validate-input` → `recover` (calls deploy-production) | **Yes (via the same gated pipeline)** | Inherits (same as deploy) | Input validation + target summary + called pipeline success |
| `.github/workflows/health-monitor.yml` | Daily public HTTPS health of production (incl. DB-connectivity flag from `/api/health`) + isolation check of learn subdomain; weekly (Mon) lockfile dependency audit (blocks on critical, warns on high) | `schedule` 03:30 UTC daily; `workflow_dispatch` | `production-health`, `dependency-audit` | No | None | Health job green; audit green unless critical |

Design rules enforced across the system:
- **No duplicate gates:** main-push validation lives inside `deploy-production.yml` (it validates the exact release commit); `ci.yml` covers PRs only — the same checks are never run twice per event.
- **No deploy loops:** CI has no deploy capability; deploy only triggers from `main`/dispatch/call; recovery shares the deploy concurrency group so a recovery can never race a normal deploy (`cancel-in-progress: false` everywhere in production paths).
- **Exact-SHA everywhere:** the runner resolves and validates the SHA; the VPS checks out that SHA and hard-fails if `HEAD != requested SHA`.
- **Host-key pinning:** `fingerprint: ${{ vars.DEPLOY_HOST_SSH_FINGERPRINT }}` on every SSH step; the gate job fails early if the variable is missing or malformed. Host-key checking is never disabled and no insecure cipher is ever requested.
- **Private-repo fetch fix:** the VPS fetches using the workflow's ephemeral `GITHUB_TOKEN` through an inline `credential.helper` — the token is never written to `.git/config`, never appears in a remote URL, is unset immediately after the fetch, and is auto-masked in logs.
- **Migrations:** `skip_migrations` defaults to `true`. Applying migrations is an explicit operator opt-in and must be preceded by the backup/review gate in `docs/db/2026-09-16-employee-document-version/README.md`. **Seeds never run automatically.** The legacy `deploy/ubuntu/deploy.sh` uses `prisma db push --accept-data-loss` — do not run it; the workflow never does.
- **Rollback:** on any deploy-step failure, a bounded rollback step redeploys the previous commit (recorded in `.deploy-prev-commit` before checkout), rebuilds, restarts, re-checks health, and preserves the failed attempt's PM2 logs in `storage/logs/failed-deploy-*.log`. If the previous commit is unknown, it refuses to guess and directs to the `.deploy-backup-*` snapshots.

## 3. Required GitHub configuration checklist (names only — never values)

Set under **Settings → Secrets and variables → Actions** (repository level, unless noted):

| Name | Type | Used by | How to create / rotate safely |
|---|---|---|---|
| `DEPLOY_HOST` | Secret | deploy-production, recovery | VPS hostname/IP. Rotate by updating the secret; never echo in scripts. |
| `DEPLOY_USER` | Secret | deploy-production, recovery | SSH user (currently root-based layout). Prefer a dedicated deploy user with sudo limits when possible. |
| `DEPLOY_SSH_KEY` | Secret | deploy-production, recovery | **Private** key of a dedicated deploy keypair (least privilege — not a personal account key, never a password). Generate: `ssh-keygen -t ed25519 -C "alo-gha-deploy"`. Put the **public** half in the VPS `~/.ssh/authorized_keys`; paste the private half into the secret. Rotate: new keypair → update `authorized_keys` → update secret → remove old pub key. |
| `DEPLOY_PORT` | Secret (optional) | deploy-production, recovery | SSH port if not 22. Absent → 22. |
| `DEPLOY_HOST_SSH_FINGERPRINT` | **Variable** (non-sensitive) | deploy-production, recovery | On any machine that has already connected to the VPS over a trusted network: `ssh-keyscan -p <PORT> <HOST> | ssh-keygen -lf -` → copy the **ed25519** line's `SHA256:...` value. Verify it matches the host you expect **before** saving (TOFU). |
| `production` Environment | Environment | deploy-production | Settings → Environments → New `production`. Optionally add **Required reviewers** for manual approval and restrict deployment branches to `main`. |
| Branch protection on `main` | Repo setting | process | Require PR + the `CI — Pull Request Validation` check before merge; prohibit force-pushes. |

Built-in `GITHUB_TOKEN` is used with `permissions: contents: read` only (VPS fetch + checkout). No third-party tokens are stored anywhere.

## 4. Pinned third-party actions (reviewed, immutable SHAs)

| Action | Version | Pinned SHA | Inputs verified against the action's own `action.yml` at that SHA |
|---|---|---|---|
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `ref`, `fetch-depth` ✓ |
| `actions/setup-node` | v7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` | `node-version`, `cache`, `cache-dependency-path` ✓ |
| `appleboy/ssh-action` | v1.2.5 | `0ff4204d59e8e51228ff73bce53f80d53301dee2` | `host`, `username`, `key`, `port`, `fingerprint`, `envs`, `command_timeout`, `script` ✓ (`script_stop` is **not** an input in v1.x — the historical failure) |

## 5. Operator runbooks

**Normal release:** merge a PR into `main` (CI must be green) → the push runs validate-and-build → deploy. Watch the run; success = "Deployment Summary" block with the exact SHA + health output.

**Recovery:** Actions → *Recovery — Deploy Exact Commit* → Run workflow → paste the full 40-char SHA (from `.deploy_history.log` on the VPS or GitHub history) → choose `skip_migrations` (keep true) → run. The same gates, environment protection, and rollback apply.

**Failed deploy:** the rollback step fires automatically; check its output. If it reports "MANUAL INTERVENTION REQUIRED", SSH in and use the newest `.deploy-backup-<timestamp>-<sha>` directory (contains `.env.backup`, `storage`, `uploads`, `ecosystem.config.cjs`) plus `git checkout <prev>` recorded in `.deploy-prev-commit`.

**Health alarm:** the daily monitor failing means production is down/degraded between deploys — check the run's annotations, then `pm2 logs alo-education` on the VPS and `/api/health`'s `database.connected` flag.

**Adding a DB migration:** never automatic. Follow `docs/db/2026-09-16-employee-document-version/README.md` (backup + verify + review + rollback plan), then dispatch the deploy with `skip_migrations=false` only for that run.
