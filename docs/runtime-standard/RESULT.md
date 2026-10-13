# Runtime standard — current verification checkpoint

**Status: BLOCKED.** Repository contract corrections are in place, but the required successful production build/start and actual Hostinger verification have not been demonstrated. No deployment, push, merge, production configuration/data change or migration rewrite was performed.

## Authoritative runtime

Hostinger only → Node.js **22.x** → root npm application → **aloeducation.com**. See [HOSTINGER-RUNTIME-STANDARD.md](../../HOSTINGER-RUNTIME-STANDARD.md). Root engines/lockfile and version files select 22; build/start reject other Node majors. npm start uses server.js to launch only a verified standalone build, with Hostinger PORT and no dev fallback or process manager. No migration/seed is run at startup.

## Follow-up corrections

- Replaced the deployment validator's old PM2/fixed-port/root-directory assertions with the Hostinger runtime and deployment contract suites.
- Replaced the Bun development launcher with the same Node 22/npm toolchain.
- Disabled the old PHP install checker before any environment/database probe; commented out legacy public_html routing so it cannot overwrite Hostinger-generated routing as an active alternative.
- Disabled VPS package builders before filesystem changes and the obsolete merge-policy generator before it can recreate VPS deployment instructions.
- Replaced the generic cPanel guide with current Hostinger instructions; retained its former content in explicitly historical LEGACY-CPANEL-GUIDE.md.
- **2026-10-13 (later):** every cPanel-named artifact was removed at the owner's
  direction — `CPANEL-DEPLOYMENT-GUIDE.md` was renamed to
  [HOSTINGER-DEPLOYMENT-GUIDE.md](../../HOSTINGER-DEPLOYMENT-GUIDE.md) (its content
  was already Hostinger-only), and the obsolete/legacy/publicly-served cPanel
  documents were deleted, including the previously retained
  `LEGACY-CPANEL-GUIDE.md`. Hostinger remains the only authorized runtime; the
  removal change is listed in full in the renamed guide.
- Corrected live API/operator messages directing users to configure secrets on a VPS. Existing typing suppressions were not added or expanded; their obsolete hosting wording was corrected only.
- Kept earlier payment, document authorization, dashboard, audit and other repairs intact.

## Repository-wide occurrence evidence

The full pass scanned **5,491 text files without a text-size cutoff**, plus **315 binary files identified separately**. The snapshot contains 295 matching files / 3,826 matching lines before final line-number updates. Derived runtime outputs are excluded from recursive self-indexing. Every indexed occurrence has one of the five requested classifications; see occurrences.json and scan-summary.json. The scanner is scripts/audit-runtime-standard.py.

The remaining source candidates were reviewed individually: .gitignore package-cache patterns; historical merge manifest and SQL export; a local-tree rsync audit utility (not remote deployment); and an upstream-project pnpm attribution comment. These are not runtime selectors. GitHub Ubuntu runners are CI machines, not production hosts. Dependency package engine ranges are compatibility metadata, not ALO's selected Node runtime; rewriting them to 22 would falsify upstream constraints.

This is deployment/runtime occurrence reconciliation, not full functional verification of every business module. Historical reports, third-party attributions and negative tests may intentionally mention old providers/Node versions. No runtime success is inferred from those documents.

## Current checks

| Check | Result |
|---|---|
| npm ci | PASS, 0 vulnerabilities |
| Runtime/deployment contracts | 16 PASS; isolated startup behavior, NOT a real server |
| npm test | 449 PASS / 7 SKIP |
| npm run lint | 0 errors / 23 warnings |
| Prisma validate and generate | BLOCKED by engine download TLS failure |
| Typecheck | BLOCKED by missing generated Prisma model metadata |
| Build | BLOCKED before Next build by Prisma download |
| npm start | Refuses missing standalone build; actual start NOT VERIFIED |
| git diff --check | PASS |
| Historical migrations | No changes |

Exact current logs and exit codes: [followup/verification.json](followup/verification.json). Prior logs remain as historical evidence. Initial attempts in this continuation found dependencies absent; npm ci restored the lockfile install before the current test/lint/build attempts.

## Outstanding external acceptance

Hostinger's actual Node selector, main-only branch mapping, repository/app root, build/start configuration, provider PORT, MySQL credentials/grants, persistent private storage and artifact identity remain NOT VERIFIED. The production strategy is the actually provisioned Hostinger MySQL database through DATABASE_URL, not an invented database target. External Git auto-deployment remains UNKNOWN. Do not claim complete push or production safety from repository checks alone.

Required next gates: successful generation/build on Node 22, actual server start and readiness tests; authorized read-only hPanel/DB reconciliation; controlled review and explicit deployment approval. No automatic migration, provider change or alternative host is a workaround for these blockers.

---

## Previous checkpoint (historical)

# Runtime standard checkpoint

Status: BLOCKED — acceptance is not complete without a successful real build/start and Hostinger verification.

Active root engines/lockfile use Node 22.x, npm >=10; .nvmrc and .node-version select 22. Runtime guard rejects other majors before build/start. Root server.js starts only verified standalone output, uses Hostinger PORT, binds 0.0.0.0, and has no dev fallback, mutation or process-manager dependency. CI includes runtime/deployment contract tests.

Hostinger is the only supported production host; root HOSTINGER-RUNTIME-STANDARD.md is authoritative. Legacy PM2, shell release/restore paths remain quarantined; Nginx/Caddy/systemd config is commented out; Docker runtime is disabled and has no implicit migration. Exported application manifests refuse build/start; unverified auxiliary workers refuse start rather than silently retaining Bun as production runtime. Selected older deployment guides carry explicit legacy notices. Archived evidence is retained unchanged.

Database strategy is Prisma MySQL using the verified Hostinger-provisioned DATABASE_URL. Actual connection settings are unavailable and not invented. Domain remains aloeducation.com; no DNS changes. No credentials, migrations or production data changed. No push/deploy/merge.

## Actual checks

- npm ci: PASS, 0 vulnerabilities.
- Runtime/deployment contract tests: 14 PASS (isolated startup contract is not live-server proof).
- npm test: 449 PASS, 7 SKIP (no isolated real DB configured).
- npm run lint: 0 errors, 23 warnings.
- Prisma validate/generate/build: BLOCKED by binaries.prisma.sh TLS transport failure: `Client network socket disconnected before secure TLS connection was established`.
- Typecheck: BLOCKED: `Prisma client verification failed: Prisma model metadata is missing`.
- npm start: BLOCKED: `Missing verified standalone build. Run npm run build successfully before starting.` This is a fail-closed test, NOT successful production startup.

Full logs are copied alongside this report. Repository occurrence index classifies references; it is not a blanket semantic certification. Large generated artifacts were metadata-only, explicitly recorded. Remaining source/utility mentions require semantic review to distinguish runtime instructions, disabled tooling, dependency metadata and domain content. Do not declare every tracked occurrence reconciled from a lexical scan alone.

## External gates

Hostinger Node selector, main-only branch mapping, app root, start command, PORT injection, actual MySQL credentials/grants, private storage persistence and live artifact identity remain NOT VERIFIED. External auto-deploy remains UNKNOWN. Do not push or release based on repository tests alone. Historical reports remain timestamped evidence, not current runtime configuration.
