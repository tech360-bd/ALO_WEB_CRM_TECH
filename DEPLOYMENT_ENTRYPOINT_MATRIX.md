> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# Deployment entrypoint matrix — 2026-10-01

PRODUCTION_BRANCH=main (GitHub default branch API + existing delivery policy).
GitHub Actions owns CI and read-only diagnostics only. Hostinger is the intended production owner; its actual Git branch/auto-deploy mapping is UNKNOWN. No deployment, push, merge, settings change or production data operation performed.

| Entry Point | Trigger | Production Impact | Arena Branch Allowed? | Guard |
|---|---|---|---|---|
| .github/workflows/ci.yml:19 | push main/development/arena/**; PR; manual/reusable | Runner install/test/build only | Yes, CI only | No secrets/environment/deployment commands; safety tests before Prisma |
| .github/workflows/deploy-production.yml:10 | Manual only | None: refusal notice | No | exact main AND workflow_dispatch; exit 1; no environment |
| .github/workflows/deploy-recovery.yml:10 | Manual only | None: refusal notice | No | exact main AND workflow_dispatch; exit 1 |
| .github/workflows/health-monitor.yml:1 | Schedule/manual | Public read-only probes and lockfile audit | Diagnostics only | No hosting commands or credentials |
| Hostinger GitHub App/native Git | External push/manual trigger UNKNOWN | Could replace live app | UNKNOWN | Must verify provider branch selection; repo guards cannot intercept it |
| Hostinger ZIP/manual release | Explicit provider action (user reports ZIP upload) | Can replace live app | Not authorized for Arena | Operator must select approved main artifact and approve deployment |
| GitHub repository webhooks | GET hooks returned [] | No repository hook observed | None observed | GitHub App subscriptions not enumerated by this API |
| Local git hooks | commit-msg adds attribution; other hooks samples | No deployment | Yes | No pre-push/post-receive deployment hook observed |
| backend/auto_domain_deploy.py:13 and snapshot copy | API/domain helper call | Inserts approval/SQLite records, not hosting transport | Not a release mechanism | Do not execute: business writes, no DNS or deployment code |
| src/app/api/agentos/rollout/route.ts | Authorized API request | Model/task activation/testing, not application release | Not a release mechanism | Existing auth; no SSH/Hostinger release invocation |
| Provider/business webhooks under src/app/api | External signed events | CRM/communication data, not code release | Not a release mechanism | Existing auth; not executed during audit |
| package.json scripts: build/start/db:* | Explicit operator commands | Build local artifact/start runtime; db:* can modify configured DB | CI build only; DB commands not authorized | No install/pre/post build deploy hooks; CI never calls db writes |
| scripts/prepare-standalone.mjs | npm build | Local artifact copy/validation only | Yes | No hosting transport |
| server.js and exported server copies | Provider runtime startup | Starts already-selected artifact | External selection UNKNOWN | Not a branch selector; do NOT guard startup by missing .git |
| docker-compose.yml | Explicit docker compose invocation | Local legacy containers; app command now refuses | No production approval | Dockerfile CMD disabled; never run compose against production |
| .htaccess / nginx / Caddy config | Host runtime reads | Routing, not release trigger | Not a release mechanism | No webhook or Git release command found |
| Packaging/audit/backup/health utilities | Explicit operator invocation | Local artifacts/diagnostics; backup reads configured DB | Not CI release paths | Not automatically invoked; no production approval implied |

## Disabled executable boundaries (including exported copies)

Inline shell refusal precedes all historical commands and old override variables. Non-main, detached/unknown and Arena refuse; main also refuses because transport is disabled. PM2 modules throw on load; Docker CMD refuses without migrations. Historical bodies retained for evidence, not executable production guidance. These guards cannot constrain a person editing source or an external host executing independent commands.

| Entry Point | Trigger | Production Impact | Arena Branch Allowed? | Guard |
|---|---|---|---|---|
| deploy.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-vps-deploy.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| scripts/deploy.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| scripts/rollback.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| scripts/restart.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| scripts/restore-mysql.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| scripts/install_agentos.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| scripts/auto_domain_agent.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| deploy/ubuntu/deploy.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| deploy/ubuntu/rollback.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| deploy/ubuntu/restore.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| .zscripts/build.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| .zscripts/start.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/deploy.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/scripts/restore-mysql.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/scripts/install_agentos.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/scripts/auto_domain_agent.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/deploy/ubuntu/deploy.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/deploy/ubuntu/rollback.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/deploy/ubuntu/restore.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/.zscripts/build.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| alo-education-web-crm-final/.zscripts/start.sh:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | inline refusal before historical body |
| ecosystem.config.cjs:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | module-load throw |
| deploy-build/ecosystem.config.cjs:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | module-load throw |
| alo-education-web-crm-final/ecosystem.config.cjs:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | module-load throw |
| Dockerfile:1 | Direct/manual; NOT invoked by CI | Former deploy/restore/start/seed path now disabled | No | container command refusal; no implicit migrations |

## Ownership matrix

| Component | Purpose | Trigger | Branch Scope | Can Deploy Production? | Evidence |
|---|---|---|---|---|---|
| GitHub Actions | CI / diagnostics | push/PR/manual/schedule | CI main/development/arena; PRs | No in current files | .github/workflows/ci.yml:19; safety tests |
| Historical Actions release notices | Explain ownership | manual | main only | No, exit 1 | deploy-production.yml:10; deploy-recovery.yml:10 |
| Hostinger Git Integration | Deployment | UNKNOWN | UNKNOWN | Unknown | github-observations.json; no Hostinger access |
| SSH/FTP/SFTP/rsync | Legacy deployment | manual scripts | Disabled all branches | No via inventoried boundaries | quarantined-entrypoints.json |
| Webhook | Potential external release | repository hooks none observed; App subscriptions unknown | Unknown externally | Unknown externally | GitHub hooks API [] is not App configuration |
| Manual deployment | Hostinger release | explicit operator | Must be main only | Yes with provider authority; not authorized now | User-reported ZIP deployment; actual SHA unknown |

## Audit limitations and manual verification required

EXTERNAL_DEPLOYMENT_CONFIGURATION=UNKNOWN
HOSTINGER_EXTERNAL_TRIGGER=UNKNOWN
HOSTINGER_EXTERNAL_DEPLOYMENT=UNKNOWN

In hPanel for the actual aloeducation.com production Node application, verify repository exactly engralaminn-collab/alo_education_z....ai; deployment source ZIP vs GitHub; selected branch main ONLY; auto-deploy restricted to main or disabled for explicit releases; no Arena/development/feature preview mapped to production; webhook/App subscriptions and build/restart commands; application root/current release identity. Save redacted evidence and timestamp. No setting changed: no authorized Hostinger connection available. GitHub App installation access is independent of repository hooks. Check GitHub Settings → Applications as well.

GitHub observed main unprotected and production environment protection_rules=[] / deployment_branch_policy=null. Deployments API 403; rulesets API 403. These are blockers for future production governance, not evidence of safe Hostinger configuration. No environment is referenced by current Actions jobs.

Repository search: search-index.json records matching files/line numbers/terms across tracked and nonignored additions, including docs, exported copies, environment templates, shell/Python/JS/config. No .do/app.yaml/.cpanel.yml or extra root deploy.yml/docker.yml found. Dockerfile/compose and four root workflows inspected. .git inspected separately for hooks/remotes. Ignored dependencies/build artifacts are outside authored-code scope. No production env values collected. Documentation and executable bodies can describe obsolete transports; the notices and guards supersede those instructions.

Current checkout HEAD is df1961f, not the historical 9e504ad2 in earlier reports. Earlier repairs persist as working-tree changes; preserved without reset. Static tests certify this tree, not remote workflow versions, another revision or deployed ZIP.

## Tests / push decision

11 dependency-free deployment-safety tests pass: CI trigger, Arena/feature/PR/development denial, main-only manual eligibility to refusal notice, all shell boundaries tested across 5 branch contexts with isolated git doubles, PM2/container refusal, active workflow transport checks. Main cannot actually deploy via Actions: test 5 proves eligibility to the notice only, not an implemented release path.

npm ci PASS (0 vulnerabilities); npm test 449 pass/7 skip; lint 0 errors/23 warnings. Prisma validate/generate/build blocked by binaries.prisma.sh TLS failure; typecheck blocks missing Prisma metadata. Exact logs in validation/. No previous CI success attributed to this tree. Initial suite failure was an obsolete expectation for the removed deployment job; replaced with assertions for the strict main/manual gate, refusal and no production environment, then suite passed.

SAFE_TO_PUSH_FOR_CI=YES, REPOSITORY_SIDE_ONLY
SAFE_TO_DEPLOY_PRODUCTION=NO

Complete push safety still requires external Hostinger verification. No push executed. After external confirmation, review/stage/commit intended changes on the existing Arena branch, then:

```sh
git branch --show-current
git diff --check
node --test tests/deployment-ownership.test.mjs
git push origin arena/01a0f2b5-alo-education-z-ai
```

Do not force-push. Do not merge. A push sends commits, not unstaged repairs. Do not use old checkout/reset/deploy instructions from historical documentation.
