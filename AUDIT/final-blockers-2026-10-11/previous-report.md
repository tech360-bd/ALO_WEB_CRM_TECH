# ALO EDUCATION WEB_CRM — post-audit remediation and release verification

**Decision: RELEASE HOLD.** 11 October 2026. Existing Node22 / Next.js / React / TypeScript / Prisma / MySQL architecture preserved. No deployment, production connection, production-data changes, real messages, branch switch, commit or push occurred.

Evidence directory: `AUDIT/post-audit-2026-10-11/`. The original report is retained unchanged as `baseline-report.md`; original machine results as `baseline-results.json`. Prior synthetic browser evidence is retained with `baseline-` names; new browser evidence has `rerun-` names. Text logs strip terminal ANSI only; injected-error lines are synthetic test errors, not real credentials.

## 1. Original findings and severity

| Finding | Severity | Post-audit disposition |
|---|---|---|
| Missing Prisma engine prevents generation, schema validation and build | P0 release blocker | Reproduced and diagnosed; environment network restriction remains |
| No real MySQL / 63 skipped DB tests | P1 release blocker | No server/client/container runtime or test URL available; zero DB tests executed |
| User / PortalUser / Student identity confusion and private data isolation | P1 security gate | Prior namespace containment retained; affected mocked tests re-run; independent staging still blocked |
| UCC ownership and external-message policy unresolved | P1 security gate | Admin-only restrictions retained; assignment/replies remain disabled |
| Independent workflows/provider/Hostinger verification absent | P2 execution blocker; required release gate | Synthetic contracts re-run, not relabeled as live |
| Six private repository 403s | Access blocker | Current checkout access works; six still denied |
| **New: consultation DB suite inherited DATABASE_URL, deleted whole tables and referenced undefined helpers** | **P1 destructive-test hazard** | Shared fail-closed setup/runner and scoped fixtures repaired before any DB test attempt |
| **New: private-file stat/read followed symlinks and used separate path operations** | **P1 defense-in-depth** | Read now uses a no-follow, checked file descriptor; real synthetic filesystem tests pass |
| **New: Hostinger guide suggested generic `migrate resolve --applied` for changed applied migrations** | **P1 operational hazard** | Replaced with STOP/review/restore-test guidance; no ledger modifications |

## 2. Exact affected files and changes

**This remediation pass**, distinct from earlier cumulative work:
- `scripts/diagnose-prisma-runtime.mjs`: read-only version/platform/engine/config-presence evidence, no secret values or DB connection.
- `scripts/lib/test-database-safety.mjs`: shared local MySQL/test-schema validation, distinct application schema, explicit disposable acknowledgment, non-production/no-SQLite gate, credential-safe failures.
- `scripts/run-integration-tests.mjs`: validates before spawning Vitest and mapping DATABASE_URL.
- `tests/helpers/test-database.ts`, new `tests/helpers/database-test-setup.ts`, `vitest.config.ts`: shared protection also precedes direct Vitest suite imports.
- `tests/integration/consultation-workflow.test.ts`: restores missing client/run-ID/ID helpers; no table-wide deletes or application-URL fallback; exact synthetic cleanup only.
- `tests/integration/{university-monitoring,university-monitoring-rbac,partner-b2b-security}.test.ts`: explicit safe target checks and absent-DB hook guards.
- `tests/integration/content-publication-security.test.ts`: corrects conditional Prisma constructor typing; canonical mocked session declares identity domain.
- `.github/workflows/ci.yml`: explicit disposable acknowledgment for existing local MySQL CI step. Still CI-only; not dispatched here.
- `src/lib/storage/private-file-store.ts`: O_NOFOLLOW + O_NONBLOCK, descriptor stat/read/finally-close. Stops final-component symlink escape and stat/read path race; storage root/parents still require operator-controlled permissions.
- New `tests/unit/{integration-runner-safety.test.mjs,private-storage-filesystem.test.ts,ucc-private-download-policy.test.ts}` and `tsconfig.database-verification.json`.
- `.gitignore`: excludes downloaded `.cache` verification runtime. No application files removed.
- `docs/{POST-AUDIT-STAGING-VERIFICATION,UCC-OWNERSHIP-RELEASE-GATE}.md`, `docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md`, generated `docs/environment-classification.json`, report/evidence updates.

No Prisma version, schema provider, generator target, package dependency, migration SQL, UCC assignment gate or external-send gate changed in this pass. Existing uncommitted implementation remains on `arena/8b727e17-alo-education-z-ai`, HEAD `c5bfcbbaef4e612eddb55f5f8516e5b1526e68cc`.

## 3. Root cause and supporting evidence

### Prisma P0
Exact failing command: `npm run db:generate` → `prisma generate`. `npm run db:validate` and `npm run build` fail at the same engine-download prerequisite; Next compilation is never reached.

Exact URL:
```
https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine.gz.sha256
```
Error: `Client network socket disconnected before secure TLS connection was established`.

Independent curl probes for both checksum and engine archive: exit35, `SSL_ERROR_SYSCALL`, HTTP **000** (no HTTP response). DNS resolved to Cloudflare addresses. npm registry and the exact engine-commit GitHub endpoint returned HTTP200 with valid TLS. No proxy, custom CA, TLS bypass, engine mirror, binary path override or checksum bypass was configured. The sandbox permits npm/GitHub but not the Prisma binary host. This establishes a network-access blocker; no certificate rejection or binary-execution failure was observed.

Installed CLI/Client/@prisma/engines: **6.19.3** each. Wrapper `7.1.1-3.c299…` is explicitly required by the installed engines package, not an accidental Prisma7 upgrade. Generated client agrees on 6.19.3, engine commit, MySQL and library engine. Node22.22.3; Debian12; Linux x64; OpenSSL3.0.20. Prisma detects `debian-openssl-3.0.x`, present in the existing generator targets. Native schema/query engines absent. No evidence supports changing versions or targets to fix this TLS failure.

Official v6 Prisma docs were read through the accessible GitHub repository, pinned at `c05758d0364384c5cf4bb8aed75fd33e0d72043e`; URLs and excerpts in `prisma-official-guidance.json`. Official installer postinstall and `prisma generate` are the prescribed path. An operator-controlled mirror is documented but not available/configured here.

### Database and storage
Skipped consultation bodies concealed missing identifiers (`client`, `ids`, `runId`, `requireClient`, `databaseUrl`) and broad deletes in setup. Safe guard tests alone had not proved all suites used the guard. New setup validates before imports, and a dedicated TypeScript project checks skipped DB bodies.

Private storage's old `stat(path)` followed links, then `readFile(path)` resolved the path again. Real filesystem fixtures now prove symlink/path substitution denial and normal read/write/delete behavior. No real student files were used.

## 4. Remediation performed

- Preserved branch, dirty state and historical results; inspected diff/report before editing.
- Re-ran official `npm rebuild @prisma/engines --foreground-scripts`. It returned exit0 **without installing the required engines**; subsequent generate/validate/build still failed. The installer success is explicitly not called a fix.
- Did not use arbitrary engines, unchecked downloads, version changes, `--no-engine`, disabled TLS/checksums, SQLite substitution or production DB access.
- Repaired the unsafe integration runner/suite and added direct-execution protection plus run-owned cleanup. Requires `ALLOW_DISPOSABLE_DATABASE_TESTS=1` only after operator confirms isolation. A localhost/test-name check cannot itself prove a tunnel is not production.
- Hardened private file reads and added URL/record/domain/audit/integrity/assignment regression coverage.
- Documented UCC responsibility and policy requirements as **proposed approval gates**, not approved business rules. No privilege or messaging capability enabled.
- Added a reproducible official-engine/MySQL verification path and approval-gated staging plan; removed unsafe migration-ledger advice.

## 5. Commands and tests executed

All logs below are in the evidence directory:

| Command/action | Evidence |
|---|---|
| cwd, branch, status, log, diff checks; versions/OS/OpenSSL | report context and `prisma-runtime.json` |
| `npm run db:generate` before/after official reinstall | `prisma-generate.txt`, `prisma-generate-after-reinstall.txt` |
| DNS/curl checksum/archive, npm/GitHub controls | `network-probes.json` |
| `npm rebuild @prisma/engines --foreground-scripts` | `prisma-official-reinstall.txt` |
| `npm run db:validate`; `npm run build` | `prisma-validate.txt`, `production-build.txt` |
| `npm run test:integration` (without configured test DB) | `integration-run.txt` — safely refuses |
| `npm test` | `full-tests.txt` |
| `npm run lint` | `lint.txt` |
| `tsc -p tsconfig.database-verification.json --noEmit` with 2800MiB heap | `database-typecheck.txt` |
| `tsc -p tsconfig.registration-verification.json --noEmit` with 2800MiB heap | `registration-typecheck.txt` |
| `npm run typecheck:references` with 2800MiB heap | `references-typecheck.txt` |
| Selected real-handler auth/registration/UCC tests | `security-regressions.txt` |
| Real synthetic filesystem + private download handlers | `private-file-tests.txt` |
| `node --test tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | `deployment-contract-tests.txt` |
| Build/rerun reference, module-export, lead and SEO browser scripts | `browser-build.txt`, `rerun-*.json` |
| CI YAML parse, `npm run audit:env`, `git diff --check` | parse succeeded; `environment-audit.txt`; clean diff check |
| Sanitized `gh api --include` access checks | `github-access.json` |
| Hostinger public support HTTPS attempt | `hostinger-access.txt` |

## 6. Actual results and historical comparison

| Check | Prior historical result | New result |
|---|---|---|
| Full local suite | 1,594 passed / 63 skipped | **1,625 passed / 63 skipped / 0 failed**, 156 files passed + 5 skipped, 86.94s |
| Full lint | PASS | **PASS**, exit0 |
| Both focused application TypeScript checks | PASS | **PASS**, exit0 each |
| Dedicated DB-suite TypeScript | Not previously included | **PASS** after repairing latent constructor/helper defects |
| Generated Prisma Client verifier | 532 models | **532 models**, not engine/runtime verification |
| Deployment/runtime assertions | Historical | **16 passed**, isolated/static—not Hostinger runtime |
| Selected security tests | Prior mocked evidence | **104 passed** in selection; **20 passed** in private-handler/filesystem selection; selections overlap full suite |
| Diagram/marketing/Kanban/SEO browser | Synthetic PASS | **Synthetic PASS again**, prior artifacts preserved |
| Prisma generation / validation / production build | BLOCKED | **BLOCKED**, exit1 before Next |
| Full-app default TypeScript | Sandbox OOM | **NOT RERUN**; focused checks do not clear full-app gate |
| Real database/provider/independent staging E2E | Unverified | **BLOCKED / NOT TESTED**, no live success claim |

Machine summary: `results.json`. No tests were disabled to make the new suite pass. Original 63 database skips remain skips.

## 7. Database integration status

Actual schema datasource: `mysql`, `env("DATABASE_URL")`; generated client also MySQL. Both DATABASE_URL and TEST_DATABASE_URL absent in the sandbox. No mysqld/mariadbd/mysql/docker/podman executable found. No database was created, reset, truncated, migrated or connected to. Separate non-production DB therefore **cannot be confirmed as existing here**.

| Original DB suite | Passed on DB | Failed on DB | Still skipped |
|---|---:|---:|---:|
| Consultation persistence | 0 | 0 | 7 |
| Content publication/security | 0 | 0 | 5 |
| Partner B2B security | 0 | 0 | 23 |
| University monitoring RBAC | 0 | 0 | 13 |
| University monitoring | 0 | 0 | 15 |
| **Total** | **0** | **0** | **63** |

The visa-negative file under `tests/integration` is mock logic, not real DB integration. Typed suite compilation is not transaction proof. All 22 migration files are inventoried with hashes in `migration-inventory.json`; no migration changes this pass. FK/unique constraints, collation/SQL modes, migration drift, transactions, concurrency, rollback and representative CRUD remain **NOT TESTED on MySQL**.

Existing CI defines disposable MySQL8.4, fresh migration/status/drift/integration/standalone smoke steps. These changes are uncommitted and were not dispatched remotely. Use the runbook in a supported environment; do not claim historical CI covers this dirty tree.

## 8. Authentication, role isolation and private repositories

**PASS within explicit test scopes:** real JWT cryptographic domain/expiry/tamper checks; mocked User/Portal/Student collisions; unlabelled-token rejection/re-login path; canonical student session state; counselor ownership and B2B denials; anonymous/server-side refusal; separate inbox source keys; altered private attachment IDs; hash/audit failure prevents successful download; assignment still503; external-reply gate records zero provider calls. Filesystem tests use real temporary synthetic bytes, not mocked filesystem behavior.

**Not independently proven:** database-backed login/OTP/mail-sink flows for all roles, actual browser session switching/logout/custom NextAuth session endpoint compatibility, student A/B application/document boundaries over HTTP, assigned/unassigned counselor workflows, Portal/partner/employee journeys, application transitions and DB Kanban persistence. No admin test is counted as another role's success.

**Current UCC limitations remain:** canonical User administrators only on affected private paths. Portal admins and counselors denied. No ownership backfill by ID/email matching. Assignment503 `UCC_ASSIGNMENT_NAMESPACE_PENDING`; external reply503 `OUTBOUND_REPLY_POLICY_UNVERIFIED`. Proposed ownership/responsibility, authorization, audit, failure and messaging approval criteria: `docs/UCC-OWNERSHIP-RELEASE-GATE.md`. Provider credentials/sandbox operation absent; no real messages sent.

**GitHub:** current `engralaminn-collab/alo_education_z....ai` returns200, default `main`, reported pull/push/admin permissions true. `/user` returns200; rate limit not exhausted. Thus this is not a wholly expired/invalid connection. All six below still return403 “Resource not accessible by integration”; endpoint requires metadata-read permission. No SSO challenge header observed. Installation-repository listing also denied; owner organization endpoint404 does not prove a policy cause.
- `alo-education-uk-final`
- `alo-education-last`
- `alo-ukvi-ai-markting-platform-copy`
- `ALO-Education_LAST-TRY`
- `ukvi-ai-markting_n8n`
- `Ai-Markting-crm`

Missing repository selection/permission or integration scope is consistent with evidence; organization policy versus connector limitation cannot be definitively distinguished here. Actual names/defaults/branches/contents remain UNKNOWN for those six. The owner must review repository grants/policy or reconnect GitHub in Arena. No tokens requested or printed; access not claimed restored.

## 9. Hostinger compatibility and staging results

**Repository contract verified, actual Hostinger deployment NOT VERIFIED.** Package/runtime tests confirm Node22.x, npm, `npm run build`, `npm start` → `NODE_ENV=production node server.js`, startup file `server.js`, `.next/standalone/server.js` requirement, bind0.0.0.0 and validation of provider-supplied PORT. No assumed 3044 or invented live port.

Live service plan/panel, runtime minor, OS/architecture/OpenSSL, engine target, build memory, port, branch deployment mapping, database host/version/grants/connectivity, persistent private disk and TLS remain unknown. Hostinger support HTTPS fails TLS in this sandbox; no authenticated account access. Repository documentation cannot prove host settings. Required code variables include DATABASE_URL, NEXTAUTH_SECRET/NEXTAUTH_URL, ENCRYPTION_KEY, FILE_SIGN_SECRET, build-time NEXT_PUBLIC_APP_URL and private STORAGE_POOL_C. Values must be provided securely by the staging operator, not invented or copied from production.

**Staging deployments performed: zero.** `docs/POST-AUDIT-STAGING-VERIFICATION.md` gives official engine recovery, isolated MySQL/63-test commands and independent role/provider-mock workflow matrix. It requires encrypted backup + restore rehearsal, reviewed migration/drift plan, pinned artifact, explicit staging-only approval, smoke/negative tests and application/config/database rollback with write reconciliation. Main may auto-deploy through Hostinger: do not merge it during verification. Separate production approval remains mandatory.

## 10. Remaining blockers and release decision

**RELEASE HOLD remains mandatory.** To unblock in dependency order:
1. Approved environment permitting official Prisma engine downloads; successful generate/validate/full typecheck/build/standalone verification on the exact reviewed changes. No unsafe bypass.
2. Explicitly isolated disposable MySQL with all63 original integrations run, plus required registration/ownership/concurrency/constraint/rollback evidence. No production data.
3. Independent staged User/Portal/Student/counselor/admin/partner/employee HTTP/browser journeys and attachment/inbox isolation; no cross-role impersonated proof.
4. UCC ownership schema/reconciliation and approved messaging policy before any scoped access/assignment/reply enablement; keep current containment meanwhile.
5. Verified Hostinger staging account/runtime/port/storage/database compatibility, backups and rollback rehearsal. No automatic deployment.
6. Six inaccessible private references remain uninspected; operator grant/policy action needed.
7. Broader baseline open items remain: legacy direct data consumers and dashboards need full namespace/authorization review; live provider/AI/SEO measurements and WhatsApp Graph-version compatibility unverified; authoritative university/course provenance/publication/updates and unread supplied-reference coverage incomplete.

Successful local remediation is **not** a completed production release. Next approved action should be test-environment/network provisioning and independent verification, not deployment.
