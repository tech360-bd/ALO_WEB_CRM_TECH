# PRODUCTION-VERIFICATION — ALO Education

Date: **2026-10-18**
Branch: `arena/ef31f574-alo-web-crm-tech`
Base: `ef7fb8b2b50e9f4cba01645a7588e3c198b31474` (`main`)

---

## 0. The single most important statement in this document

**Nothing was deployed. No production system was touched, called, or observed.**

This environment has no Hostinger access, no SSH, no production credentials, no
provider tokens, and outbound network restricted to `github.com`,
`codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org` and
`files.pythonhosted.org`. EBN DNS and email infrastructure were never reachable.

Any statement below of the form "verified" means **verified in this repository, in
this sandbox**. It never means "verified in production."

---

## 1. What was run, and what came back

Every command below was executed in this session. Results are literal.

| # | Gate | Command | Result |
|---|---|---|---|
| 1 | Dependency install | `npm ci --no-audit --no-fund` | `added 1198 packages in 37s` |
| 2 | Prisma client | `npm run db:verify-client` | `Verified generated Prisma client: 533 models` |
| 3 | Schema validity | `npx prisma validate` | `The schema at prisma/schema.prisma is valid 🚀` |
| 4 | **Full test suite** | `npx vitest run` | **191 files passed, 7 skipped; 2087 tests passed, 75 skipped, 0 failed** (45.77s) |
| 5 | **Full typecheck** | `npx tsc --noEmit` | **`TSC_EXIT=0`** |
| 6 | Lint | `npm run lint` | exit 0, **no findings** |
| 7 | Env contract | `npm run audit:env -- --check` | `✓ environment classification is up to date` |
| 8 | Dependency CVEs | `node scripts/ci/npm-security-audit.mjs` | `✓ dependency audit passed (0 effective high/critical advisories)` |
| 9 | Secret scan | `bash scripts/ci/scan-credentials.sh` | `✓ No unreviewed secret-shaped strings in tracked files (docs included)` |
| 10 | Secret-findings test | `node --test tests/secret-findings.test.mjs` | **9 pass, 0 fail** |
| 11 | Deployment ownership | `node --test tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | **16 pass, 0 fail** |
| 12 | Schema/migration diff | `git diff HEAD -- prisma/` | **empty — zero changes** |

### Baseline comparison

The baseline was captured **before any edit**, so the delta is attributable:

| | Files | Tests passed | Tests skipped |
|---|---|---|---|
| Baseline (`ef7fb8b2`) | 186 | 2008 | 72 |
| This branch | **191** | **2087** | 75 |
| Delta | **+5** | **+79** | +3 (new integration file) |

**0 regressions.** The baseline was green and remains green.

---

## 2. Two obstacles overcome to run the real checks

Recorded because both are reproducible hazards for the next person, and because
neither was worked around by faking a result.

### 2.1 Prisma engine download is blocked

`npx prisma generate` failed with:

```
Error: request to https://binaries.prisma.sh/all_commits/c2990dca.../debian-openssl-3.0.x/schema-engine.gz.sha256
failed, reason: Client network socket disconnected before secure TLS connection was established
```

`binaries.prisma.sh` is outside the allow-list. Rather than skip generation (which
would have made `db:verify-client` and the build meaningless), the engines were
recovered from the vendored tree **after confirming an exact version match**:

```
installed @prisma/engines-version → 7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7
vendored  @prisma/engines-version → 7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7
```

and wired through Prisma's own documented custom-binary variables,
`PRISMA_QUERY_ENGINE_LIBRARY` and `PRISMA_SCHEMA_ENGINE_BINARY` (found by reading
`engineEnvVarMap` in `@prisma/fetch-engine/dist/chunk-QFA3XBMW.js`).

**`prisma/schema.prisma` was temporarily edited to `binaryTargets = ["native"]`
during this, then restored byte-identical** — `md5sum -c` → `OK`, and the full
five-target list is confirmed present in the committed file.

### 2.2 Full `tsc` is OOM-killed without swap

```
Killed
TSC_EXIT=137
```

on 3.8 GiB RAM. This is a known property of the repository: `.github/workflows/ci.yml`
carries a step whose comment reads *"tsc on this repo needs >4GB effective memory"*
and provisions an 8 GiB swapfile. After `swapon` locally, the same command
completed with `TSC_EXIT=0`.

**The typecheck result is therefore real and covers all 911 API routes — with one
exception, stated in §4.**

---

## 3. What the CI pipeline will do with this branch

`.github/workflows/ci.yml` runs on every pull request. Two jobs:

**`quality-gates`** — npm security audit, secret-leak scan over *every tracked
file including markdown*, deployment-ownership tests, env-classification check,
`prisma validate`, `prisma generate`, `db:verify-client`, lint, swap provisioning,
typecheck, production build, `scripts/verify-standalone.mjs`.

**`mysql-integration`** — against a disposable `mysql:8.4` service:
`prisma migrate deploy` on a **fresh** database, `migrate status`, a
`migrate diff` drift check proving migrations reproduce `schema.prisma`, the
DB-integration suite with real persistence, a production build, then booting the
standalone server and running `scripts/runtime-smoke.mjs` over HTTP — including a
lead-replay POST to `/api/website/lead` and an assertion that protected routes
deny anonymous access.

Both jobs are fork-safe: **no repository secrets are used**, only a
localhost-only disposable database.

**The 75 locally-skipped tests run for real in `mysql-integration`.** They are
skipped here only because no MySQL server exists in this sandbox — confirmed by
`which mysql mysqld` returning nothing.

---

## 4. The typecheck exception — stated plainly

`TSC_EXIT=0` **does not cover** `src/app/api/whatsapp/webhook/route.ts`, because
that 1,077-line file begins with:

```ts
// @ts-nocheck - Complex webhook with Prisma stub issues, requires generated-client verification in Node 22 CI
```

Repository-wide, **8 files** carry `@ts-nocheck`, **4** of them API routes. A
green typecheck that silently excludes the primary inbound webhook is not full
coverage, and should not be reported as such. Removing them is separate, real
work.

---

## 5. Migration and data safety

| Check | Result |
|---|---|
| `prisma/schema.prisma` modified? | **No** — `git diff HEAD` empty |
| Migrations added? | **No** — zero files under `prisma/migrations` touched |
| `prisma migrate deploy` run against any database? | **No** — no database was reachable |
| Destructive migration executed? | **No** |
| Backup verified? | **NO — UNKNOWN. Not inspected, not created, not confirmed.** |
| Rollback rehearsed? | **No** |

The Student ID fix deliberately avoided the obvious "just add a unique index"
solution, because `Student` may already contain duplicate emails/phones and
adding a unique constraint to such a table is a destructive migration. An advisory
lock was used instead — it closes the race with **zero schema change**.

> `database-backup` is registered in `src/lib/cron/job-registry.ts` with
> disposition **`external-dependency`**, meaning it *refuses to run and names the
> missing outside resource*. **This application does not back itself up.** Backup
> verification must come from Hostinger.

---

## 6. Deployment readiness

### 6.1 This repository cannot deploy

`.github/workflows/deploy-production.yml` is a refusal notice:

```yaml
name: Production deployment disabled — Hostinger owned
...
      - name: Refuse production changes from GitHub Actions
        run: |
          echo "BLOCKED: GitHub Actions owns CI only. ..."
          exit 1
```

`.github/workflows/ci.yml` states in its header: *"CI only. Hostinger owns
production deployment outside Actions. No production credentials, hosting
transport, or restart commands are used."* And in its summary step: *"This
workflow NEVER deploys."*

**EBN nameservers, MX records and unrelated VPS applications were not touched** —
and could not have been, from this sandbox.

### 6.2 BLOCKER: ClamAV must exist before this branch reaches production

This branch makes document uploads **fail closed** in production when no malware
scanner is reachable. That is the correct behaviour and it is intentional.

**Consequence: deploying this branch to production without a running clamd will
reject every document upload.** This is a self-inflicted outage, and it is the
single most important pre-deployment step.

Required, in order:

1. Provision a ClamAV daemon with INSTREAM enabled (default port `3310`).
2. Set `CLAMAV_HOST` and `CLAMAV_PORT` in the production environment.
3. Confirm the daemon's signature database is updating (`freshclam`).
4. Smoke-test an upload with the EICAR test string and confirm a `400` with
   `threat: "EICAR-Test-File"`.
5. Smoke-test a clean PDF and confirm `201`.

### 6.3 Pre-deployment checklist

| # | Step | Status |
|---|---|---|
| 1 | CI green on the PR (both jobs) | **PENDING** — must be observed on GitHub |
| 2 | `mysql-integration` proves migrations apply and the server boots | **PENDING** |
| 3 | ClamAV provisioned and `CLAMAV_HOST` set | **NOT DONE — BLOCKER** |
| 4 | Verified database backup exists | **UNKNOWN — must confirm with Hostinger** |
| 5 | Rollback procedure rehearsed | **NOT DONE** |
| 6 | `NEXTAUTH_SECRET` ≥ 32 chars present in production | **REQUIRED** (new: OAuth state signing fails closed without it) |
| 7 | `ENCRYPTION_KEY` is 64-hex in production | **REQUIRED** (new: Facebook tokens are now encrypted) |
| 8 | Explicit human approval to deploy | **NOT GIVEN** |
| 9 | Post-deploy production smoke test | **NOT DONE** |

### 6.4 Post-deploy smoke test (to be run by whoever deploys)

```
GET  /api/health                                   → 200
GET  /api/facebook/auth?returnTo=/admin/marketing  → 302 to facebook.com, state is signed
GET  /api/facebook/callback?code=x&state=FORGED    → 403  (state verification)
GET  /api/facebook/callback?code=x                 → 400  (missing code)
POST /api/documents  (EICAR payload, staff auth)   → 400  { threat: "EICAR-Test-File" }
POST /api/documents  (clean PDF, staff auth)       → 201
POST /api/whatsapp/webhook (bad signature)         → 403
Two concurrent POST /api/crm/leads/counselling for two new people
                                                   → two DISTINCT AE-YYYY##### IDs
```

---

## 7. Explicitly NOT verified

Stated so that silence is never read as assurance.

| Item | Why |
|---|---|
| Production health, latency, uptime | No production URL called |
| Hostinger configuration, PHP handlers, nginx, `.htaccess` | No access |
| EBN nameservers, MX, SPF/DKIM/DMARC | No access; out of scope by instruction |
| Live WhatsApp send/receive against Meta | No token; `graph.facebook.com` unreachable |
| A real Facebook OAuth handshake | No app credentials; never completed a live flow |
| Instagram / Google Ads / YouTube connections | **No implementation exists** to verify |
| ALO Labs connectivity | **No implementation exists**; no contract, no credentials |
| Genuine ClamAV scanning | Tested against a fake clamd speaking the real protocol; no daemon available |
| Real-MySQL concurrency (`GET_LOCK`, `LAST_INSERT_ID`) | Modelled in unit tests; the real proof is the CI-only integration suite |
| Backup integrity and restore | Never inspected |
| `prisma migrate deploy` against a real database | No database reachable |
| Playwright E2E (`npm run test:e2e`) | **Not run** — no browser installed in this sandbox |
| Production build (`npm run build`) | **Not run** — see §8 |

---

## 8. Checks not run, and why

Two CI gates were **not** reproduced locally:

1. **`npm run build`** — the production Next.js build. It runs
   `prisma generate`, `db:verify-client`, `next build --webpack` and
   `prepare-standalone.mjs`. It was not attempted because this host has 2 CPUs and
   3.8 GiB RAM, and the build is configured for `--max-old-space-size=4096`;
   attempting it risks another OOM that would produce no information. **CI will
   run it in both jobs.** If it fails there, this branch must not merge.
2. **`npm run test:e2e`** (Playwright) — no browser binaries in the sandbox.

Everything else in §1 was run for real.

---

## 9. Files changed in this branch

**Modified (10):**

```
.env.example
.env.production.example
docs/environment-classification.json          (regenerated; CI-enforced)
src/app/api/crm/leads/counselling/route.ts    (F-01 duplicate-safe Student ID)
src/app/api/crm/ucc/documents/upload/route.ts (F-04 malware gate)
src/app/api/documents/route.ts                (F-04 malware gate)
src/app/api/facebook/auth/route.ts            (F-03 signed state)
src/app/api/facebook/callback/route.ts        (F-02 encryption, F-03 state)
src/app/api/facebook/webhook/route.ts         (F-02 decrypt on read)
src/lib/social/token-encryption.ts            (F-02 duplicate removed)
```

**Added (9):**

```
src/lib/documents/malware-scan.ts
src/lib/identity/student-create-lock.ts
src/lib/social/oauth-state.ts
tests/unit/malware-scan.test.ts               14 tests
tests/unit/oauth-state.test.ts                29 tests
tests/unit/social-token-encryption.test.ts    11 tests
tests/unit/student-create-lock.test.ts        12 tests
tests/unit/whatsapp-student-journey.test.ts   13 tests
tests/integration/whatsapp-student-journey.test.ts   3 tests (CI-only)
```

**Documentation added (7):** `INTEGRATION-MAP.md`, `CURRENT-STATE-AUDIT.md`,
`DOCUMENT-STORAGE-ARCHITECTURE.md`, `WHATSAPP-AUTOMATION-REPORT.md`,
`SOCIAL-API-CONNECTIONS.md`, `AI-AGENT-INTEGRATION.md`,
`PRODUCTION-VERIFICATION.md`.

**Not changed:** `prisma/schema.prisma`, `prisma/migrations/**`, anything under
`.github/`, any hosting, DNS or email configuration.

---

## 10. Verdict

| Question | Answer |
|---|---|
| Do the changes pass the project's own checks? | **Yes** — 2087 tests, full typecheck, lint, prisma validate, secret scan, dependency audit, env contract, deployment-ownership tests |
| Are there regressions? | **No** — baseline 2008 passing, now 2087, zero failures |
| Was anything destructive done? | **No** — zero schema or migration changes |
| Is it safe to merge? | **Only after CI is observed green on GitHub.** The local environment cannot run the build or the MySQL suite |
| Is it safe to deploy? | **NO — not yet.** ClamAV must be provisioned first (§6.2), a backup must be verified (§5), and explicit approval obtained |
| Is any service live? | **No.** Nothing was deployed and no external service was called |
