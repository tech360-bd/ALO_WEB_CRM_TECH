# Ready-to-install GitHub workflows (repaired CI/CD system)

**Why this folder exists:** the session's GitHub App token is refused pushes that create or
update `.github/workflows/*` ("refusing to allow a GitHub App to create or update workflow …
without `workflows` permission"). The four repaired workflow files are therefore delivered here
so a repository admin can install them in one step. This mirrors the pattern previously used in
this repository (`docs/DEPLOY_PRODUCTION_WORKFLOW_READY.yml`, which is now **superseded** by
`deploy-production.yml` in this folder — do not install the old one).

## Files

| File | Install as | Purpose |
|---|---|---|
| `ci.yml` | `.github/workflows/ci.yml` | PR quality gate (lint, typecheck, blocking tests, prisma validate, build). No deploy capability, no secrets — fork-PR safe. |
| `deploy-production.yml` | `.github/workflows/deploy-production.yml` (**replaces the current broken 25-line fragment on main**) | Validate exact SHA on runner → SSH deploy that SHA to the VPS (PM2 `alo-education`, port 3044) → health checks → automatic bounded rollback on failure. Protects `learn.aloeducation.com` / port 3017 / `alo-learning-journey`. |
| `deploy-recovery.yml` | `.github/workflows/deploy-recovery.yml` | Manual recovery: redeploy an exact 40-hex-char commit SHA through the same protected pipeline. |
| `health-monitor.yml` | `.github/workflows/health-monitor.yml` | Daily public health checks of production + weekly (Monday) dependency audit. |

## Install (repository admin, on a machine with push rights)

```bash
git checkout main && git pull
mkdir -p .github/workflows
cp docs/workflows-ready/ci.yml \
   docs/workflows-ready/deploy-production.yml \
   docs/workflows-ready/deploy-recovery.yml \
   docs/workflows-ready/health-monitor.yml \
   .github/workflows/
git add .github/workflows && git commit -m "ci: install repaired four-workflow delivery pipeline (from docs/workflows-ready)" && git push
```

Or, if this branch is merged via PR after the workflows permission is granted (see below), the
files under `.github/workflows/` on this branch are already the same content — the copies in this
folder can then be deleted in a follow-up.

## Required configuration before the first deploy run (names only, never values)

1. Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (dedicated ed25519 deploy key —
   least privilege), optional `DEPLOY_PORT`.
2. Variable: `DEPLOY_HOST_SSH_FINGERPRINT` — create with
   `ssh-keyscan -p <PORT> <HOST> | ssh-keygen -lf -` (use the ed25519 `SHA256:...` value;
   verify it out-of-band before trusting it).
3. Environment `production` (optionally with required reviewers).
4. Branch protection on `main`: require PR + the "CI — Pull Request Validation" check.

Full checklist with rotation steps: `docs/CICD_WORKFLOWS.md` §3.
Evidence for why the old pipeline failed 29/29: `docs/CICD_REPAIR_REPORT_2026-09-17.md`.

## Alternative: unblock automated delivery

Grant the Arena GitHub App installation **Workflows: Read & write** for this repository
(repo Settings → GitHub Apps → configure the Arena app → Repository permissions), then the
session branch can be pushed and merged normally — no manual copying needed.
