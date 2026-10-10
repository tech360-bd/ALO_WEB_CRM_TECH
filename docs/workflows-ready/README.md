> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

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
| 2026-09-16 23:34 | PR #11 merged → `main` = `d425d458cbf4` (broken 25-line fragment replaced) | Run `35162872547` — real jobs; the **validate-and-build gate was 100% GREEN** (config presence check passed: `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY` + `DEPLOY_HOST_SSH_FINGERPRINT` all present); the **deploy job then FAILED inside `Deploy via SSH`**, and the automatic rollback step failed identically — the SSH connect/auth/host-key layer itself is the problem (corrected 2026-09-17 from the jobs API; an earlier version of this table wrongly described the gate as the failing step) |

The "0 jobs / workflow file issue" loop is **destroyed**: since the fragment's replacement, every
push creates real, named jobs; the 4 junk startup-failure runs (e.g. `35141310858`) were the
fragment's last gasps.

## Outstanding items after the 2026-09-17 audit (owner actions)

1. **SSH deploy path is failing at the connection/authentication layer.** Runs `35162872547`
   (23:34 UTC) and `35176144484` (dispatch, 02:54 UTC 09-17) both had a green gate and both
   failed at `Deploy via SSH`, with rollback failing identically → production was most likely
   never reached (nothing modified). Raw step logs are no longer downloadable from the audit
   environment (Azure-blob endpoint unreachable) — the classification evidence is the jobs API
   step list. Required: VPS console verification of the real SSH port, sshd state, firewall,
   the deploy user's `authorized_keys`, and the host key — full runbook:
   `../VPS_INCIDENT_RUNBOOK_2026-09-17.md`.
2. **Production is unhealthy**: monitor run `35201979705` (08:51 UTC 09-17) failed its public
   HTTPS checks and HTTP 502 was observed at 19:45:40 UTC — the app behind the reverse proxy is
   down/degraded. Same runbook.
3. **`DEPLOY_PORT` is now REQUIRED** (policy change 2026-09-17): add it as a repository secret
   with the verified SSH port; missing/non-numeric/out-of-range values are rejected by the gate
   with actionable errors, and a TCP preflight step now classifies DNS/refused/filtered/open
   before any authentication is attempted.
4. **`DEPLOY_HOST_SSH_FINGERPRINT`** must still match the host key verified out-of-band
   (`ssh-keyscan -p <DEPLOY_PORT> <DEPLOY_HOST> | ssh-keygen -lf -`, ed25519 line, `SHA256:...`)
   — never trust-on-first-use. (Its presence at gate time is proven by runs `35162872547` /
   `35176144484`; its correctness against the REAL host key is exactly what the failing SSH
   steps demand re-verifying.)

Full checklist, rotation steps and runbooks: `../CICD_WORKFLOWS.md`.
Forensics of the original 29 failures: `../CICD_REPAIR_REPORT_2026-09-17.md`.

*Historical note: `docs/DEPLOY_PRODUCTION_WORKFLOW_READY.yml` (an earlier single-file proposal,
never installed) and the interim `docs/workflows-ready/*.yml` copies were deleted on 2026-09-17
to prevent competing workflow versions. `docs/patches/WORKFLOW_3044_FIX.patch` is kept as
historical reference only.*
