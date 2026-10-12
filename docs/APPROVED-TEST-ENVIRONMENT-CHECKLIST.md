# Approved isolated test environment — prerequisite checklist

Date: 2026-10-11. **RELEASE HOLD. No approved test/staging environment is verified as existing.** The current sandbox satisfies some runtime checks but lacks engine-download access, MySQL and approved role accounts. This checklist does not authorize provisioning, deployment, production connections or provider sends.

| Prerequisite | Evidence required before acceptance | Current status | Responsible role |
|---|---|---|---|
| Explicit isolated-environment approval | Owner identifies non-production account/project, test hostname, permitted operations and approves synthetic data only | **BLOCKED** — approval/target not supplied | Project owner / release owner |
| Node and npm | Node22.x per project engines/runtime guard; installed minor and npm version recorded on build and runtime hosts; sufficient RAM for full compile | **PASS sandbox only:** Node22.22.3/npm10.9.8. Staging/runtime capacity **BLOCKED** | Infrastructure operator |
| Correct Prisma packages | Lockfile install; CLI, Client and engines versions agree; generated provider/engine commit recorded | **PASS sandbox inventory:** CLI/Client/engines6.19.3, engine commit c2990dca591cba766e3b7ef5d9e8a84796e47ab7. Generation still blocked | Build operator |
| Official engine network access | DNS and certificate-validated HTTPS to binaries.prisma.sh and legitimate official redirects; checksum/archive downloads via official installer | **BLOCKED** — previous TLS failure; new reproduction recorded separately | Sandbox/network operator or approved equivalent CI host |
| Trust/time/proxy | Accurate system clock; valid CA trust; documented approved proxy if required; no TLS/checksum bypass | **PASS controls only:** npm/GitHub TLS validated; HTTP Date within1s of local time; proxy absent, npm strict-ssl=true. Prisma certificate validation **BLOCKED**: no certificate received | Infrastructure/security operator |
| MySQL provider and server | Project schema says mysql; verify disposable server version/SQL mode/collation/grants; MySQL8.4 matches existing test CI | **Provider PASS; server BLOCKED** — no local service/tool/container runtime verified | Database administrator |
| Explicit TEST_DATABASE_URL | Secure injection only; localhost/loopback alo_test_* schema required by current harness, distinct from app schema, no query transport overrides | **BLOCKED** — URL absent. Do not place URL/credentials in chat or logs | Database administrator |
| Disposable acknowledgment | Set ALLOW_DISPOSABLE_DATABASE_TESTS=1 only after isolation verified; not NODE_ENV=production; no ALO_DB_DRIVER=sqlite | **BLOCKED** — not supplied; acknowledgment alone does not establish isolation | Database administrator / test owner |
| No production credentials/data access | Separate least-privilege DB user, no production grants/tunnels, restricted network, secrets inventory and synthetic fixtures | **BLOCKED for proposed environment.** No app/test DB URL or .env file found locally; not a blanket audit of every possible secret | Infrastructure/security operator |
| Migration/cleanup safety | Review all migration hashes and actual schema; no seed/reset on production; scoped fixture cleanup; rollback/restore rehearsal | Guards pass local tests; deterministic cleanup has additional source-review gaps; MySQL verification **BLOCKED** | Database administrator / QA |
| Independent accounts | Separate User student A/B, assigned/unassigned counselor, User admin, PortalUser admin, employee, partner A/B; suspension/expiry cases; safe mail sink | **BLOCKED** — no DB-backed accounts verified | Application owner / QA |
| Provider isolation | Mock adapters or approved provider sandbox, mail sink, deny real outbound messaging; no production credentials | Local mocks only; staging/sandbox **BLOCKED** | Integration owner / privacy reviewer |
| UCC controls | Keep private access admin-contained, assignment/replies disabled; explicit ownership and messaging approvals before enablement | **Retained**, approvals **BLOCKED/not granted** | Business/privacy/security owners |
| Representative staging | Account/plan supports this Node/Next standalone deployment; verify runtime OS/arch/OpenSSL, assigned port, private persistent storage, TLS and DB reachability | **BLOCKED** — no Hostinger or equivalent environment evidence | Hosting account owner |
| Backup and rollback | Encrypted test DB/private-files backup, isolated restore proof, pinned prior artifact/config and approved migration plan | **BLOCKED** — no environment/backup/restore evidence | Release owner / DBA |

## Acceptance order

1. Owner supplies approval and operator-provisioned isolated host/access through approved secure channels. No production URL, password or token in conversation.
2. Network operator permits official Prisma endpoint with normal TLS validation, or provides a representative approved CI/staging host that can access it. Do not work around this sandbox's egress policy.
3. Follow `POST-AUDIT-STAGING-VERIFICATION.md`: lockfile install, official generation/validation, full compilation/build and standalone validation.
4. DBA verifies separate disposable MySQL and least-privilege credentials before any migration/test execution. No private database port should be publicly exposed; the existing harness intentionally accepts loopback only.
5. Run all63 DB tests and record individual outcomes; perform independent authenticated role journeys using synthetic data and no real provider sends.
6. Obtain actual hosting settings, backup/restore/smoke/rollback evidence. Release stays HOLD until every required check and separate approval gate passes.

**Do not claim any missing environment prerequisite has been created or verified by writing this checklist.**

## Current evidence

See `AUDIT/final-blockers-2026-10-11/`: runtime inventory, exact generation/installer output, DNS/curl/OpenSSL/Node TLS diagnostics, account-access results and individual blocked database-test inventory. `database-harness-review.md` identifies cleanup corrections required before enabling the suites. Historical full-suite results remain in previous reports; the current selected local run is121 passed, not a full or staging run.
