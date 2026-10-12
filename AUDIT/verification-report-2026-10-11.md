> **Later Phase 2 batch:** [Gate1/Gate2 report](phase2-gates-2026-10-11/REPORT.md). Counts remeasured; bounded security changes tested. Release HOLD unchanged; historical results below preserved.

# ALO EDUCATION WEB_CRM — final blocker resolution plan and evidence

**RELEASE HOLD — approved test environment NOT established.** 11 October 2026.

Start here: **`docs/APPROVED-TEST-ENVIRONMENT-CHECKLIST.md`**. It assigns each prerequisite to a responsible role and distinguishes sandbox observations from approval and staging evidence.

Existing Node.js / Next.js / React / TypeScript / Prisma / MySQL architecture and dirty working tree preserved. No application-code edits, version/schema/migration changes, production access, real messages, commit, push, merge or deployment in this phase. Only checklist, report, runbook clarification and evidence files changed.

Current evidence: `AUDIT/final-blockers-2026-10-11/`. The immediately previous ten-section report and results are copied there as `previous-report.md` and `previous-results.json`. Older evidence remains in `AUDIT/post-audit-2026-10-11/`, including the original baseline. No synthetic result is relabeled as production/staging verification.

## 1. Environment prerequisites and authorization

Inspected before editing: cwd `/home/user/alo_education_z....ai`, branch `arena/8b727e17-alo-education-z-ai`, HEAD `c5bfcbbaef4e612eddb55f5f8516e5b1526e68cc`;154 modified tracked paths and90 untracked entries at phase start. No prior work discarded. `git diff --check` passes.

| Required prerequisite | Current evidence/status | Responsible access/infrastructure role |
|---|---|---|
| Approved isolated test host/account | **BLOCKED**, no verified provisioned target or approval record | Project/release owner |
| Project-supported runtime | Sandbox Node22.22.3/npm10.9.8 verified; staging/build memory unknown | Infrastructure operator |
| Correct Prisma versions | CLI/Client/engines6.19.3 installed and lockfile match; generated Client same version | Build operator |
| Official engine network | **BLOCKED**, DNS works, TLS ends before certificate/HTTP | Sandbox network operator or approved equivalent CI host |
| Separate disposable MySQL | Schema/provider confirmed mysql; no MySQL service/client/container runtime found | DBA |
| Explicit test-only URL/acknowledgment | TEST_DATABASE_URL and ALLOW_DISPOSABLE_DATABASE_TESTS absent | DBA/test owner, secure injection only |
| No production data/credentials | No app/test DB URL or actual .env found locally; proposed environment segregation/grants not verified | Infrastructure/security operator |
| Independent synthetic role accounts | **BLOCKED**, no DB-backed accounts provisioned/verified | Application owner/QA |
| Provider sandbox/mail sink | Local mocks only, no verified staging sandbox | Integration owner |
| Hostinger or representative staging | **BLOCKED**, no authenticated account/plan settings | Hosting owner |
| Backup/restore/migration/smoke/rollback evidence | **BLOCKED**, plan exists, no environment execution | Release owner/DBA |

Do not send database URLs/passwords/tokens in chat. Use approved secure environment settings. The checklist does not itself prove the environment exists.

## 2. Prisma failure reproduction and exact evidence

Command: `npm run db:generate` → `prisma generate`. Initial attempt exited1 at:
```
https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine.sha256
```
Exact error:
```
Client network socket disconnected before secure TLS connection was established
```
After official installer rerun, generation again exited1 at the compressed-artifact checksum:
```
https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine.gz.sha256
```
These are distinct observed checksum requests; neither succeeded. Logs: `prisma-generate.txt`, `official-engine-install.txt`, `prisma-generate-after-install.txt`.

Official command used: `npm rebuild @prisma/engines --foreground-scripts`. It executes `@prisma/engines@6.19.3` postinstall and exits0, but both native engine-presence checks remain false and subsequent generation fails. **Installer exit0 is not successful engine installation or build verification.** No arbitrary binary/version changes, TLS bypass, checksum bypass, no-engine mode or SQLite substitution used.

## 3. DNS, TLS, clock, proxy and compatibility diagnosis

| Check | Actual result |
|---|---|
| DNS | binaries.prisma.sh resolves IPv4/IPv6; not a DNS-resolution failure |
| curl checksum/archive | exit35, SSL_ERROR_SYSCALL, HTTP000: no HTTP response |
| OpenSSL with hostname verification and CA path | exit1, unexpected EOF, **no peer certificate**, zero handshake bytes read |
| Node HTTPS with rejectUnauthorized=true | Prisma host ECONNRESET before TLS established |
| Control HTTPS to npm/GitHub | HTTP200, curl ssl_verify_result0; Node npm TLS authorized=true |
| System time | UTC2026-10-11, agrees with control HTTP Date to within1s; no gross clock skew observed; not an NTP certification |
| Proxy/config | Upper/lower-case proxy vars absent; npm proxy/https-proxy/cafile unset; strict-ssl=true; no custom CA or TLS/engine override |
| OS/runtime | Debian12/Linux x64, OpenSSL3.0.20, Node22.22.3 |
| Prisma target | Detected debian-openssl-3.0.x, included in existing generator binaryTargets |
| Versions | Installed and locked CLI/Client/engines6.19.3; generated Client6.19.3/mysql/library engine |
| Engine wrapper | 7.1.1-3.c299… explicitly declared by @prisma/engines6.19.3; not evidence of mismatched CLI major |

OpenSSL prints `Verify return code: 0` despite receiving no certificate. That line is **not certificate-validation success**; the handshake failed and peer-certificate validity is untestable on this connection. No expired certificate was observed.

Root cause supported by evidence: sandbox egress allowlist excludes `binaries.prisma.sh`; controls on allowed hosts succeed. Exact required infrastructure change: authorized outbound certificate-validated HTTPS443 to the official Prisma engine host and legitimate official redirects, or a separately approved representative build/test environment allowing that traffic. Policy cannot be repaired through application code. No bypass attempted.

Official version6 engine/install guidance was previously read from pinned Prisma documentation on GitHub; that evidence remains in `AUDIT/post-audit-2026-10-11/prisma-official-guidance.json`. Keep lockfile versions and official installer. Use `docs/POST-AUDIT-STAGING-VERIFICATION.md` after access is approved.

## 4. Database harness safeguards and newly clarified cleanup blockers

Source inspected: `scripts/run-integration-tests.mjs`, `scripts/lib/test-database-safety.mjs`, `tests/helpers/{test-database.ts,database-test-setup.ts}`, `vitest.config.ts` and all five DB suites. Findings in `database-harness-review.md`.

**PASS within static/local-test scope:** explicit TEST_DATABASE_URL; loopback mysql/alo_test_* validation; no query/hash transport overrides; distinct original application schema; disposable acknowledgment; rejection of production-mode/SQLite; validation before runner spawn and direct Vitest imports; no silent application DATABASE_URL fallback. The consultation broad deletes remain removed. Inspected delete calls in five suites have filters.

**Not certified:** localhost/schema-name checks cannot prove a service is not a production tunnel; actual server identity and least-privilege grants require operator evidence.

**Deterministic cleanup remains BLOCKED:**
- Monitoring, monitoring-RBAC and partner suites swallow several deletion errors.
- Monitoring mutates the stable scheduler job and does not comprehensively restore/remove job, audit and run rows. Restrict foreign keys may prevent later cleanup while errors are hidden.
- Content-publication teardown uses slugs in a relationship-ID filter; failure before inline cleanup can leave rows.
- Early cleanup failure can prevent later cleanup actions in some suites.

These are source-level gaps, not claimed observed MySQL failures. QA/DBA must repair/verify exact primary-ID tracking, dependent-row deletion order, all-attempt cleanup with surfaced failures, partial-setup cleanup and isolated ownership of the scheduler row before suite execution approval. This phase did not modify those suites or claim the gaps resolved.

## 5. The63 database tests and migration status

**Zero DB tests executed.** The required isolated MySQL service/URL and native engine are absent. No DB reset, migrate, truncate, delete, seed or production connection made.

| Suite | Passed on DB | Failed on DB | BLOCKED/not executed |
|---|---:|---:|---:|
| Consultation persistence | 0 | 0 | 7 |
| Content publication/security | 0 | 0 | 5 |
| Partner B2B | 0 | 0 | 23 |
| University monitoring RBAC | 0 | 0 | 13 |
| University monitoring | 0 | 0 | 15 |
| **Total** | **0** | **0** | **63** |

`database-test-status.json` lists **each test name, file, line and blocked reason**, collected with the TypeScript AST, not executed. Initial `vitest list … --json` returned zero because suites are skipped; this result is retained rather than pretending it discovered/executed the tests. No fake test URL supplied to enable them. The visa-negative file under integration contains local mock logic and is not included as database proof.

All22 migration files and hashes were previously inventoried; no migrations changed in this phase. Migration application/status/drift, foreign keys, uniqueness, SQL mode/collation, transactions, CRUD, concurrency, rollback and post-test residue checks remain **NOT EXECUTED on MySQL**.

## 6. New commands, exit codes and historical results

Current evidence files are under `AUDIT/final-blockers-2026-10-11/`:

| Command/check | Exit/result | Sanitized log |
|---|---|---|
| `node scripts/diagnose-prisma-runtime.mjs` before/after installer | 0; engines absent | `prisma-runtime*.json` |
| `npm run db:generate` before/after installer | **1 / BLOCKED** | `prisma-generate*.txt` |
| `npm rebuild @prisma/engines --foreground-scripts` | 0; no functioning engines | `official-engine-install.txt` |
| curl control/Prisma HEAD requests | controls0; Prisma35 | exact args/status in `network-time-proxy.json` |
| `openssl s_client -connect binaries.prisma.sh:443 -servername binaries.prisma.sh -verify_return_error -verify_hostname binaries.prisma.sh -CApath /etc/ssl/certs` with15s timeout | 1, no certificate | `openssl-prisma.txt` |
| Node TLS probes | Prisma ECONNRESET; npm authorized | `node-tls.json` |
| Selected13 security/guard/filesystem test files | **121 passed,0 failed, exit0** | `selected-safety-tests.txt` |
| `node --test tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | **16 passed, exit0** | `runtime-contract-tests.txt` |
| `npm run db:verify-client` | **532 models, exit0** | `generated-client-check.txt` |
| Static DB-test discovery | 63 declarations, no DB execution | `database-test-status.json` |
| `gh api repos/engralaminn-collab/<name>` | current repo0/HTTP200; six1/HTTP403 | `repository-access.json` |
| `git diff --check` | 0 | phase check; no whitespace errors |

**Historical results retained, not rerun or relabeled:** original full suite1,594 passed/63 skipped; previous full suite1,625 passed/63 skipped; full lintPASS; both focused typechecksPASS; dedicated DB-suite typecheckPASS; synthetic diagram/marketing exports, SEO and Kanban browser contractsPASS.

No full suite/lint/typecheck/browser rerun this phase because application/test implementation is unchanged. The121 selected tests are a subset, **not** a new full-suite total or authenticated staging run. Some exercise real cryptography/filesystem; auth/DB/provider dependencies remain mocked where documented.

**Schema validation and production build were not rerun this phase after the still-failed generation prerequisite.** Their prior exit1 logs are retained under `post-audit-2026-10-11`. Both remain **BLOCKED, not verified**. After network resolution run repository commands `npm run db:generate`, `npm run db:validate`, full `npm run typecheck`, `npm run build` and standalone verification on an approved environment; do not equate Client model count with a native engine/build.

## 7. Authenticated staging, UCC and provider boundaries

**Independent staging accounts/workflows: BLOCKED, none performed.** Registration/OTP/mail sink→User/Student/CRM linkage; studentA/B isolation; assigned/unassigned counselors; User/Portal administrators; partnerA/B; employee; application transitions; private HTTP downloads; inbox separation; suspension/expiry/logout/session switching all still require real independent accounts and synthetic records in the approved environment.

Local reruns cover signed identity-domain/tamper/expiry rules, unlabelled-session denial, registration transaction contracts, counselor scoping, student session responses, private URL/ID substitution denial, storage symlink protection, download audit/hash failures and source-separated inbox histories. These are limited regression evidence, not runtime MySQL/E2E proof. No administrator token is counted as another role's journey.

UCC containment unchanged: affected private paths canonical User administrators only; assignment returns503 `UCC_ASSIGNMENT_NAMESPACE_PENDING`; external replies503 `OUTBOUND_REPLY_POLICY_UNVERIFIED`. No ownership or messaging-policy approval has been recorded; no environment bypass or capability enabled. Proposed approval requirements remain in `docs/UCC-OWNERSHIP-RELEASE-GATE.md`.

Provider operation remains NOT TESTED. Local mocks do not verify credentials, grants or delivery. Staging requires a mail sink and approved provider sandbox/mock network with real sends disabled. No real message sent.

## 8. Hostinger contract and repository-access restrictions

Repository contract only: Node22.x, npm install/build/start scripts; `npm start` is `NODE_ENV=production node server.js`; root startup file requires `.next/standalone/server.js`; bind0.0.0.0; validate provider-assigned PORT. **Actual port unknown**; no assumed3044, no private database port exposed.

Actual Hostinger plan/deployment mode, supported runtime versions, selected Node minor, OS/architecture/OpenSSL, build memory, branch auto-deployment settings, persistent filesystem, proxy/TLS and DB connectivity: **BLOCKED**. Hostinger connector lookup returned `unsupported`; no authenticated account evidence obtained. Do not assume all hosting plans support this deployment. Owner must supply redacted panel/runtime evidence or approve an equivalent representative environment. `hostinger-access.json` records the boundary.

Code requires DATABASE_URL, NEXTAUTH_SECRET/NEXTAUTH_URL, ENCRYPTION_KEY, FILE_SIGN_SECRET, build-time NEXT_PUBLIC_APP_URL and private STORAGE_POOL_C for documents. Actual values must be securely provisioned. Confirm storage persists across releases and is outside public web root; verify native Prisma library on both build/runtime targets and test DB reachability privately. No invented value, port or storage path.

Fresh GitHub checks: current checkout HTTP200; six reference targets still HTTP403 “Resource not accessible by integration”: `alo-education-uk-final`, `alo-education-last`, `alo-ukvi-ai-markting-platform-copy`, `ALO-Education_LAST-TRY`, `ukvi-ai-markting_n8n`, `Ai-Markting-crm` under engralaminn-collab. Actual blocked-repo names/branches/contents remain unknown. Working current access argues against a wholly expired connection; exact selection/grant/policy restriction cannot be determined. Owner must review GitHub integration grants/policy or reconnect through Arena. No token exposed or restoration claimed.

## 9. Approval-gated backup, migration, smoke and rollback plan

`docs/POST-AUDIT-STAGING-VERIFICATION.md` remains the runbook, now explicitly referencing prerequisite and cleanup blockers. **No backup/restore/migration/staging smoke/rollback exercise executed.** Documentation is not evidence of execution.

Required sequence:
1. Project owner authorizes isolated staging account/domain and exact allowed operations; infrastructure/network operator restores official engine access.
2. Build operator installs from lockfile and passes official Prisma/full compile/build/standalone checks; DBA proves disposable service identity and no production grants/tunnels.
3. QA resolves cleanup gaps, DBA reviews migration hashes and schema; record successful encrypted backup/restore rehearsal on synthetic data. Store no secrets/backups in Git.
4. Execute all63 DB tests with `ALLOW_DISPOSABLE_DATABASE_TESTS=1 npm run test:integration` only after target/acknowledgment review. Record per-test outcomes and post-cleanup residue/FK/rollback evidence.
5. Obtain separate explicit staging-deployment approval, artifact identity and safe branch mapping. No main merge: Hostinger might auto-deploy it.
6. Run independent authenticated positive/negative smoke matrix, provider calls blocked; prove application/config rollback and DB recovery with write reconciliation.
7. Production requires a separate approval. No commit/push/merge/deploy authorized or performed here.

## 10. Remaining blockers, owners and release decision

**RELEASE HOLD.** Nothing from an approved staging environment is newly verified because none is accessible.

- **P0 network/build — infrastructure/build operators:** permit official engine endpoint/redirects or provide approved equivalent host, then pass generate/schema/full typecheck/build. No more repeated reinstall attempts without changed infrastructure.
- **P1 database — DBA:** provision/verify isolated disposable MySQL and securely inject test URL; no production access. Execute migration/constraint/transaction checks only after safeguards.
- **P1 cleanup — QA/DBA:** fix and test swallowed cleanup failures, shared scheduler ownership and omitted/misidentified cleanup rows. Current runner guards alone do not clear this gate.
- **P1/P2 real roles/workflows — application owner/QA:** independent synthetic accounts, mail sink, E2E and document/inbox/application isolation evidence.
- **P1 UCC — business/privacy/security owners:** explicit ownership and messaging approvals plus tests before assignment/reply enablement; retain containment meanwhile.
- **Hosting/release — account/release owners:** verify plan/runtime/port/storage/DB and backup/restore/smoke/rollback; approve staging separately.
- **Private references — GitHub account owner:** restore applicable grants if desired; six repos remain uninspected.
- Baseline broader gaps remain: legacy direct-data-consumer review, live provider/AI/SEO measurements and Graph-version compatibility, authoritative university/course provenance/publication and unread reference coverage. This plan does not silently close them.

Next action is operator provisioning/access and cleanup preparation—not production deployment or a completion claim.
