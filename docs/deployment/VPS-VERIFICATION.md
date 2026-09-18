# VPS / Network Verification

> Mandate §68–§72, §107. **This sandbox has NO production access.** Egress is
> allowlisted to GitHub + npm and TLS is proxy-intercepted, so `aloeducation.com`,
> the VPS, PM2, Nginx, and listening ports **cannot be reached or verified here**.
> Every infrastructure fact below is either CONFIGURED (from repo config) or
> NOT VERIFIED. Nothing is asserted as live.

## What the repository CONFIGURES (not the same as live state)

| Item | Configured value | Source | Live status |
|---|---|---|---|
| App name | `alo-education` | `ecosystem.config.cjs` | NOT VERIFIED |
| Port | `3044` (quoted) | `ecosystem.config.cjs` | NOT VERIFIED |
| Hostname | `0.0.0.0` | `ecosystem.config.cjs` | NOT VERIFIED |
| Deploy dir | `/root/alo-github-main-new` | `deploy-production.yml` (`INTENDED_DEPLOY_DIR`) | NOT VERIFIED — see note |
| Domain | `aloeducation.com` | nginx/deploy config | NOT VERIFIED |
| Reverse proxy | Nginx → `127.0.0.1:3044` | `nginx.conf` | NOT VERIFIED |
| Protected sibling | `alo-learning-journey` / `3017` | mandate §70 | **must remain untouched** |

> **Deploy-path discrepancy (OWNER ACTION):** the mandate asserts
> `/root/alo-github-main`; the repo enforces `/root/alo-github-main-new`
> (`INTENDED_DEPLOY_DIR`, pinned by `tests/unit/deployment-config.test.ts`,
> 406 refs vs 19). I did **not** change it. Confirm with
> `pm2 describe alo-education | grep 'exec cwd'` before any deploy.

## Checks that MUST be run on the VPS (OWNER actions)

```bash
# Port 3044 listening (§69)
ss -lntp | grep ':3044'
# PM2 (§69)
pm2 status
pm2 describe alo-education          # confirm exec cwd, port, env
# Protected sibling untouched (§70/§108)
pm2 describe alo-learning-journey   # confirm port 3017, running
# Nginx (§71)
nginx -T | grep -A5 aloeducation.com
curl -I https://aloeducation.com    # expect 200 via 127.0.0.1:3044
# Database port not public (§72)
ss -lntp | grep -E ':3306|:5432'    # should be 127.0.0.1 only
```

## Last known production signal (from the repo's own monitor)
The `health-monitor.yml` workflow last reported `/api/health`, `/`, and `www` →
**HTTP 502**, and `learn.aloeducation.com` → `000000`. That workflow has run only
once despite a daily cron. **Production health is BLOCKED/NOT VERIFIED from here**
and the 502 is an open OWNER investigation.

## IP / secret exposure (§72)
- No server private IPs, DB IPs, Redis IPs, SSH config, or secrets are placed in
  public frontend config in the audited source. `NEXT_PUBLIC_*` vars are limited
  to non-secret client config (see `docs/deployment/ENVIRONMENT-AUDIT.md`).
- The CI secret-scan step passes on the committed tree.

## Protected application check (§108)
- **Before changes:** `alo-learning-journey` / `3017` — not reachable from this
  sandbox; assumed running per mandate. NOT VERIFIED here.
- **After changes:** this work touched only the ALO Education application code on
  branch `arena/01a0b26d-alo-education-z-ai`. **No infrastructure, Nginx, PM2,
  DNS, TLS, firewall, or database was modified.** The protected sibling is
  untouched by construction.

## Verification status
**BLOCKED** — no production access from this sandbox. All VPS verification is an
OWNER action requiring SSH to the production host.
