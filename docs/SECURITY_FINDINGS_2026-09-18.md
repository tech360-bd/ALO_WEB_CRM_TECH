# ALO Education — Security Findings & Remediation (2026-09-18)

**Session:** `arena/01a0b26d-alo-education-z-ai`
**Base commit inspected:** `cc15869b094b994873a8188e36563b63118e47e6` (= `origin/main` tip at session start)
**Scope:** read-only inspection first, then code-level remediation of confirmed findings.
**Production was NOT modified in this session.** See §7 for the deployment blockers, which are owner-side.

---

## 1. Method

Every claim below was produced by a command run in this session against this repository or
the GitHub API. Nothing is carried over from earlier reports without re-verification.

| Check | Command | Result |
|---|---|---|
| Repo / branch / remote | `git remote -v`, `git rev-parse main origin/main HEAD` | all three = `cc15869…` |
| Dependency install | `npm ci` | exit 0, 1337 packages, 49s |
| Baseline test suite | `npm test` | **178 passed / 7 skipped** (18 files) |
| Lint | `npm run lint` | exit 0 |
| Prisma validate/generate | `npx prisma validate` | **BLOCKED** — `binaries.prisma.sh` unreachable (sandbox egress allowlist) |
| Typecheck / build | `npm run typecheck`, `npm run build` | **BLOCKED** — both depend on `prisma generate` |
| Full git history | `git fetch --unshallow` | 165 commits |
| History secret scan | `git log --all -p` + pattern grep | see §5 |
| Live production probe | `curl https://aloeducation.com/…` | **NOT VERIFIABLE** from this sandbox — see §6 |

Verification language used throughout: **VERIFIED** (command output seen), **OBSERVED**,
**CONFIGURED** (present in repo), **NOT VERIFIED**, **BLOCKED**.

---

## 2. Verified project identity

| Item | Value | Status |
|---|---|---|
| Repository | `engralaminn-collab/alo_education_z....ai` | VERIFIED |
| Default branch | `main` | VERIFIED |
| Framework / runtime | Next.js `^16.1.1` (App Router, `output: "standalone"`), Node `>=22` | VERIFIED (`package.json`) |
| Package manager | npm `10.9.2`, `package-lock.json` committed | VERIFIED |
| Database | MySQL via Prisma `^6.19.3`, `provider = "mysql"` | VERIFIED (`prisma/schema.prisma`) |
| Prisma models | **479** | VERIFIED (`grep -c '^model '`) |
| Migrations | 10 | VERIFIED (`prisma/migrations/`) |
| Routes | **367** `page.tsx`, **819** `route.ts` | VERIFIED |
| Process manager | PM2, app name `alo-education` | CONFIGURED (`ecosystem.config.cjs`) |
| Application port | **3044**, `HOSTNAME 0.0.0.0` | CONFIGURED (`ecosystem.config.cjs`, `nginx.conf`) |
| Intended deploy dir | `/root/alo-github-main-new` | CONFIGURED (`deploy-production.yml`) |
| Protected co-tenant | `learn.aloeducation.com`, PM2 `alo-learning-journey`, port `3017` | CONFIGURED |
| Health endpoint | `GET /api/health` (public, DB probe, returns 200 + `status: ok|degraded`) | VERIFIED (`src/app/api/health/route.ts`) |
| MCP servers | **none** — the only `mcp` string in `src/` is UI copy in `enterprise-ai-command.tsx` | VERIFIED |

---

## 3. Findings remediated in this session

### SEC-A — `/api/commissions` had no authentication at all · CRITICAL

**VERIFIED.** `src/app/api/commissions/route.ts` (35 lines) imported only `db` and
`NextResponse`. All three handlers ran with zero auth:

- `GET` returned **every** commission record — amounts, currency, invoice URLs, partner and
  student linkage.
- `POST` created arbitrary commission records.
- `PATCH` set any commission to `APPROVED`, with `approvedById` taken **from the request
  body** — approvals could be attributed to anyone.

Proof: the new regression tests returned **HTTP 200** for unauthenticated `GET`, `POST` and
`PATCH` against the unfixed handler.

**Fix:** all three handlers wrapped in the project's existing `withAuth` middleware with a
staff `requireUserTypes` allowlist; commission type/status validated against fixed sets;
`approvedById` now derived from the authenticated actor, never from input.

### SEC-B — `/api/counselor/students/[id]` had no authentication at all · CRITICAL

**VERIFIED.** `GET` returned, for **any** student id: the full `Student` row (including the
`password` and `otpCode` columns, via the `...student` spread), plus documents, payments,
interview sessions, applications, visa cases, SOP/CV drafts, communications, and **internal
counselor notes** (`INTERNAL_ONLY`). `POST` let an anonymous caller write internal or
student-visible comments on any student while supplying their own `authorId`/`authorRole` —
forging both note attribution and the `AuditLog` entry.

This is a direct violation of the requirements *"Student A must not access Student B"*,
*"Enforce authorization server-side"*, and *"internal counselor notes → CONFIDENTIAL"*.

**Fix:** both handlers now call `authenticateRequest` (portal staff session required; student
portal tokens are deliberately not accepted on a counselor view of other students).
`password` / `otpCode` / `otpExpiresAt` are stripped from every student payload. Authorship
comes from the verified session; client-supplied `authorId`/`authorRole` are ignored. Comment
body is validated (non-empty, ≤ 4000 chars).

### SEC-C — `/api/crm/seed` was a public endpoint that disclosed admin credentials · CRITICAL

**VERIFIED.** `src/app/api/crm/seed/route.ts` exported `POST` with **no** auth — it imported
`withAuth` but never called it (`grep -c 'withAuth('` → `0`). An unauthenticated `POST`:

- created **16 privileged accounts** — 2 × `SUPER_ADMIN` (`admin@`, `ceo@`), 13 × `ADMIN`
  (branch manager, counselor, visa, finance, marketing, HR, partner, document, data,
  support, AI manager, …) and 1 student;
- stored their passwords as **plain text** in the `passwordHash` column;
- **returned every plaintext password in the JSON response body** under
  `credentials.users[].password`, alongside `emailRoleMap`.

The route's own note said *"Dev mode — passwords stored as plain text"* — but nothing
restricted it to dev. `NODE_ENV` was never checked.

**Fix:** the route now fails closed. It returns `404` unless **both** `NODE_ENV !== production`
**and** `ENABLE_CRM_DEV_SEED === 'true'`. No password is hardcoded anywhere in the file any
more (16 literals removed); the operator supplies one temporary bootstrap password via
`CRM_DEV_SEED_PASSWORD` (≥ 12 chars, else `400`), which is bcrypt-hashed at 12 rounds
(matching `portal-auth/register`). No credential material is ever returned. Real seeding
should use the reviewed CLI seeds (`npx prisma db seed`, `prisma/seed-*.ts`).

### SEC-D — a real production database password was committed · HIGH

**VERIFIED** in three places at `cc15869`:

| File | Lines |
|---|---|
| `OPERATIONS-BOOK.md` | 423, 458 — `mysqldump`/`mysql -p'<password>'` |
| `documentation/CPANEL-DEPLOYMENT-GUIDE.md` | 47 — full DSN with the same password |

The same file also carried weak default secrets (`NEXTAUTH_SECRET="alo-edu-secret-change-this-now-32"`,
`JWT_SECRET="alo-edu-jwt-secret-change-this-32"`), and `DEPLOYMENT.md:41` paired the **real
database username** with an example password.

**Fix:** all occurrences replaced with runtime lookups / obvious placeholders, and a rotation
notice added at each site. The real username was removed from `DEPLOYMENT.md`.

> ⚠️ **The credential is still in git history and must be treated as compromised.** Removing
> it from the working tree does not un-leak it. See §7 item 1.

### SEC-E — the CI secret scanner could never have caught SEC-D · HIGH (control failure)

**VERIFIED root cause.** The scan step in `.github/workflows/ci.yml` excluded
`':!docs' ':!*.md'` — i.e. **all documentation was never scanned**, which is exactly where the
password lived. Its patterns also did not cover the MySQL CLI inline-password form
(`mysql -u <user> -p'<secret>' <db>`), only `mysql://user:pass@` DSNs.

**Fix:** the scan now covers every tracked file including markdown, and adds patterns for
private keys, `sk-`/`AIza` provider keys, the `mysqldump|mysql|psql|pg_dump … -p<literal>`
CLI form, and `PASSWORD|SECRET|API_KEY|…= <literal>` assignments. Filters remove shell
variable references (`$VAR`), doc-template DSNs (`:PASSWORD@`), placeholder wording and
empty-assignment runs, so the step stays usable.

**Proven both directions** by extracting the real step from `ci.yml` with `js-yaml` and
executing it verbatim:

| Tree | Result |
|---|---|
| fixed working tree | **PASS** — `✓ No secret-shaped strings in tracked files (docs included)` |
| pre-fix `cc15869` (git worktree) | **FAIL** — flags `OPERATIONS-BOOK.md:423`, `:458`, `CPANEL-DEPLOYMENT-GUIDE.md:47`, `DEPLOYMENT.md:41` |

### Regression tests added — `tests/unit/api-authz-regression.test.ts`

11 tests that import the **real** route handlers (only `@/lib/db` and `next-auth` are mocked)
and assert that unauthenticated callers are rejected **before any database access** (every
`db` call is recorded and asserted absent).

**They were run against the unfixed code first: 9 of 10 failed** — `expected 200 to be 401`
for commissions `GET`/`POST`/`PATCH`, and the seed route reached its create path. After the
fixes: **11/11 pass**.

---

## 4. Verification after remediation

| Gate | Result |
|---|---|
| `npm test` | **189 passed / 7 skipped** (19 files) — baseline 178 + 11 new |
| `npm run lint` | exit 0 |
| CI secret-scan step (extracted & executed) | PASS on fixed tree, FAIL on pre-fix tree |
| All 4 workflow YAMLs | parse clean (`js-yaml`) |
| `npm run typecheck` / `npm run build` / `prisma validate` | **BLOCKED** — `binaries.prisma.sh` not reachable from this sandbox; CI runs them on a real runner |

---

## 5. Secret audit of git history (165 commits)

Scanned with `git log --all -p` for private-key blocks, provider tokens (`ghp_`,
`github_pat_`, `xox*`, `sk-`, `AIza`) and DSNs with embedded passwords.

- **No private key** was ever committed — the only `BEGIN OPENSSH PRIVATE KEY` matches are
  documentation prose describing what *not* to commit.
- **One real database password** (SEC-D) — present from its introduction through `cc15869`.
- Everything else was placeholder text (`PASSWORD`, `ENCODED_PASS`, `SET_VIA_ENVIRONMENT_ONLY`,
  `user:pass@localhost:3306/dummy_build_check`).
- No `.env`, `.pem`, `.key` or service-account file is tracked (`git ls-files`); `.gitignore`
  covers `.env*` and `*.pem`.

---

## 6. Production status — NOT VERIFIABLE from this sandbox

This environment's egress is allowlisted to `github.com` and `registry.npmjs.org` only
(`example.com`, `binaries.prisma.sh` and `aloeducation.com` all fail), and **all** outbound
TLS is intercepted by a sandbox proxy — `openssl s_client -connect github.com:443` returns a
certificate issued by `O=E2B, CN=E2B Proxy CA`. Any probe of `aloeducation.com` from here is
therefore meaningless, and I am not reporting one.

The authoritative signal is the repository's own health monitor, run from GitHub's network.
Its single recorded run (`35201979705`, 2026-09-17 08:51 UTC) **failed** with these
annotations (retrieved via the check-runs API):

```
Health endpoint        -> HTTP 502, expected one of [200]
Homepage               -> HTTP 502, expected one of [200 301 302]
Homepage (www)         -> HTTP 502, expected one of [200 301 302]
Learning service       -> HTTP 000000
```

`502` means the reverse proxy answered but its upstream (the app on `127.0.0.1:3044`) did not —
consistent with the app being down while nginx/Caddy is up. `000000` for `learn.aloeducation.com`
is a connection-level failure at a different IP. **Both need console access to diagnose.**

Deployment record: **36 runs of `deploy-production.yml`, 0 successes** (GitHub API,
grouped by conclusion). The most recent (`35281659466`, on `main` @ `16e757c`) failed at the
gate step *Verify deployment configuration presence*; the `Deploy to VPS` job was **skipped**,
so production was never modified by it.

---

## 7. Owner actions required (cannot be done from here)

| # | Item | Why | Exact action |
|---|---|---|---|
| 1 | **Rotate the exposed DB password** | It is committed and remains in git history at 165 commits of reach | On the DB: `ALTER USER … IDENTIFIED BY '<new>'`, update the VPS `.env` `DATABASE_URL`, restart `alo-education` only. Then decide whether to rewrite history (force-push policy decision) |
| 2 | **Set the `DEPLOY_PORT` secret** | Root cause of all 36 deploy failures. The workflow deliberately has no port-22 fallback | On the VPS console: `ss -tlnp \| grep sshd` → GitHub → Settings → Secrets and variables → Actions → add secret `DEPLOY_PORT` |
| 3 | **Set `DEPLOY_HOST_SSH_FINGERPRINT`** (repository *variable*) | Host-key pinning is mandatory and currently absent, so the gate fails | `ssh-keyscan -p <DEPLOY_PORT> <DEPLOY_HOST> \| ssh-keygen -lf -` — use the ed25519 `SHA256:…` line |
| 4 | **Verify the deploy key** | `DEPLOY_SSH_KEY`'s public half may not be in the deploy user's `authorized_keys` | `ssh -i key -p <port> <user>@<host> whoami` |
| 5 | **Recover the 502** | App not serving | `docs/VPS_INCIDENT_RUNBOOK_2026-09-17.md` §3–4 — PM2 status/logs, disk, OOM, `.env` presence. Restart **only** `alo-education`; never touch `alo-learning-journey`/3017 |
| 6 | **First supervised deploy** | Zero successful deploys so far | After 1–5: Actions → *Recovery — Deploy Exact Commit* → the merged SHA of this PR, `skip_migrations=true` |
| 7 | **Review the remaining 128 unverified mutating routes** | See §8 | Triage with the list in `§8`; several are legitimately public |

---

## 8. Known open item — authorization coverage is not uniform

A heuristic sweep found **564** mutating API routes (`POST`/`PUT`/`PATCH`/`DELETE`), of which
**128** contain no recognisable auth keyword. That number is **not** a vulnerability count —
manual sampling showed many are properly protected through helpers the keyword scan misses:

- `src/app/api/admin/employees/[id]` → uses `validateRequestAccess` from
  `central-security-engine` (**protected**)
- `src/app/api/applications/[id]` → uses `authenticateUnified` and enforces
  `app.studentId === authRes.data.studentId` (**protected**)
- `src/app/api/commissions` → **was genuinely unprotected** (SEC-A, now fixed)
- `src/app/api/counselor/students/[id]` → **was genuinely unprotected** (SEC-B, now fixed)

So the real rate is materially lower than 128, but the only way to know is per-route review.
Recommended: add a lint/test that fails when a mutating route exports a handler without
referencing one of the known auth helpers, so new routes cannot regress. That rule was **not**
added in this session because it would fail on routes that are intentionally public (webhooks
with signature verification, health checks) and needs an allowlist the app team should own.
