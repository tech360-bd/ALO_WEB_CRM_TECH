# LEGACY / NOT USED FOR CURRENT PRODUCTION

Superseded by HOSTINGER-RUNTIME-STANDARD.md. Earlier discovery instructions are retained unchanged below.

> Deployment ownership update (2026-10-01): GitHub Actions is CI-only. Legacy release/recovery entries are disabled. Hostinger external branch selection remains UNKNOWN. See [DEPLOYMENT_ENTRYPOINT_MATRIX.md](DEPLOYMENT_ENTRYPOINT_MATRIX.md); older release instructions below are historical and must not be executed.

# ALO Education — cPanel deployment guide

**BLOCKED — hosting contract not supplied or machine-verified (2026-10-01).**
The single application is the existing root Next.js standalone platform. No module, portal, database or private document is replaced. Historical nested copies are not deployment targets.

## Required non-secret hosting record

Fill these from the provider account; blanks are deliberate, not default values:

```text
HOSTING_PROVIDER=
CPANEL_URL=
CPANEL_USERNAME=
CPANEL_NODEJS_SUPPORT=
NODE_VERSION_AVAILABLE=
NPM_VERSION_AVAILABLE=
NODE_APPLICATION_ROOT=
NODE_APPLICATION_URL=
NODE_APPLICATION_PORT=
NODE_APPLICATION_STARTUP_FILE=
DOMAIN=
WWW_DOMAIN=
DOCUMENT_ROOT=
CPANEL_GIT_REPOSITORY_PATH=
CPANEL_DEPLOYMENT_METHOD=
CPANEL_DEPLOYMENT_HOOK=
CPANEL_GIT_BRANCH=main
```

These are discovery fields, not invented application environment consumers. Do not enter credentials in this document. cPanel credentials belong only in an approved deployment secret store after the actual API mechanism is chosen.

## Target architecture

Approved GitHub `main` commit → blocking CI → provider-supported cPanel deployment → managed Node application → MySQL → HTTPS `aloeducation.com`.

Repository requires Node >=22 and npm >=10; provider versions remain unknown. PHP/static-only hosting cannot run this SSR application. Confirm the managed runtime supports the standalone server, its native dependencies (including Prisma and sharp), process memory, filesystem writes, timeouts and scheduled jobs before enabling deployment.

`npm ci`, `npm run build`, `npm run start` are existing commands. Startup currently executes `.next/standalone/server.js`. Confirm the provider accepts that startup path or requires a wrapper before changing it. The generated server owns port/hostname handling; the hosting `PORT` is authoritative. No fixed port or interface is required by these instructions.

## Deployment contract still required

The provider must support deploying the **exact validated SHA**, not merely pulling a moving main branch. Disable any independent auto-deploy that bypasses Actions validation. Deployment must report completion (not just webhook acceptance), restart via the managed runtime, and allow bounded status polling. No generic webhook payload is assumed.

Native Git deployment requires a checked-in `.cpanel.yml`, clean working tree and a branch according to [cPanel documentation](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/). No `.cpanel.yml` is created yet: target path, approved artifact transfer/build method, runtime environment inheritance and restart semantics are unknown. A wildcard copy of the repository is not an acceptable replacement.

Build and verify server, static assets, public assets and an explicit production file manifest. The repository verifier now checks server/static/public presence. Full native-platform compatibility and deployment-package validation are still blocked by the unsuccessful build and unknown target. Never package `.env`, Git metadata, tests, private storage, backups or generated user data. Preserve runtime files dynamically consumed by AI/research modules; standalone tracing alone has not been proven sufficient for those files.

## Persistent data

Inventory every current storage location before enabling a release switch. `src/lib/storage-service.ts` uses working-directory-relative `storage/student-partner`, `storage/official`, `storage/operational`; upload endpoints use `STORAGE_POOL_C`. Video output uses `public/uploads/videos`. Standalone startup changes the working directory, so configure stable private directories or reviewed links outside release trees before deployment. Do not silently move existing files or rewrite saved file paths.

Private student documents must stay outside the public document root. Uploads, documents, financial records, attachments, generated files, database and environment settings must not be overwritten or deleted by code replacement. Preserve explicitly published video separately from private documents. Existing file migration requires a verified backup and path/access tests.

## Acceptance

Actual cPanel receipt of SHA, managed startup, HTTPS, database readiness, authenticated portal/RBAC/CRM checks and persistent-file access are all mandatory. No such deployment is verified in this session. See PRODUCTION-READINESS.md.
