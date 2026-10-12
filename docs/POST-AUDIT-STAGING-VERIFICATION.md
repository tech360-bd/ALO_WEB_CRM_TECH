# Post-audit verification and staging runbook

**RELEASE HOLD. No commands below authorize deployment or production-data access.**

> Final-blocker review: obtain every prerequisite in `APPROVED-TEST-ENVIRONMENT-CHECKLIST.md` before enabling DB suites. The latest `AUDIT/final-blockers-2026-10-11/database-harness-review.md` found additional deterministic-cleanup gaps (swallowed failures, shared monitoring job, incomplete row cleanup). The commands below are gated plans, not certification that cleanup or staging is ready. Use only an operator-confirmed disposable environment. The existing stack remains Node22/Next/React/TypeScript/Prisma/MySQL.

## A. Restore the official Prisma download path
Evidence: `AUDIT/post-audit-2026-10-11/prisma-runtime.json`, `network-probes.json` and generation logs.

This sandbox resolves DNS but cannot complete TLS to binaries.prisma.sh; HTTP status is 000 (not HTTP 403/404). npm and GitHub return 200. Its outbound host policy does not permit Prisma's engine host. No proxy/CA override was configured. Installed CLI, Client and engines are 6.19.3; the engine-wrapper version `7.1.1-3.c299...` is the **declared dependency** of @prisma/engines 6.19.3, not proof of a CLI mismatch. Debian12/x64/OpenSSL3 resolves to the configured `debian-openssl-3.0.x` target.

On an approved Node22 host with access to registry.npmjs.org and binaries.prisma.sh (including legitimate CDN redirects), in a disposable checkout of the exact reviewed commit:

```sh
node --version
npm ci
node scripts/diagnose-prisma-runtime.mjs
npm run db:generate
npm run db:validate
npm run db:verify-client
```

Supply DATABASE_URL securely for the isolated database before validation; do not paste it into shared logs. `npm ci` uses the existing lockfile. If the install hook was interrupted, `npm rebuild @prisma/engines --foreground-scripts` reruns the official installer. Its exit 0 is insufficient: generation and engine-file checks must succeed. That installer returned 0 here while generation remained blocked.

Do not use `--no-engine`, TLS bypass, checksum bypass, SQLite substitution, an arbitrary binary, or an unreviewed Prisma version upgrade to manufacture a passing build. If network policy requires an operator-controlled `PRISMA_ENGINES_MIRROR`, it must mirror the official exact commit/platform artifacts **and checksums**, with verified provenance, using Prisma's documented mirror mechanism. No mirror is configured here. Official v6 documentation excerpts and pinned GitHub sources are in `prisma-official-guidance.json`.

Then run full `npm run typecheck` with sufficient memory (existing CI uses a 6144 MiB Node heap plus swap), `npm run lint`, `npm test`, `npm run build`, and `node scripts/verify-standalone.mjs`. Never count focused typechecks as the full-app gate.

## B. Disposable MySQL and migrations
Use MySQL8.4 as the repository's existing CI service does; this is a **test target**, not a claim about the live Hostinger DB version. Confirm provider/version on staging before proceeding. Do not substitute MariaDB/SQLite and call it MySQL parity.

Have the operator create isolated application, `alo_test_*`, and shadow schemas on a throwaway localhost-bound server, with credentials restricted to those schemas. Do not tunnel production to localhost. Test guards require explicit acknowledgment; names alone do not prove isolation.

1. Review all 22 migrations and hashes before applying. No edits to historical migrations in this remediation. Confirm real foreign keys, collation/SQL modes, grants and migration ledger on the disposable clone.
2. Run `prisma migrate deploy` and `prisma migrate status` on the disposable schema. Never `reset`, `truncate`, seed or `db push` production. Review drift using a separate disposable shadow database and existing `scripts/ci/filter-lob-default-drift.mjs`; do not suppress real constraint changes.
3. Set `TEST_DATABASE_URL` securely to the isolated local `alo_test_*` schema. Keep any application DATABASE_URL distinct. Confirm non-production, then:

```sh
ALLOW_DISPOSABLE_DATABASE_TESTS=1 npm run test:integration
```

The runner and Vitest setup validate the target **before** DB imports. The consultation suite performs only run-ID cleanup. Original DB suites: consultation 7, content publication 5, partner B2B 23, university monitoring RBAC 13, university monitoring 15 = 63. The visa file under integration is local mock logic, not real DB proof.

Existing CI `.github/workflows/ci.yml` has a disposable MySQL job with fresh migrations, drift, integration tests and standalone HTTP smoke. Its acknowledgment was updated for the safe runner. No remote workflow for these uncommitted changes was dispatched; no passing CI result is claimed. Reviewing/running a PR on this exact branch is an option after explicit commit/push approval, without merging main.

## C. Independent workflow acceptance (not yet executed)
Use a mail sink and network-denied/mock provider adapters; never configure real marketing credentials for these tests. Provision separate synthetic student A/B, counselor assigned/unassigned, canonical admin, PortalUser admin, partner A/B and employee. Do not reuse an administrator session as proof of another role.

For each test, record reviewed commit, role/domain, request, expected/actual status and redacted persistent-row evidence:
- Public register → pending User/Student/Lead exact link → OTP via mail sink → activation → eligible assignment → sign-in → own student dashboard and scoped counselor queue; duplicate/contact-overlap and failed audit/rollback.
- Old unlabelled JWT redirects to re-login; token tamper/expiry, User/Portal/Student ID collision, suspension/revocation, cookies and logout. Verify NextAuth clients and custom `/api/auth/session` compatibility.
- Student A cannot read B's documents/application/messages; counselor cannot substitute unassigned IDs; independent Portal/partner tenant boundaries.
- Application workflow transitions, unsupported transitions, atomic audit and concurrent update; private download direct URL/ID changes and filesystem integrity.
- UCC current admin-only restriction, assignment503, reply503, no provider calls, source-separated history and failed-audit handling.
- SEO stored results and failures without invented ranks; five diagram exports, draft marketing copy/PNG/SVG, Kanban actual DB reload/409 rollback.

## D. Hostinger evidence to obtain before staging approval
Repository-verified contract: Node22.x; npm ci; npm run build; npm start = `NODE_ENV=production node server.js`; root startup file server.js requires verified `.next/standalone/server.js`; HOSTNAME set to 0.0.0.0. Provider-supplied PORT validated; **actual Hostinger port unknown**. Do not assume retired 3044.

Hostinger service/plan, panel type, configured runtime minor, OS/architecture/OpenSSL, build memory, persistent disk path, reverse-proxy/trust headers, TLS, branch auto-deploy mapping and MySQL endpoint/version/grants are **NOT VERIFIED**. Public Hostinger support TLS and panel access unavailable here. Obtain redacted settings/evidence from the account operator; do not treat repo docs as live settings. Do not merge main: it may trigger Hostinger automatically.

Required code configuration includes DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ENCRYPTION_KEY, FILE_SIGN_SECRET, NEXT_PUBLIC_APP_URL (build-time), and STORAGE_POOL_C (absolute persistent private path outside web root) for private documents. Actual values must come from the approved staging account and remain secret. Use staging origin, not aloeducation.com for staging callbacks. Verify Prisma platform on **both build and runtime hosts**, generated native query library included in standalone, and a minimal authenticated DB query. Config presence or a 200 page is not this proof.

## E. Approval-gated staging plan
Preparation only until owner approval:
1. Preserve baseline artifacts/config metadata; encrypted database and private-storage backup with restore rehearsal in isolated environment. Store neither credentials nor backups in Git.
2. Security/business review the cumulative patch, all disabled UCC capabilities and ownership policy. Independently approve migration plan; stop on unexpected drift/history checksums. Do not blindly `migrate resolve --applied` an already-applied changed migration.
3. Obtain explicit **staging-only** deployment approval, target hostname/account/schema and artifact commit. No main merge or production branch mapping change.
4. Deploy verified artifact to staging using operator-approved Node workflow; apply reviewed migrations there only; start with provider sends blocked.
5. Execute section C and record logs/DB evidence; monitor errors and provider call counters. Restore/retest rollback using prior artifact/config; keep additive schema fields. DB restore requires reconciliation and explicit approval.
6. Keep RELEASE HOLD if any critical gate fails or is missing. Staging success alone is not production approval. Production requires a separate explicit release decision, backup, migration review, smoke/rollback plan and authorization.
