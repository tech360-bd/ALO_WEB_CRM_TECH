# ALO Education authoritative runtime and deployment standard

GitHub → CI / validation → explicitly approved Hostinger release → Node.js 22.x → aloeducation.com.

- Only production host: **Hostinger**. No VPS, PM2, systemd, Nginx, Docker deployment or SSH release path.
- Runtime: **Node.js 22.x only**; npm >=10 (repository packageManager npm@10.9.2). Use `.nvmrc`/`.node-version` 22. Dependency engine ranges describe third-party compatibility, not application runtime selection.
- Application root: repository root. Install `npm ci`; build `npm run build`; start `npm start`. If hPanel requires a startup file, use root `server.js`, which starts the same verified standalone output. It refuses missing builds and unsupported Node majors; no dev fallback, migration, seed or external process manager.
- Set `NODE_ENV=production`. Hostinger supplies PORT. Startup binds 0.0.0.0; it does not assume a host path or process-manager installation.
- Public URL: `https://aloeducation.com`; use `www.aloeducation.com` only with approved domain configuration. No DNS change was performed.
- Database strategy: Prisma MySQL via one secret `DATABASE_URL` for the **actually provisioned Hostinger database**. Verify host/database/user/grants privately. Do not infer localhost, schema names or passwords. Existing production DB authentication failure remains unresolved. No SQLite or other provider fallback. Legacy DB_* templates are not an alternative Prisma connection strategy.
- Store auth, database, SMTP and integration secrets in Hostinger environment settings, never git. Configure NEXTAUTH_URL and NEXT_PUBLIC_APP_URL to https://aloeducation.com. Verify persistent private uploads and backups outside overwritten release directories before release; no path guessed here.
- `PRODUCTION_BRANCH=main` by repository policy. GitHub Actions is CI-only; Arena/development/feature branches cannot use repository release transports. Hostinger external Git integration is **UNKNOWN**, not proven safe. Confirm repository, selected main branch, auto-deploy restriction, application root and artifact identity in hPanel before any push safety claim beyond the repository.
- CI validates the root npm application using Node 22, Prisma generation, lint, typecheck, tests and standalone build. Hostinger release is separate and needs explicit approval. Migrations remain disabled in ordinary deployment (`SKIP_MIGRATIONS=true`); no historical migration rewritten.

All older deployment guides and exported source copies are **LEGACY / NOT USED FOR CURRENT PRODUCTION** unless explicitly consistent with this standard. Retained evidence reports describe their observation date, not the current configuration.

## Verification boundary

Node/build/start contracts can be tested without production access. A missing standalone build is an expected refusal, NOT a successful application start. Real build/start and Hostinger runtime verification must pass before claiming this migration complete. No production release, process restart, database change, DNS change or push is authorized by this document.
