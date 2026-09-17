# Workflows: canonical location = `.github/workflows/` (INSTALLED & ACTIVE)

**Status (2026-09-17): the repaired CI/CD system is installed, recognized by GitHub, and has
executed real jobs. This folder no longer contains workflow copies** — keeping them would
maintain competing versions of the same workflows (they went stale the moment hotfixes landed).
The single source of truth:

```text
.github/workflows/ci.yml                 — "CI — Pull Request Validation"        (active, id 360057612)
.github/workflows/deploy-production.yml  — "ALO Education Production Deployment" (active, id 356862745)
.github/workflows/deploy-recovery.yml    — "Recovery — Deploy Exact Commit"      (active, id 360076097)
.github/workflows/health-monitor.yml     — "Health & Dependency Monitor"         (active, id 360076098)
```

## Activation history (real evidence, no fabrication)

| When (UTC) | Event | Evidence |
|---|---|---|
| 2026-09-16 22:51 | First real CI run after install (head `894ba68`) | Run `35159653083` — FAILED at `Prisma validate` (exit 1): clean runner has no `.env`, CLI cannot resolve `env("DATABASE_URL")` |
| 2026-09-16 23:13 | Hotfix `77c46cf` (step-scoped dummy `DATABASE_URL` for validate/generate) | Run `35161361303` — validate/generate/lint PASSED; FAILED at `Typecheck` (exit 134 = V8 heap OOM on ~7GB runner) |
| 2026-09-16 23:19 | Hotfix `29a7bab` (job-local 8G swap + `--max-old-space-size=6144`) | Run `35161864642` — **SUCCESS**, all steps green (11m48s), PR #11 check **pass** |
| 2026-09-16 23:34 | PR #11 merged → `main` = `d425d458cbf4` (broken 25-line fragment replaced) | Run `35162872547` — real jobs; gate step `Verify deployment configuration presence` **failed fast by design**: repository variable `DEPLOY_HOST_SSH_FINGERPRINT` missing → deploy job SKIPPED, production untouched |

The "0 jobs / workflow file issue" loop is **destroyed**: since the fragment's replacement, every
push creates real, named jobs; the 4 junk startup-failure runs (e.g. `35141310858`) were the
fragment's last gasps.

## The ONE outstanding configuration item (owner action)

Add repository **variable** `DEPLOY_HOST_SSH_FINGERPRINT` (the deploy gate's own error message
gives the recipe; verify the value out-of-band before trusting it — never TOFU):

```bash
ssh-keyscan -p <DEPLOY_PORT> <DEPLOY_HOST> | ssh-keygen -lf -   # use the ed25519 line: SHA256:...
```

Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` passed the gate's presence check in run
`35162872547` (only the fingerprint variable was flagged). After the variable is added, re-run
`35162872547` (or push any code change to `main`) for the first supervised deployment.

Full checklist, rotation steps and runbooks: `../CICD_WORKFLOWS.md`.
Forensics of the original 29 failures: `../CICD_REPAIR_REPORT_2026-09-17.md`.

*Historical note: `docs/DEPLOY_PRODUCTION_WORKFLOW_READY.yml` (an earlier single-file proposal,
never installed) and the interim `docs/workflows-ready/*.yml` copies were deleted on 2026-09-17
to prevent competing workflow versions. `docs/patches/WORKFLOW_3044_FIX.patch` is kept as
historical reference only.*
