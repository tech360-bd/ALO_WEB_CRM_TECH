# CI/CD & Deployment Pipeline — Repair Report (evidence-backed)

**Date:** 2026-09-17 · Mission: diagnose the 29 failed `deploy-production.yml` runs, repair the
delivery pipeline end-to-end, validate locally, deliver via Git with evidence.
Companion documents: `docs/CICD_WORKFLOWS.md` (inventory, secrets checklist, runbooks) and
`docs/REPAIR_REPORT_2026-09-16.md` (application/schema repair performed alongside).

---

## Repository identity

| Item | Value |
|---|---|
| Repository URL | `https://github.com/engralaminn-collab/alo_education_z....ai` (**private**; verified via `gh repo view --json isPrivate,defaultBranchRef`) |
| Working branch | `arena/01a0aa5e-alo-education-z-ai` (this session's branch) |
| Production branch | `main` (verified: `defaultBranchRef.name = main`, `origin/HEAD → main`) |
| Starting commit | `f97a5ec9bc0fff23f2b6babff94349edda604060` |
| Final commits | see Git delivery section below |
| Pushed | see Git delivery section below |

Runtime/stack (discovered, not imposed): Next.js App Router (`alo-education-erp`), Node 22
(`NODE_VERSION: '22'`, engines), npm + committed `package-lock.json`, Prisma 6.19.3 / **MySQL**
(`datasource provider = "mysql"`), PM2 (`ecosystem.config.cjs`: name `alo-education`,
`.next/standalone/server.js`, `PORT=3044`, `HOSTNAME=0.0.0.0`), Caddy/nginx reverse proxy,
build `npm run build` → `prisma generate && next build --webpack && prepare-standalone.mjs`.
The lockfile's `@prisma/engines-version@7.1.1-3` under `@prisma/engines@6.19.3` was verified
against the npm registry — that combination is what upstream publishes; the lockfile is consistent.

## Root causes (from real run evidence, not speculation)

All 29 runs of `deploy-production.yml` failed between 2026-09-13 and 2026-09-16
(`gh run list --workflow deploy-production.yml`: 28× push + 1× workflow_dispatch, 0 successes).

### Class A — invalid workflow file (startup failures, 0s, no jobs created)
- **Runs:** `34933688496` (the `Update deploy-production.yml` commit itself, 09-15 05:40) through
  `35045477181` (main @ `f97a5ec`, most recent). Also `34990981957` on branch `arena/01a0a5b2`.
- **Exact observed error:** `gh run view` → "This run likely failed because of a workflow file
  issue." No jobs exist for these runs.
- **Root cause:** `git show f97a5ec:.github/workflows/deploy-production.yml` is a **25-line
  fragment** beginning mid-step (`- name: Verify deployment secrets`) — no `name:`, no `on:`, no
  `jobs:`. The file had been truncated in the repository, so GitHub could not construct a
  workflow. Every subsequent push (including docs-only commits) failed instantly.
- **Fix:** complete, valid, statically-validated workflow restored and rewritten
  (`.github/workflows/deploy-production.yml`, this change set). **Evidence:** js-yaml parse OK
  with correct `name/triggers/jobs` structure; 39-point static safety battery (below).

### Class B — deployment step failures on the VPS (jobs ran ~10–12s, failed at "Deploy to VPS")
- **Runs:** `34733218541`, `34848725480`, `34848808700`, `34893656704` (dispatch), `34903508424`,
  `34918884227`, `34933054469`.
- **Exact observed errors (annotations):**
  - `Unexpected input(s) 'script_stop', valid inputs are [host, port, ..., fingerprint, ...]` —
    `script_stop` is not an input of `appleboy/ssh-action` v1.x (verified against the action's own
    `action.yml` at the pinned SHA).
  - `The process '/usr/bin/git' failed with exit code 128` during "Deploy to VPS".
- **Root causes (workflow fetched at run headSha `3b73e66c`):**
  1. `cd /root/alo-live` + bare `git fetch origin` — the repository is **private** and the VPS
     holds no Git credentials, so the fetch cannot authenticate → git exit 128.
  2. Health checks targeted port **3025** while the app runs on **3044**
     (`ecosystem.config.cjs`).
  3. Invalid `script_stop` input on every SSH step.
  4. No host-key pinning, no CI gate, no backup, no rollback, deployed a moving branch ref
     (`git reset --hard origin/main`), and ran `npm ci` + build **inside the live directory**.
- **Fix:** token-authenticated fetch via inline `credential.helper` (ephemeral `GITHUB_TOKEN`,
  never persisted to `.git/config`, unset immediately after use); port 3044 from
  `ecosystem.config.cjs` ground truth; `script_stop` removed (script runs `set -euo pipefail`);
  `fingerprint:` host-key pinning mandatory (gate fails fast without
  `vars.DEPLOY_HOST_SSH_FINGERPRINT`); exact-SHA checkout with `HEAD == requested SHA` hard
  gate; backups before code replacement; bounded automatic rollback step; build gate on the
  runner before anything touches the VPS. **Evidence:** static battery checks 6, 7, 11, 12 (below)
  + input schema verified against `appleboy/ssh-action@v1.2.5`'s published `action.yml`.

### Cross-cutting — every push deployed, docs-only commits included
- **Evidence:** run list shows deployments attempted for commits like "docs: audit report…",
  "Delete alo-cpanel directory".
- **Fix:** quality-gate job (`validate-and-build`) must succeed before the deploy job runs;
  `paths-ignore` excludes docs-only pushes; PRs are gated by the new `ci.yml` which has **no**
  deployment capability at all.

## Workflow inventory (after repair)

| File | Purpose | Triggers | Deploy capability | Validation status |
|---|---|---|---|---|
| `.github/workflows/ci.yml` | PR quality gate: `npm ci` from lockfile, secret-leak scan, prisma validate/generate, lint, typecheck, **blocking** tests, production build (dummy env) | `pull_request`→main, `workflow_dispatch` | **None** (no secrets referenced → fork-PR safe) | YAML parse OK; static checks pass; exercised by the PR opened for this change (run evidence in next section) |
| `.github/workflows/deploy-production.yml` | Gate (same checks, blocking tests) → SSH deploy of the **exact validated SHA** → port/health/domain checks → auto-rollback on failure | `push`→main (paths-ignore docs), `workflow_dispatch`, `workflow_call` | Yes — environment `production`, concurrency-locked, host-key pinned | YAML parse OK; 39-point static battery; **never yet executed** (requires main push + secrets) |
| `.github/workflows/deploy-recovery.yml` | Operator recovery: strict 40-hex SHA input → existence proof + target summary → calls the same protected pipeline | `workflow_dispatch` only | Yes (via called pipeline) | YAML parse OK; input-regex verified; shares deploy concurrency group |
| `.github/workflows/health-monitor.yml` | Daily public HTTPS health of production (+DB flag from `/api/health`) and learn-subdomain isolation; weekly Monday lockfile audit (blocks on critical only) | `schedule` 03:30 UTC, `workflow_dispatch` | None | YAML parse OK; endpoints exist in repo (`src/app/api/health/route.ts`) |

Required GitHub configuration (names only; full checklist + rotation in `docs/CICD_WORKFLOWS.md` §3):
secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, optional `DEPLOY_PORT`; variable
`DEPLOY_HOST_SSH_FINGERPRINT`; environment `production`; branch protection on `main`.
With this session's token these settings are **not inspectable** (HTTP 403 on secrets/branch-
protection endpoints), so their presence is unverified — the deploy gate names any missing item
explicitly and fails before touching the VPS.

Pinned actions (immutable SHAs, inputs verified against each action's `action.yml` at that SHA):
`actions/checkout@3d3c42e5…` (v7.0.1), `actions/setup-node@82076278…` (v7.0.0),
`appleboy/ssh-action@0ff4204d…` (v1.2.5).

## Test results (exact commands, exact outcomes — statuses not combined)

| # | Command | Result | Status |
|---|---|---|---|
| 1 | `npx vitest run` | exit 0 — **178 passed, 7 skipped**, 17 files passed, 1 file skipped | PASSED (with documented skips) |
| 2 | `npx tsc --noEmit` (NODE_OPTIONS=--max-old-space-size=4096) | exit 0, 0 errors | PASSED |
| 3 | `npm run build` (offline Prisma-engine stubs; same script CI runs with real engines) | exit 0 — "Compiled successfully", **973/973 static pages**, `.next/standalone/server.js` verified | PASSED (sandbox-adapted; see note) |
| 4 | Prisma WASM validator (`@prisma/prisma-schema-wasm@6.19.0-26`, schema string input) | `VALIDATE OK … schema is valid` | PASSED |
| 5 | `npx eslint` (all touched files/dirs incl. the modified integration test) | exit 0 | PASSED |
| 6 | js-yaml structural parse of all 4 workflows | 4/4 OK (name/triggers/jobs verified) | PASSED |
| 7 | 39-point static safety battery (script_stop absent, SHA pinning, permissions, concurrency, environment, fingerprint wiring, exact-SHA gates, blocking tests, fork safety, trigger scoping, token handling, rollback, migration gating, no-seeds, protected service, recovery input strictness) | 37 auto-pass; 2 flags manually verified as checker artifacts (`script_stop` appears only inside a YAML comment; recovery regex present at line 52) → effectively 39/39 | PASSED |
| 8 | Secret-leak scan (same logic as the CI step) over tracked files | 3 hits investigated: all placeholders (`mysql://root:password@localhost` template in legacy `alo-vps-deploy.sh`, `USER:PASSWORD@HOST` doc-template ×2). Rewritten to explicit `REPLACE_WITH_*` placeholders → re-scan CLEAN. No real credential found or committed. | PASSED (after hygiene fixes) |
| 9 | `@action-validator/cli` | NOT EXECUTED — binary fails to load in this sandbox (ESM module error). Stated for honesty: workflow validation here is static (parse + schema cross-check + battery), not an Actions execution. | BLOCKED (environmental) |

**Skipped tests, with reason (never counted as passed):** `tests/integration/consultation-workflow.test.ts`
(7 tests) requires a real disposable MySQL `DATABASE_URL`; none exists in this sandbox or in CI by
default. The file now self-skips with that reason (guard added this session) instead of failing the
suite — matching its own header comment ("DATABASE_URL must point to a test DB"). It must never run
against production. The other integration file (`visa-security-negative.test.ts`) is pure logic and runs/passes.

Note on #3: locally, `prisma generate` ran with stub engine binaries (engine downloads are
firewalled in this sandbox); CI runners download real engines. The generated client, compile,
export, and standalone packaging are identical code paths — the only untested-here step is the
engine download itself, which is standard on GitHub runners.

## GitHub Actions results

- **Historical (pre-fix):** 29/29 failed — run IDs listed above; zero successes ever recorded for
  this workflow. (A 30th run, `35140963500`, was produced by this session's branch push and
  reproduced Class A — the broken fragment is still in the tree; details below.)
- **Post-fix:** **no run of the repaired workflows has executed yet — stated plainly.** Two hard
  gates stand between the repaired files and a real run:
  1. **Push restriction:** `git push` of the commit containing `.github/workflows/*` was rejected:
     `! [remote rejected] … (refusing to allow a GitHub App to create or update workflow
     .github/workflows/ci.yml without 'workflows' permission)`. The session token cannot create
     workflow files on the remote.
  2. Even once installed, `deploy-production.yml` runs only from `main` (push/dispatch) and needs
     the `DEPLOY_*` secrets + fingerprint variable, which are not confirmable with this token
     (HTTP 403 on the secrets endpoint).
- **Delivery workaround (this repository's own established pattern):** the four repaired workflow
  files are committed under `docs/workflows-ready/` (pushable — docs path) with a one-step install
  guide (`docs/workflows-ready/README.md`), superseding the old
  `docs/DEPLOY_PRODUCTION_WORKFLOW_READY.yml`. The commit that places them directly in
  `.github/workflows/` (`40c49cf`, content-identical to the originally prepared `6336aad`) is preserved locally and becomes pushable the moment the
  GitHub App installation is granted **Workflows: Read & write** for this repository.
- A pull request from this branch documents the change set for review; because the remote branch
  cannot yet contain `ci.yml`, the PR itself triggers no CI run — the first real run will be the
  one an admin triggers after installing the workflows (or after the permission grant + merge).
- **New confirming evidence (this session):** pushing this branch created run `35140963500`,
  which failed exactly like Class A — "This run likely failed because of a workflow file issue",
  0 jobs. The broken 25-line fragment inherited from `f97a5ec` is still in the branch tree
  (the repaired replacement cannot be pushed — blocker 0), and GitHub fails *any* push to *any*
  branch whose tree contains an unparseable workflow file. This run is NOT a failure of the
  repaired workflows (none are installed on the remote yet); it is the pre-existing defect
  reproducing, and it stops the moment the repaired `deploy-production.yml` lands.
- **No workflow is claimed successful until its actual run shows success.**

## Production deployment

- **A deployment did NOT occur.** Nothing in this session touched the VPS, DNS, proxy, firewall,
  or any running service.
- Deployed commit SHA: **n/a** (no deployment).
- Backup: no DB or code backup was needed because nothing was executed against production. The
  pipeline creates code/env/upload backups on the VPS before every future deployment
  (`.deploy-backup-<timestamp>-<sha>`), and the DB migration kit
  (`docs/db/2026-09-16-employee-document-version/`) hard-gates any schema change on a verified
  restorable backup. PROPOSED-only; nothing executed.
- Migration status: `skip_migrations` defaults **true**; `prisma migrate deploy` runs only on
  explicit operator opt-in; **no seeds run automatically anywhere**; the legacy
  `deploy/ubuntu/deploy.sh` (`prisma db push --accept-data-loss`) is never invoked by any workflow.
- Service/process status: unchanged by this session. Ground truth on the VPS (actual deploy dir,
  PM2 state) cannot be inspected from here — the deploy script detects the live PM2 `exec cwd`
  first, then remote-matching checkouts, then falls back to the intended `/root/alo-github-main`.
- Domain/HTTPS/health: not re-verified from this session (public checks exist inside the
  workflow + daily monitor). The sandbox's earlier outbound checks were network-restricted.
- Rollback: automatic, bounded rollback step restores the previous commit (recorded in
  `.deploy-prev-commit` before checkout), rebuilds, restarts, re-checks health, and preserves the
  failed attempt's PM2 logs; it refuses to guess when no previous commit is known. Residual risk:
  first-ever pipeline run on a VPS whose state is unknown — mitigated by read-only detection +
  backups + no `git clean`.

## Remaining blockers

| # | Blocker | Impact | Exact action required | Who |
|---|---|---|---|---|
| 0 | **GitHub App token lacks `workflows` permission** — pushes creating/updating `.github/workflows/*` are remote-rejected | Repaired workflows cannot land on the remote from this session; delivered as `docs/workflows-ready/` copies instead | Grant the Arena GitHub App installation **Workflows: Read & write** on this repo (Settings → GitHub Apps → configure → Repository permissions), then the preserved commit `6336aad` pushes as-is; **or** an admin installs the four files per `docs/workflows-ready/README.md` | Repo owner/admin |
| 1 | Deploy secrets/variable presence unverifiable (403 for this token) and possibly unconfigured | Deploy job fails fast at the gate (safe) until configured | Add `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (dedicated ed25519 deploy key — least privilege, never a personal password), optional `DEPLOY_PORT`; add variable `DEPLOY_HOST_SSH_FINGERPRINT` via `ssh-keyscan -p <port> <host> \| ssh-keygen -lf -` (verify out-of-band first) | Repo owner/admin |
| 2 | `production` environment + branch protection not confirmable | No human approval gate on deploys; main can be pushed directly | Create environment `production` (optionally required reviewers); protect `main` (require PR + the CI check, forbid force-push) | Repo owner/admin |
| 3 | VPS ground truth unverified (no SSH access here) | Directory/PM2/port assumptions validated only by code inspection (`ecosystem.config.cjs`) and the workflow's runtime auto-detection | First supervised deploy run: watch the "Deployment Summary" block; confirm dir/SHA/port/health output | Repo owner + operator |
| 4 | Database shape (A vs B for `EmployeeDocumentVersion`) unknown | Migrations stay skipped; schema reconciliation pending | Run `docs/db/2026-09-16-employee-document-version/00-precheck.sql` against production (read-only), then follow the README gate | DB owner |
| 5 | Legacy artifacts: duplicate tree `alo-education-web-crm-final/`, `alo-vps-deploy.sh` deletes `package-lock.json` (`rm -rf … package-lock.json`) — incompatible with reproducible CI | Confusion + drift risk if anyone runs them | Archive/remove duplicate tree after owner review; stop using legacy script (workflow supersedes it) | Repo owner |
| 6 | `src/lib/rag/rag-engine` module missing (pre-existing build warning; runtime-guarded) | RAG feature silently disabled | Implement module or remove the guarded import — documented decision needed | App team |

## Git delivery

- Branch: `arena/01a0aa5e-alo-education-z-ai` (session-mandated branch; never force-pushed;
  unrelated working-tree changes preserved — all changes in this tree are this mission's).
- Commits (focused, reviewed diffs, no secrets/build output/dumps — `.next`, `node_modules`
  ignored; scan clean):
  1. `e5957e6` — application/schema/public-site/widget repair (companion report
     `docs/REPAIR_REPORT_2026-09-16.md`)
  2. docs-delivery commit — `docs/workflows-ready/` (4 repaired workflow files + install guide),
     `docs/CICD_WORKFLOWS.md`, this report, DB-integration test self-skip guard, secret-hygiene
     placeholder rewrites (all pushable paths)
  3. `40c49cf` (preserved locally, sits on top of the docs commits) — the same four workflows installed directly
     under `.github/workflows/`; **push blocked by the `workflows` permission** (blocker 0)
- Push result: commits 1 + 2 (`e5957e6`, `424bb18`) and the evidence note `d64d00a` are pushed to
  `origin/arena/01a0aa5e-alo-education-z-ai` (PR #11: /pull/11); commit 3 intentionally not pushed until the permission is granted —
  nothing was force-pushed and no remote history was rewritten.

## Final status

**Code repaired, not deployed.**

- The 29-failure pipeline is diagnosed from real run evidence and rebuilt as a four-workflow
  system with gates, pinning, host-key verification, exact-SHA deploys, rollback, and monitoring.
- All locally executable checks pass (table above), with two honestly reported exceptions: the
  DB-integration tests **skipped** (no disposable DB) and `@action-validator` **blocked**
  (sandbox binary load failure).
- The repaired workflow files could not be pushed into `.github/workflows/` (GitHub App token
  lacks the `workflows` permission — remote-rejected, evidence above); they are delivered as
  pushable `docs/workflows-ready/` copies with a one-step install guide, and the direct-install
  commit `6336aad` is preserved locally for the moment the permission is granted.
- No production deployment occurred; deploy execution requires owner-configured secrets and a
  merge to `main`. No claim of "deployed", "live", or "all workflows fixed in production" is
  made — the first supervised run is the moment those claims can be evidenced.
