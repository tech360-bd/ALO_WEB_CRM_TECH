# VPS Incident Runbook — 2026-09-17 (SSH deploy failures + public HTTP 502)

**Status at write time: production UNHEALTHY (workflow-verified at 08:51 UTC; 502 observed
manually at 19:45:40 UTC). Server console access is required to diagnose and recover — the
audit environment has no SSH key, its egress is restricted to GitHub (public probing of
`aloeducation.com` is not possible from it), and raw GitHub Actions step logs are not
downloadable from it (Azure log-storage endpoint unreachable). Everything below separates
VERIFIED facts from INFERENCE.**

## 1. Verified timeline (evidence: GitHub Actions API — run/job/step records)

| When (UTC) | Event | Run | Verified detail |
|---|---|---|---|
| 2026-09-16 23:34 | Deploy attempt on push of `d425d458cbf4` (PR #11 merge) | `35162872547` | Validate-and-build gate **fully green** (incl. config-presence check: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_HOST_SSH_FINGERPRINT` all present). `Deploy to VPS` job **failed inside `Deploy via SSH`**; the automatic rollback step **failed identically**; `Post-deploy public check (from runner)` ran (non-fatal). |
| 2026-09-17 02:54 | Deploy attempt, `workflow_dispatch` of the same SHA | `35176144484` | Identical pattern: gate green → `Deploy via SSH` failed → rollback failed identically. |
| 2026-09-17 08:51 | Scheduled Health & Dependency Monitor | `35201979705` | Job `Public production health` FAILED at `Check production endpoints` → public HTTPS health was already broken. |
| 2026-09-17 13:56 | CI dispatch on `main` | `35230323815` | CI green (code healthy; unrelated to production state). |
| 2026-09-17 19:45:40 | Manual observation (reported by owner) | — | `https://aloeducation.com/api/health` returned **HTTP 502** (bad gateway — reverse proxy reachable, upstream app not serving). |
| 2026-09-17 22:22 | PR #13 merged → `main` = `16e757c` (mandatory `DEPLOY_PORT` gate + TCP preflight) | run `35281659466` | Gate failed FAST at *Verify deployment configuration presence* with annotation **"DEPLOY_PORT is missing"**; `Deploy to VPS` job **SKIPPED** → production untouched. **This confirms the root cause of every class-C deploy failure: the `DEPLOY_PORT` secret was never set, and the old workflow silently dialed port 22** (the VPS SSH port is not 22 — historical reports record 57813). The deploy path can never silently guess the port again. |

## 2. What the evidence does and does NOT establish

**Established:**
- The deploy pipeline's code-level gates all pass; the two failures are at the SSH layer.
- Rollback failing identically in both runs means the rollback SSH session also could not
  complete — strong (not conclusive) evidence that **no deploy ever modified production** in
  these runs. Nothing was rolled back because nothing verifiably changed.
- Production was unhealthy at 08:51 UTC independent of any deployment (no deploy has ever
  succeeded — 0 successes in 31+ runs of this workflow), so the 502 is NOT deployment-caused.

**Inference → CONFIRMED ROOT CAUSE (2026-09-17 22:22 UTC):** run `35281659466`'s gate
annotations prove **`DEPLOY_PORT` was never configured**; the pre-fix workflow's
`${{ secrets.DEPLOY_PORT || 22 }}` therefore dialed **port 22** on every attempt while the
VPS's real SSH port is not 22 (historical reports consistently record **57813**). That
explains both class-C failures AND their identical rollback failures — the SSH sessions never
established, so production was never modified by any deploy run. Remaining console actions:
verify the real port, set the secret, re-verify the host fingerprint and authorized key
(§4 below).

**Unknown (not recoverable from here):** the exact stderr of the two SSH steps (raw logs
unavailable), whether `DEPLOY_PORT` was set at all at run time, current sshd/firewall state,
PM2/nginx state, why the app is down (crash loop? OOM? never started? server rebooted and PM2
not resurrected?).

## 3. Console diagnosis runbook (owner/operator, read-only first)

SSH in from a trusted machine (adjust port/user; discover the port first if unknown):

```bash
# 0. If SSH itself fails from your machine: use the hosting provider's web console.
#    Find the real SSH port:  ss -tlnp | grep -i ssh   (or: grep -E '^Port' /etc/ssh/sshd_config)
#    Confirm the host keys (needed for DEPLOY_HOST_SSH_FINGERPRINT):
for k in /etc/ssh/ssh_host_*_key.pub; do ssh-keygen -lf "$k"; done
#    Compare the ed25519 SHA256 with the GitHub variable DEPLOY_HOST_SSH_FINGERPRINT.

# 1. Identity & resources
hostname -f; whoami; uptime
free -m; df -h /root | tail -1          # OOM-killed app or full disk are common 502 causes
dmesg -T | grep -iE "oom|killed process" | tail   # evidence of OOM kills

# 2. Service state
systemctl status sshd --no-pager | head -5
pm2 list
pm2 describe alo-education | grep -E 'status|exec cwd|script path|uptime|restarts'
pm2 describe alo-learning-journey | grep -E 'status|exec cwd'   # PROTECTED service — report only
pm2 logs alo-education --lines 120 --nostream

# 3. App health from inside
curl -sS -o - -w "\nHTTP %{http_code}\n" --max-time 10 http://127.0.0.1:3044/api/health
ss -tlnp | grep -E ':3044|:3017'

# 4. Reverse proxy
nginx -t 2>&1; systemctl status nginx --no-pager | head -5   # or caddy equivalent
tail -n 40 /var/log/nginx/error.log 2>/dev/null              # look for 502 upstream reasons
grep -RE "proxy_pass|reverse_proxy" /etc/nginx/sites-enabled/ /etc/caddy/ 2>/dev/null | grep -E '3044|3017|3025'

# 5. Deploy checkout ground truth
ls -ld /root/alo-github-main-new /root/alo-github-main 2>/dev/null
for d in /root/alo-github-main-new /root/alo-github-main; do
  [ -d "$d/.git" ] && (cd "$d" && echo "== $d" && git remote get-url origin && git log --oneline -3 && cat .deployed_commit 2>/dev/null && cat .deploy_history.log 2>/dev/null | tail -5)
done
ls -la /root/alo-github-main-new/.deploy-backup-* 2>/dev/null | head
test -f /root/alo-github-main-new/.env && echo ".env present" || echo ".env MISSING"

# 6. Database reachability (read-only)
mysqladmin -h 127.0.0.1 status 2>&1 | head -2   # or via the app's DATABASE_URL host (do not print it)
```

## 4. Recovery decision tree

1. **App down, proxy fine (502):** check `pm2 logs` + `dmesg` OOM + disk full.
   - OOM/crash: `pm2 restart alo-education --update-env` and watch health.
   - Never started / server rebooted: `pm2 resurrect` or `pm2 restart ecosystem.config.cjs --update-env`
     **from the correct deploy dir** (the one `pm2 describe` reports as `exec cwd`).
   - `.env` missing: restore from `.deploy-backup-*/.env.backup` (never recreate from scratch
     without the DB credentials).
2. **ssh-scope fixes for the deploy pipeline (after console verification):**
   - Set GitHub secret `DEPLOY_PORT` to the REAL sshd port (policy since 2026-09-17: required, no port-22 fallback).
   - Re-verify `DEPLOY_HOST_SSH_FINGERPRINT` against the console host-key listing above; update the repo variable if it differs.
   - Confirm the deploy key's PUBLIC half is in the deploy user's `~/.ssh/authorized_keys` and
     the private half is the GitHub secret `DEPLOY_SSH_KEY`.
   - If a cloud firewall blocks GitHub Actions: allow the runner IP ranges for the SSH port.
3. **Then redeploy:** Actions → *Recovery — Deploy Exact Commit* with the approved 40-char SHA
   (`skip_migrations=true`), or push to `main`. Watch the TCP preflight step — its
   classification (dns-failure / refused / filtered-timeout / open) plus the gate means a
   repeat failure now names its layer.
4. **Do NOT:** restart `alo-learning-journey` (protected), edit proxy configs without `nginx -t`,
   run `prisma db push`/`migrate reset`/seeds, run `git reset --hard`/`git clean -fdx` in the
   deploy dir, or run the deprecated `alo-vps-deploy.sh`/`deploy.sh` without reading their
   deprecation guards.

## 5. Exit criteria

- `curl http://127.0.0.1:3044/api/health` → `status: ok` (or degraded with an owned DB incident)
- `https://aloeducation.com/api/health` → HTTP 200 from the public internet (monitor run green)
- `alo-learning-journey` / port 3017 still up and untouched throughout
- One successful gated deploy run whose Deployment Summary matches `.deployed_commit` on the VPS
- Incident note appended to `docs/FINAL_REMEDIATION_AND_DEPLOYMENT_REPORT.md` (§F)
