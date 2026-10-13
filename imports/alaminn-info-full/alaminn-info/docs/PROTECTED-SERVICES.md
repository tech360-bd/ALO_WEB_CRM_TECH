# PROTECTED SERVICES REGISTRY — Ecosystem Isolation Map

**Owner:** Al-Amin
**Last updated:** 2026-09-18
**Purpose:** Identify every production service in the multi-domain ecosystem, mark which services are protected (must NOT be modified or restarted by ALAMINN.INFO work), and confirm isolation boundaries.

This file exists to prevent the ALAMINN.INFO deployment work from accidentally touching any other project's services, databases, ports, or process managers.

---

## Ecosystem-wide service map

| Domain | Port | Process | Directory | Repository | Owner | Protected? |
|---|---|---|---|---|---|---|
| `alolabs.net` | 3011 | VERIFY | VERIFY | VERIFY | ALO Labs | YES — do not modify from alaminn.info work |
| `hosting.alolabs.net` | 3012 | VERIFY | VERIFY | VERIFY | ALO Labs | YES — do not modify |
| `agents.alolabs.net` | 3013 | VERIFY | VERIFY | VERIFY | ALO Labs | YES — AI agent infra; highest scrutiny |
| `panel.alolabs.net` | 3014 | VERIFY | VERIFY | VERIFY | ALO Labs | YES — privileged infrastructure |
| `aloeducation.com` | 3044 | `alo-education` | `/root/alo-github-main` (reported, VERIFY) | VERIFY | ALO Education | YES — do not modify |
| `english.aloeducation.com` | 3016 | VERIFY | VERIFY | VERIFY | ALO Education | YES — do not modify |
| `learn.aloeducation.com` | 3017 | `alo-learning-journey` | VERIFY | VERIFY | ALO Education | **HIGHEST PROTECTION — never restart, stop, reconfigure** |
| **`alaminn.info`** | **3018** | **`alaminn-info`** | **`/home/z/my-project/alaminn/`** | **TBD (pending GitHub URL)** | **Al-Amin** | **THIS PROJECT** |
| `icla-global.com` | 3019 | VERIFY | VERIFY | VERIFY | ICLA Global | YES — do not modify |
| `icla-global.in` | 3020 | VERIFY | VERIFY | VERIFY | ICLA Global India | YES — do not modify |
| `bdtech360.com` | 3021 | VERIFY | VERIFY | VERIFY | BDTECH360 | YES — AI agent infra; highest scrutiny |
| `ecotechbd.com` | 3022 | VERIFY | VERIFY | VERIFY | EcoTech BD | YES — do not modify |
| `neelacholcityagro.com` | 3023 | VERIFY | VERIFY | VERIFY | Neelachol | YES — do not modify |
| `uninotary.com` | 3024 | VERIFY | VERIFY | VERIFY | Uni Notary | YES — do not modify |
| `marketing.alolabs.net` | 3029 | VERIFY | VERIFY | VERIFY | ALO Labs Marketing | YES — do not modify |

---

## Strict isolation rules for the ALAMINN.INFO project

1. **NEVER** run `pm2 restart`, `pm2 stop`, `systemctl restart`, or any process-manager command targeting any service in the table above except `alaminn-info` (port 3018).
2. **NEVER** modify the deployment directory of any other project.
3. **NEVER** touch `learn.aloeducation.com` / port 3017 / `alo-learning-journey` process — this is explicitly protected by the user's standing instruction.
4. **NEVER** connect to another project's database from ALAMINN.INFO code. The `DATABASE_URL` in `.env.production` must point only to ALAMINN.INFO's MariaDB.
5. **NEVER** share `AUTH_SECRET`, `CRON_SECRET`, or any HMAC signing secret with another project. Each project generates its own.
6. **NEVER** reuse SSH keys, deploy keys, or GitHub Actions secrets across projects.
7. **NEVER** modify DNS records for any domain other than `alaminn.info`.
8. **NEVER** deploy the ALAMINN.INFO build to a path or port that belongs to another service.

---

## Verification status

| Verification | Status | Notes |
|---|---|---|
| ALAMINN.INFO source has no imports from other ecosystem repos | VERIFIED | grep for `aloeducation`, `alolabs`, `bdtech360`, `icla`, `ecotech`, `neelachol`, `uninotary` returns no source imports |
| ALAMINN.INFO `package.json` lists no dependencies from other ecosystem repos | VERIFIED | only public npm packages |
| ALAMINN.INFO Prisma schema defines its own DB; no shared schema | VERIFIED | 25 models, all namespaced to alaminn |
| ALAMINN.INFO has no cron job that touches other services | VERIFIED | 11 cron routes, all internal to alaminn |
| Port 3018 is exclusively reserved for ALAMINN.INFO in this registry | VERIFIED | no other project uses 3018 |

---

## Outstanding verification (blocked on owner action)

The "VERIFY" entries above cannot be verified from the ALAMINN.INFO project alone — they require VPS access and access to the other projects' repositories. The owner must independently confirm:

1. The actual process manager running each service (PM2 / systemd / Docker).
2. The actual deployment directory on the VPS for each service.
3. The actual SSH user and key authorized for each service's deployment.
4. The current health of each protected service (HTTP 200 from each domain).

Until these are verified, ALAMINN.INFO work proceeds on the ALAMINN.INFO source code, build, and local testing only. No VPS actions are authorized.
