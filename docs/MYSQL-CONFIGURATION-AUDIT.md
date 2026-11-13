# MySQL configuration audit and safe production verification

**Repository checkpoint:** `main` / `origin/main` and this Arena branch resolve to
`40da1ebbdac13827ba5bd5ddd6d8ae950aeb3749` at audit start (2026-10-24). The
working tree was clean before this audit. This document records repository
facts, not a claim of access to Hostinger's process or database.

## Repository configuration findings

- `prisma/schema.prisma` has one MySQL datasource: `url = env("DATABASE_URL")`.
- `src/lib/db.ts` creates the ordinary Prisma client without another datasource
  override. Production uses the generated Prisma MySQL datasource; the explicit
  SQLite adapter branch is only selected by `ALO_DB_DRIVER=sqlite` for local
  verification.
- The root Next.js application does not consume `DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_USERNAME`, `MYSQL_URL`, or
  `DIRECT_URL` as its database configuration. Supplying those values does not
  create or override Prisma's `DATABASE_URL`.
- `server.js` asserts Node 22, sets `NODE_ENV=production` and `HOSTNAME`, then
  starts `.next/standalone/server.js`. It does not define credentials or create
  a production `.env`. The package build generates Prisma Client and the
  standalone artifact; the ordinary app database URL is needed at runtime, not
  embedded by this build script. The CI build explicitly says it does not
  connect to a database. `NEXT_PUBLIC_*` values are a separate build-time
  concern.
- Next dotenv precedence used by the diagnostic is
  `.env.production.local`, `.env.local`, `.env.production`, `.env`; an already
  present process `DATABASE_URL` takes precedence. A Hostinger-protected
  environment is only proven to be the active source when the actual application
  process (or an invocation that inherits its environment) is inspected.
- The root `.env.example` previously listed unused Laravel-style `DB_*` values
  alongside `DATABASE_URL`, which could suggest that both are required. It now
  documents only the canonical Prisma URL. `.env.production.example` already
  documented the same contract and clearly marks the parallel `DB_*` family
  unused.
- Several separate project copies are tracked in the repository. Root `package.json`
  is the active repository contract (`npm run build`, `npm start`, root `server.js`).
  `deploy-build/` and `alo-education-web-crm-final/` package scripts deliberately
  throw `LEGACY / NOT USED FOR CURRENT PRODUCTION`; `imports/alo-education-full/`
  and `imports/alo-education-source/` are older copies with their own package
  scripts and SQLite datasource schemas. If Hostinger's configured app directory
  points to one of those copies instead of the root, its database/runtime
  behavior can diverge substantially. The actual Hostinger app root was not
  accessible, so this is a verified repository risk, not a proven production
  cause.
- Separate legacy/manual tools exist: `scripts/seed-direct-mysql.js` calls
  dotenv and reads `DATABASE_URL`; backup/restore shell tools read `DB_*` values
  (some have legacy defaults); and the quarantined `.zscripts/start.sh` has an
  unreachable historical SQLite/URL fallback. None is the root app's Prisma
  configuration. Do not run a seed, backup/restore, packaging, migration, or
  deployment script as a connection test. The legacy startup script's old
  connection-string echo was replaced with a redacted message.
- Two tracked `.env` files exist inside imported legacy source trees, not at the
  root Next.js app directory. They contain non-empty `DATABASE_URL` assignments.
  Their values were not displayed or used. They are not the root app's dotenv
  files; confirm their archival status and whether any included credentials are
  still valid through a secure review. If any are live credentials, remove them
  from the public repository through the approved secret-remediation process and
  rotate at the provider; deleting a file alone does not erase Git history.

## GitHub Actions and deployment ownership

- `.github/workflows/ci.yml` is CI-only. Its `DATABASE_URL` assignments are
  step-scoped disposable MySQL service URLs, not production configuration. The
  production build has no production database credential.
- `.github/workflows/deploy-production.yml` and `deploy-recovery.yml` are
  unconditional refusal notices. There is no SSH/SCP/deploy job that maps
  `DB_NAME`, `DB_USER`, a database password, or `DATABASE_URL` to Hostinger.
  `DEPLOY_ENABLED` is not read by these workflows. Setting it to `false` is
  therefore not what enforces their block; the workflows themselves refuse to
  deploy. It must remain false unless the owner separately approves the existing
  production deployment mechanism (none is enabled here).
- GitHub Actions variable and secret listing API requests returned HTTP 403 in
  this session. Thus the names/values configured in GitHub Settings could not be
  independently verified here. Values stated in the request remain user-reported
  only. Repository source does prove that CI does not map ordinary repository
  variables into a production runtime. GitHub settings do not automatically
  become Hostinger process variables.
- Repository documentation says Hostinger owns deployment and keeps a release
  hold; actual Hostinger branch mapping, external auto-deploy, app root, build,
  startup, environment settings and deployed artifact remain unverified.

## Read-only diagnostic

`scripts/db-diagnose.mjs` / `npm run db:diagnose` is an operator CLI, not an API
route. It loads Next dotenv files, reports the selected source and sanitized
endpoint/account presence, then uses Prisma for read-only `SELECT 1`, `DATABASE()`, `CURRENT_USER()`,
`VERSION()`, `SHOW GRANTS`, and an ID-only `User` read. DNS, TCP, connection,
individual query, and disconnect operations have bounded diagnostic-only
timeouts. It reports query latency, compares the effective schema only when
given an operator-confirmed expected name, and emits no URL, password, grant
SQL, result rows, or exception message. The privilege check covers direct global/database
`SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants; it does not authorize or
verify migration/DDL privileges. Role-based grants may be reported unknown and
need a DBA review.

Run it only from an authorized server-side context. For example, after the
owner independently verifies the expected database name in Hostinger:

```sh
npm run db:diagnose -- --expected-database='OWNER_VERIFIED_DATABASE_NAME'
```

Do not run this from an ordinary SSH shell and treat it as the Node application's
runtime environment unless Hostinger confirms that the shell inherits the same
protected variables. Do not paste a `.env` file, connection URL, password, or
private key into chat. The diagnostic performs no writes, migrations, or seeds.
A successful invocation proves only the environment that invocation received;
it does not prove that a different already-running process uses the same env or
build. The production process and its process directory/build identity still
need authorized Hostinger-side evidence.

## Current conclusion and stop condition

A historical, dated production report in this repository recorded a public
health check with a database authentication failure. It did not establish
whether the mismatch was a password, account, host/grant, URL encoding, stale
runtime environment, or wrong deployed artifact. It is not current live proof.
No current Hostinger shell, hPanel, production `DATABASE_URL`, MySQL endpoint,
secret inventory, database grant list, or process metadata was available during
this audit. Therefore the exact root cause and actual production identity remain
**UNKNOWN / NOT VERIFIED**. Do not apply credentials, alter grants, run DDL,
restart a process, or deploy until the owner supplies authorized read-only
results and approves a specific change plan.
