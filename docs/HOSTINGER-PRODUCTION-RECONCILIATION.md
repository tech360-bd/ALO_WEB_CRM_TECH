> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education — Hostinger production reconciliation

> Historical read-only discovery checkpoint at 9e504ad2. Subsequent local source repairs and current test results are documented in [FINAL_PRODUCTION_STATUS.md](FINAL_PRODUCTION_STATUS.md) and [FUNCTIONALITY_REPAIR_LOG.md](FUNCTIONALITY_REPAIR_LOG.md). Findings below are preserved as observed at discovery, not a claim the current working tree is unchanged.

**Assessment: 2026-10-01, Asia/Dhaka. Overall status: BLOCKED.**

Read-only discovery, not a repair/deployment authorization. No PR merge, deployment, restart, environment change, direct database query/mutation, migration, restore, cron execution, SMTP send or DNS edit was performed. Public GETs may generate ordinary server access logs; no deliberate business-state mutation was attempted. Only documentation/evidence files were added locally; application code and historical SQL remain at the verified checkpoint. No commit or push was made, avoiding any unknown external deployment-on-push integration.

## 1. Executive finding

**The public production health response reports a database authentication failure.** Two retrievals returned `status: degraded` and `database.connected: false`, with different timestamps. The current root cause category is authentication/configuration/access—not evidence that migrations should be run. Whether the mismatch is password, username, database-account mapping, host/grants, URL encoding, stale environment or the wrong deployment target is not yet established.

**Do not treat credential correction alone as clearance to reopen financial/admin workflows.** The unidentified deployed artifact and source financial authorization/state defects require staged review before production write traffic is trusted.

The public response also exposes a database login identifier. It is redacted in this report and saved evidence; it is **not** accepted as the database name. Current branch `/api/health` suppresses this detail and does not return the runtime fields observed in production. `/api/health/live`, present in the branch, returns a not-found page via the fetch service. **Production behavior differs from the checkpoint; the uploaded ZIP's commit and current origin routing remain unknown.** Do not assume the fixes in PR #19 are deployed.

## 2. Evidence sources and limits

| Evidence | Result | Scope / limitation |
|---|---|---|
| Local Git and connected GitHub API | Branch `arena/01a0f2b5-alo-education-z-ai`, HEAD `9e504ad287bd98861d55c72d332fe4f0d840bf9e`; PR #19 open/draft | Tree clean at discovery start; only report files added this turn |
| CI run `36776577753` | Completed success for exact HEAD | Build/test evidence, not deployment or DB integration proof |
| Hostinger dashboard facts supplied by user | Next.js; Node 22.x; root `./`; completed ZIP deployment `alo_education.zip`, dated 2026-09-30; daily backups enabled; SSH active; about 1.34/100 GB, 1/10 web apps | User-reported control-plane evidence; no authenticated Hostinger session available to inspect target, backup inventory or limits |
| Environment/access inventory | GitHub credentials present; no DB/Hostinger/SMTP connection or SSH agent/key/config found in inspected standard locations | No secret values printed; “SSH active” on host does not provide this agent a connection |
| GitHub deployments API | 403 Resource not accessible by integration | No deployment/artifact identity retrieved; existing repository/CI access works |
| Sandbox curl | All six selected HTTPS URLs fail TLS with exit 35 / SSL_ERROR_SYSCALL before HTTP | Not proof origin is down or certificate invalid; no HTTP status inferred |
| Separate web-fetch service | Homepage/login/manifest/robots and API response bodies retrieved | No raw status/headers/certificate/cache controls exposed; tool success does not mean HTTP 200 |
| DNS resolver | MX/SPF/DMARC/DKIM/www/autodiscover/autoconfig answers match supplied records | Resolver-view snapshot, not authoritative hPanel zone inspection; apex ALIAS is flattened and not directly established by A records |

CI was re-verified, not rerun: install, blocking dependency audit, secret scan, Prisma validate/generate/generated-client check, lint, typecheck, tests, integration command and standalone production build all succeeded. Existing local checkpoint evidence is 376 passed/7 skipped, integration 22 passed/7 skipped, lint 23 warnings, audit zero. These commands were **not** rerun during this documentation-only discovery. Skipped DB tests remain unverified. [CI run](https://github.com/engralaminn-collab/alo_education_z....ai/actions/runs/36776577753)

## 3. Production database identity and connectivity

| Question | Evidence / answer | Status |
|---|---|---|
| Repository datasource | `prisma/schema.prisma`: provider mysql, URL from DATABASE_URL; migration_lock.toml mysql | PASS |
| App DB client | `src/lib/db.ts`: standard PrismaClient, no alternate mysql2 connection found in current src/lib | PASS |
| Actual production connectivity | Health reports authentication failure, connected=false | BLOCKED |
| Actual DB host / port / name | Not available; never inferred from login identifier, DNS, examples or legacy files | NOT VERIFIED |
| MySQL vs MariaDB / exact version | Repository uses MySQL connector, which does not identify server distribution; no VERSION() evidence | NOT VERIFIED |
| Hostinger local DB vs external service | No runtime configuration/account assignment visible | NOT VERIFIED |
| Actual credential mechanism | Runtime is using Prisma; DATABASE_URL is expected by this branch, but deployed code/env source unknown | NOT VERIFIED |
| SSL required, CA verification, negotiated DB cipher | No provider policy or DB-session evidence | NOT VERIFIED |
| Production migration table/names/timestamps/checksums | No read-only connection; no query executed | NOT VERIFIED |

Hostinger documents both separate DB_* variables and a connection string for its MySQL connection guide. That does **not** mean this application consumes DB_* or that example host/port values are correct here. Current source needs DATABASE_URL. The Node dashboard also offers external-provider workflows; selecting one can apply environment changes/rebuild, so no wizard was used. [1](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/) [3](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)

**Next read-only step:** securely inspect the actual app's redacted connection components and the corresponding provider DB account/grant assignment; obtain a separately authorized read-only metadata connection. Do not reset passwords, reassign users or save environment settings to “try a fix.” Any eventual change needs a concrete mismatch and explicit approval.

## 4. Schema and migration reconciliation

See [SCHEMA_AND_MIGRATIONS.md](production-reconciliation/2026-10-01/SCHEMA_AND_MIGRATIONS.md), [schema matrix CSV](production-reconciliation/2026-10-01/schema-matrix.csv), [repository schema inventory](production-reconciliation/2026-10-01/repository-schema-inventory.jsonl) and [migration checksums](production-reconciliation/2026-10-01/migration-checksums.json).

- Inventoried 479 models / 7,117 scalar fields / 11 migrations, including @@map names. Every production matrix cell says NOT VERIFIED.
- First HR migration alters EmployeeHR before its later CREATE; EmployeeHRProfile is distinct and used. Historical SQL preserved.
- 95 models have no exact physical-table CREATE found by lexical SQL scanning; 19 of these have a CREATE using the model name rather than its @@map name. Examples: AuditLog/audit_logs, B2bApplication/b2b_applications. This is **not a count of missing production tables**.
- Payroll empty-default backfill plus unique index requires live duplicate/index/child-identity review. No survivor selection or deletion.
- Audit/journal LongText changes remain intended schema targets; the existing widening SQL is a non-automatic review candidate, not an applied migration or a MariaDB-approved script.
- Production cannot yet be classified as fully applied, partial, legacy, manually changed or divergent. Applied history unknown; authentication failure gives no schema verdict.

The read-only SQL handoff covers tables, columns, types/nullability, indexes, constraints/FKs, migration rows and optional bounded aggregate duplicate/status checks. Do not run sections referring to absent columns; metadata first. No table contents/password hashes/token fields/migration logs are requested. No new forward migration can responsibly be selected until actual metadata/history, engine compatibility and backup evidence are known.

## 5. Backup and restore

Daily backups enabled is user-reported, but **the latest backup of the actual production database, its timestamp, success, consistency and restorability are NOT VERIFIED**. Database identity itself is still unresolved.

Provider documentation distinguishes files-only, database-only and full restores and warns that restoration overwrites current data. Its documented coverage includes public_html and MySQL databases, but excludes mailbox/server configuration; this does not independently prove private storage, managed build directories, runtime secrets or an external database are covered for this account. [2](https://docs.hostinger.com/websites/backups)

Required evidence: database-specific snapshot ID/time (with timezone), matching target, successful completion, retention/download availability, checksum/consistency method and an approved isolated restore destination. Only after explicit approval should a snapshot be restored to an isolated non-production target with outbound SMTP/cron/webhooks disabled, no live credentials and restricted PII access. Record metadata, constraint checks and reconciliation results. **No restore, backup generation or download of customer data was performed.** A file backup or retained build revision is not database rollback evidence.

## 6. Production runtime and environment

| Item | Evidence | Status |
|---|---|---|
| Node | Health response self-reports v22.22.0, Linux, on two timestamped fetches; user selected 22.x | PARTIAL — live process self-report, not host shell verification |
| Homepage and login | ALO content and Admin & Staff Login form retrieved | PARTIAL — no JS hydration or authenticated-flow proof |
| Database-backed readiness | degraded / connected=false | BLOCKED |
| Liveness path | `/api/health/live` returns not-found content | PARTIAL — differs from branch; no raw status available |
| API authorization-negative probes | Approval/payroll GET bodies say unauthorized | PARTIAL — no session supplied, no positive role/ownership test, raw status unknown |
| Static output | manifest.json and robots.txt retrieved | PARTIAL — JS/CSS/image asset bytes and browser behavior not validated |
| SSR / cache / origin identity | Next-like page content and changing health timestamps available | NOT VERIFIED — cannot infer data-backed SSR or exact deployed build |
| Startup command / real application directory | Repository npm start uses `.next/standalone/server.js`; user root `./` is a build root, not an absolute runtime path | NOT VERIFIED in Hostinger |
| Standalone artifact / startup wrapper | CI verified standalone for this commit; tracked root server.js and legacy exported wrappers also exist | NOT VERIFIED which entrypoint/archive Hostinger uses |
| Environment loading | Actual runtime env source/presence not visible; root wrapper uses dotenv but npm start targets generated server directly | NOT VERIFIED |
| Persistent storage | storage-service.ts uses process.cwd()/storage and hardcoded capacity descriptions | BLOCKED for deployment safety until actual persistent private path/retention is established |

Hostinger's Node Web Apps documentation describes managed build directories, generated routing configuration, deployment replacement and a dashboard restart option. It includes current and legacy layouts; **none has been assumed as this application's path or Passenger contract**. Files under managed deployment directories can be replaced, so process-relative student/private documents must not be treated as persistent automatically. Do not copy the repository's legacy .htaccess or fixed-port examples into this deployment. [3](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)

Hostinger supersedes the prior generic cPanel assumption for discovery. No evidence establishes Passenger usage in this account. No PM2/SSH deployment, wrapper/.htaccess change, new app, GitHub reconnection, restart or redeploy was attempted.

### Environment handoff (names only)

Required-source inventory remains `docs/PRODUCTION_ENVIRONMENT_MATRIX.md`. Production values/presence are NOT VERIFIED. Core consumers: DATABASE_URL, NODE_ENV, PORT, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, APP_URL (consumer-dependent), NEXTAUTH_SECRET, AUTH_SECRET, JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY, FILE_SIGN_SECRET, SMTP_HOST, SMTP_PORT, SMTP_FROM, SMTP_USER, SMTP_PASSWORD, ALO_CRON_SECRET, CRON_SECRET. SEED_SUPER_ADMIN_EMAIL/PASSWORD are provisioning-only—not permission to seed production. Do not add unconsumed aliases to disguise missing actual configuration.

Inspect names/presence/scope privately; redact URL credentials and tokens. No production .env, environment values or secret exports were read or saved. Provider env changes can require restart/rebuild; those are separately approved production operations. [4](https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/)

## 7. Authentication, RBAC and financial lifecycle

No designated test account or mutation approval was available. Source login creates PortalSession, updates lastLoginAt and writes LoginAttempt; even wrong-password attempts can write records. Logout revokes sessions. Therefore these are **not read-only probes**, and none was submitted. No account was created/seeded/reset, no access token used and no approval/payment transition attempted.

Negative GETs returned unauthorized bodies for `/api/agentos/approvals` and `/api/hr/payroll`. This does not establish SUPER_ADMIN-only decisions, cross-portal denial, counselor/employee scope, logout invalidation, cookie/CSRF/TOTP behavior or database-backed authorization in production. Current branch has those targeted approval/payroll repairs; deployed presence is unknown. Source also retains email-to-CRM-role mapping, in-memory login throttling and broad admin middleware exemptions, requiring careful policy/lifetime review rather than blanket security certification.

[FINANCIAL_FINDINGS.md](production-reconciliation/2026-10-01/FINANCIAL_FINDINGS.md) extends the existing financial audit with precise persisted paths:

- **Confirmed source defect:** student-payment POST accepts caller-supplied `status`, including paid, and stamps paidAt without provider evidence.
- **Confirmed source defect:** CRM finance GET/POST use generic withAuth without finance-role/record-scope restrictions in the handler; payment creation and audit are separate.
- AloPayment, Payment, MockTestPayment, application finances and multiple payroll representations are not an established single reconciled lifecycle.
- Deterministic new journal PKs and named payroll audit transactions are improvements—not proof of gateway idempotency, settlement, reversal/refund, currency or historical balance consistency.
- Paid/refunded/reconciled labels and credit-memo helpers are not provider receipts. No production rows or duplicate counts were obtained.

These findings are code/business blockers, not missing hosting credentials. No automatic repair was made. Business decisions required: canonical obligation/reference, permitted student payment intent, financial roles/scopes, offline settlement evidence, payroll ownership, refund/reversal/FX/fee/closed-period rules and audit retention.

## 8. Scheduler

[WORKERS.md](production-reconciliation/2026-10-01/WORKERS.md) provides **WORKER | IMPLEMENTATION | TRIGGER | LOCKING | IDEMPOTENCY | FAILURE HANDLING | STATUS** for all 15 declarations.

Repository declarations: 15; enabled: 0; disabled: 15. No declared worker route has an exact route file; several separate HTTP endpoints have related names but different implementations. Nine `/api/cron/*` routes and `/api/automation/schedule` exist independently; worker quarantine does not establish that older deployed code or an existing host scheduler is disabled. No endpoint was triggered, including cron “health” or “dry-run.”

Shared lock fallback remains invalid, several jobs are logging-only stubs, and some DB operations swallow failures or lack atomic deduplication. The simulated university scanner is removed from this branch and returns authenticated 503 DISABLED; not confirmed deployed.

Hostinger documentation specifies UTC+0 cron scheduling and plan-dependent job counts/resource limits. Actual account tier, timeout/minimum interval, Node executable/env access, private logs and concurrent-execution limits remain NOT VERIFIED. Do not use Asia/Dhaka expressions unchanged or assume “unlimited” means unlimited runtime. No schedule designed or installed. [3](https://www.hostinger.com/support/1583465-how-to-set-up-a-cron-job-at-hostinger/)

## 9. SMTP

Current source uses patched Nodemailer alias, explicit SMTP_HOST/PORT/FROM/USER/PASSWORD; implicit TLS on 465 and mandatory STARTTLS otherwise, certificate verification not disabled, authenticated send, bounded timeouts, and accepted recipients plus returned message ID before success. These are repository behaviors, not actual host/port selections for production.

| Stage | Production evidence | Status |
|---|---|---|
| Runtime SMTP configuration/TLS/auth/sender | No secure runtime/provider access | NOT VERIFIED |
| Application accepts designated test request | No recipient/test approval; not attempted | NOT VERIFIED |
| SMTP accepts message | No send/auth probe | NOT VERIFIED |
| Provider delivers | No delivery event/provider ID | NOT VERIFIED |
| Inbox receives | No recipient confirmation/full headers | NOT VERIFIED |

Message-ID returned by a library is not necessarily a provider queue ID or delivery receipt. MX/SPF/DKIM matching Hostinger Mail does not prove application sender authorization. Once explicitly approved, use one designated consenting test inbox, non-sensitive content, real app path, redacted transport result, provider delivery event and recipient confirmation. Do not rotate secrets, reset passwords, use activation/reset mail as a test or create mail DNS records implicitly.

## 10. DNS — preserved

| Record | Observed evidence | Status |
|---|---|---|
| Apex ALIAS -> aloeducation.com.cdn.hstgr.net | User-supplied hPanel record; public A/AAAA resolve but ALIAS itself is not an ordinary DNS wire record | PARTIAL |
| www CNAME | www.aloeducation.com.cdn.hstgr.net | PASS |
| MX | mx1.hostinger.com priority 5; mx2.hostinger.com priority 10 | PASS |
| SPF | v=spf1 include:_spf.mail.hostinger.com ~all | PASS |
| DMARC | v=DMARC1; p=none | PASS — observed policy, not proof of enforcement/delivery |
| DKIM a/b/c | All CNAMEs resolve to corresponding hostingermail-{a,b,c}.dkim.mail.hostinger.com | PASS — key resolution/signature verification not performed |
| autodiscover / autoconfig | Matching Hostinger Mail CNAME targets | PASS |

No concrete DNS-change requirement found. **No changes proposed or performed.** Database authentication failure does not justify altering web/mail DNS. Resolver answers may vary by CDN/cache; no static IP pinning was used.

## 11. Independent status and action matrix

“Code/infra/business/approval” columns describe the required next action, not permission to perform it. Read-only access was requested by the user, but supplying a connection requires secure access delegation; state-changing actions need separate approval.

| Area | Status | Evidence / exact blocker / impact | Required action | Code change? | Infrastructure change? | Business decision? | Explicit production approval? |
|---|---|---|---|---|---|---|---|
| REPOSITORY | PARTIAL | Exact checkpoint/repairs preserved; known migration/finance/cron/audit gaps remain | Review findings, plan bounded repairs after evidence | Yes | Not for source review | Yes for finance | Before rollout, not local review |
| CI | PASS | Exact-SHA run succeeded, including Prisma/build/audit gates | Retain evidence; skipped DB cases still need staging | No | No | No | No |
| DATABASE | BLOCKED | Live health reports authentication failure; target identity/config unavailable; data features unusable | Verify redacted runtime config vs DB assignment; approved read-only connection; only then propose correction | Only if encoding/client defect confirmed | Likely credential/grant/env correction, not yet specified | No | Yes before modifying settings/grants/restarting |
| MIGRATIONS | BLOCKED | Historical dependency defects + no applied history; unsafe to execute chain | Obtain history/checksums, inspect clone, review forward/baseline strategy | Yes, strategy conditional on evidence | Read-only access + isolated clone | Yes for payroll mapping | Yes before any migration/backfill/resolve |
| SCHEMA | NOT VERIFIED | No INFORMATION_SCHEMA; cannot classify missing objects/types/FKs/duplicates | Run reviewed metadata sections with read-only account; compare mapped names | Unknown until diff | Access required, not schema change yet | Yes where semantics ambiguous | Yes before DDL; inspection already requested |
| BACKUPS | NOT VERIFIED | Daily setting only; no database-specific timestamp/snapshot/restore evidence | Inspect backup manifest; approved isolated restore rehearsal | No | Isolated destination/access required | RPO/RTO acceptance | Yes before restore/generation |
| RUNTIME | PARTIAL | Public content and self-reported Node available; DB degraded, artifact mismatch, startup/storage unknown | Inspect actual build/runtime metadata; confirm durable private storage | Possibly storage/startup remediation | Secure access; changes separately reviewed | Storage/retention requirements | Yes before restart/redeploy/move |
| AUTHENTICATION | BLOCKED | DB authentication failure; no designated account; login/logout write data | Restore DB access through approved change, then staging/approved test account flows | Unknown until runtime tests | DB access/config likely | Test scope/accounts | Yes for session/login/audit mutations |
| RBAC | PARTIAL | Two unauthorized response bodies only; current-branch approval scope repaired, finance gaps found | Artifact identity and complete role/ownership negative+positive tests | Yes for identified finance handler gaps | Access/test environment | Role/finance policy | Yes for production test writes |
| FINANCIAL | BLOCKED | Self-declared paid state, generic finance auth, missing linked settlement/refund/journal lifecycle | Approve rules, repair/transaction-test, reconcile read-only metadata/aggregates | Yes | Read-only DB/staging | Yes | Yes before production mutation/reconciliation |
| SCHEDULER | BLOCKED | 15 disabled declarations; stubs/invalid locking; actual host schedule unknown | Keep quarantine; inspect existing jobs, implement and test before activation | Yes | Host limits/access, later scheduler configuration | Timing/ownership/retry rules | Yes before enable/invoke |
| SMTP | NOT VERIFIED | No host credentials/recipient/provider event; no send attempted | Secure config inspection; separately approved one-message test | No new transport planned; verify deployed version | SMTP configuration/access if absent | Designated recipient/sender | Yes before send/config changes |
| DNS | PARTIAL | Public mail/www records match; apex ALIAS/authoritative zone not directly inspected | Preserve; optionally inspect zone read-only | No | No change indicated | No | Only if future concrete DNS proposal |
| SECURITY | BLOCKED | Deployed health leaks DB login identifier; source financial authorization/state defects; origin/build unknown | Redact production diagnostic response via approved release; scope repairs; verify headers/TLS/session/security tests | Health fix already in branch; additional finance fixes needed | Deployment/config access; no DNS change indicated | Authorization/retention policy | Yes before production remediation |
| PRODUCTION READINESS | BLOCKED | DB failure plus unresolved repository and verification gates | Complete evidence/approval chain above; do not deploy or merge by inference | Yes | Yes after reviewed requirements | Yes | Yes |

## 12. Next handoff

See [ACCESS_AND_APPROVAL_CHECKLIST.md](production-reconciliation/2026-10-01/ACCESS_AND_APPROVAL_CHECKLIST.md). The immediate need is **secure read-only Hostinger/runtime/database access or equivalent sanitized results from an authorized operator**—not a new source ZIP, GitHub password, database password in chat or automatic deployment.

Priority: identify the deployed artifact and its redacted DB configuration -> identify server/account/TLS policy -> collect metadata/history and backup evidence -> reconcile on an isolated clone -> propose minimal approved changes. No code or production repair was performed in this discovery turn.

Saved evidence: `docs/production-reconciliation/2026-10-01/` (sanitized public observations, curl/DNS snapshots, CI metadata, schema matrix/inventory, local migration hashes, read-only SQL handoff, worker and financial reports). No secrets/customer data included.
