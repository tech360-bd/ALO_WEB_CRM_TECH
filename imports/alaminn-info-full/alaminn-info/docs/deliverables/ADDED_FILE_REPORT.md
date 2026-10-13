# ADDED_FILE_REPORT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Added File Report |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | List all NEW files added in this production build (relative to the prior state). Grouped by category: new routes, new scripts, new docs, new config. |

---

## How this report was generated

The list below was compiled from the worklog entries of all prior production tasks (BACKUP-001, HTACCESS-001, DOCS-001, etc.) plus this task's deliverables. Each file is verified present on disk.

For files added in older tasks (before the production build), the worklog entry that introduced them is referenced.

---

## Category 1: New documentation deliverables (`docs/deliverables/`)

These are the 22 documentation + inventory files added in this task (DOCS-001).

| # | File | Bytes | Purpose |
|---|---|---|---|
| 1 | `docs/deliverables/CPANEL_DEPLOYMENT_GUIDE.md` | ~30 KB | 27-step cPanel deployment procedure |
| 2 | `docs/deliverables/CPANEL_CONFIGURATION.md` | ~12 KB | cPanel Node.js App Manager field-by-field config |
| 3 | `docs/deliverables/ENVIRONMENT_VARIABLES.md` | ~18 KB | Complete env var reference (44 vars across 7 categories) |
| 4 | `docs/deliverables/DATABASE_SETUP.md` | ~16 KB | MySQL 8 setup + 55-model overview |
| 5 | `docs/deliverables/CRON_SETUP.md` | ~14 KB | 11 cron endpoints with schedules + curl commands |
| 6 | `docs/deliverables/SMTP_SETUP.md` | ~14 KB | Email setup + SPF/DKIM/DMARC + 10 email types |
| 7 | `docs/deliverables/ALO_EDUCATION_INTEGRATION.md` | ~18 KB | Higher Study ↔ ALO Education HMAC referral flow |
| 8 | `docs/deliverables/ENGLISH_PLATFORM_INTEGRATION.md` | ~12 KB | English Learning ↔ English platform HMAC referral flow |
| 9 | `docs/deliverables/BACKUP_RESTORE_GUIDE.md` | ~14 KB | Backup/restore/verify scripts + retention + off-server |
| 10 | `docs/deliverables/ROLLBACK_GUIDE.md` | ~10 KB | Code + DB rollback procedure + maintenance window test |
| 11 | `docs/deliverables/SECURITY_AUDIT.md` | ~22 KB | Security controls reference + 8 known caveats |
| 12 | `docs/deliverables/TEST_RESULTS.md` | ~16 KB | Vitest framework + 171 tests + 22 security tests |
| 13 | `docs/deliverables/BUILD_REPORT.md` | ~10 KB | Build toolchain + 7-step verification sequence |
| 14 | `docs/deliverables/LIVE_DEPLOYMENT_REPORT.md` | ~22 KB | 177-check post-deploy verification template |
| 15 | `docs/deliverables/MISSING_FILE_REPORT.md` | ~10 KB | Audit of required files (this build: 0 missing) |
| 16 | `docs/deliverables/ERROR_FILE_REPORT.md` | ~6 KB | Audit of file errors (this build: 0 errors) |
| 17 | `docs/deliverables/ADDED_FILE_REPORT.md` | (this file) | This report |
| 18 | `docs/deliverables/MODIFIED_FILE_REPORT.md` | ~6 KB | List of modified files |
| 19 | `docs/deliverables/REMOVED_FILE_REPORT.md` | ~4 KB | List of removed files |
| 20 | `docs/deliverables/DATABASE_SCHEMA_REPORT.md` | ~30 KB | 55 Prisma models grouped by domain |
| 21 | `docs/deliverables/ROUTE_INVENTORY.json` | ~25 KB | 89 page routes (auto-generated) |
| 22 | `docs/deliverables/API_INVENTORY.json` | ~30 KB | 150 API routes (auto-generated) |

**Subtotal**: 22 files

---

## Category 2: New `.htaccess` files (defense-in-depth)

Added in task HTACCESS-001.

| # | File | Bytes | Purpose |
|---|---|---|---|
| 23 | `public/.htaccess` | ~2.3 KB | File-type denylist + security headers + caching (Apache) |
| 24 | `.htaccess` (project root) | ~1.5 KB | Config file blocks + 11 internal directory blocks |
| 25 | `storage/.htaccess` | ~206 B | `Require all denied` for storage (backups/uploads/logs) |
| 26 | `db/.htaccess` | ~158 B | `Require all denied` for SQLite dev DB + migrations |
| 27 | `docs/.htaccess` | ~155 B | `Require all denied` for internal docs |

**Subtotal**: 5 files

---

## Category 3: New operational scripts (`scripts/`)

Added in task BACKUP-001.

| # | File | Bytes | Purpose |
|---|---|---|---|
| 28 | `scripts/backup.sh` | ~10 KB | MySQL backup with mysqldump + SHA-256 + retention + flock |
| 29 | `scripts/restore.sh` | ~12 KB | Interactive MySQL restore with pre-restore safety snapshot |
| 30 | `scripts/verify-backup.sh` | ~6 KB | Offline backup verification (5 checks) |

**Subtotal**: 3 files

---

## Category 4: New documentation (non-deliverables, in `docs/`)

Added in task HTACCESS-001.

| # | File | Bytes | Purpose |
|---|---|---|---|
| 31 | `docs/HTACCESS_EXPLAINER.md` | ~27 KB | 780-line rule-by-rule breakdown of every `.htaccess` rule |

**Subtotal**: 1 file

---

## Category 5: New deploy artefacts

Pre-existing in the repo but included in the cPanel deployment package.

| # | File | Bytes | Purpose |
|---|---|---|---|
| 32 | `deploy/cpanel/setup-cpanel.sh` | ~6 KB | One-time cPanel setup script (npm ci → schema swap → prisma push → seed → build) |
| 33 | `deploy/cpanel/redeploy.sh` | ~4 KB | Redeploy script (incremental update) |
| 34 | `deploy/cpanel/.env.production` | ~3 KB | Production env template (copy to .env) |

**Subtotal**: 3 files

---

## Category 6: New source code (`src/`)

Pre-existing in the repo (not added in this production build cycle, but listed for completeness).

The source code was developed across many prior tasks (architecture, Higher Study platform, English Learning platform, CRM, admin, etc.). A full inventory of `src/` files is not in scope for this report — see `ROUTE_INVENTORY.json` and `API_INVENTORY.json` for the route-level inventory.

**Subtotal**: ~500+ files (estimated; not individually listed)

---

## Category 7: New Prisma schema

| # | File | Bytes | Purpose |
|---|---|---|---|
| 35 | `prisma/schema.prisma` | ~42 KB | 1,281 lines, 55 models (Identity, CRM, Higher Study, English Learning, Audit, Media) |

**Subtotal**: 1 file (pre-existing, modified — see `MODIFIED_FILE_REPORT.md`)

---

## Category 8: New entry point

| # | File | Bytes | Purpose |
|---|---|---|---|
| 36 | `server.js` | ~3 KB | cPanel entry point — loads .env, sets NODE_ENV, requires .next/standalone/server.js |

**Subtotal**: 1 file (pre-existing)

---

## Category 9: New tests

Pre-existing in the repo (developed alongside the source code).

| # | File | Bytes | Purpose |
|---|---|---|---|
| 37 | `tests/setup.ts` | ~1 KB | Vitest setup (jest-dom matchers when DOM present) |
| 38 | `tests/lib/auth.test.ts` | ~5 KB | 24 tests for `src/lib/auth.ts` |
| 39 | `tests/lib/email-templates.test.ts` | ~4 KB | 20 tests for `src/lib/email/templates.ts` |
| 40 | `tests/lib/env.test.ts` | ~3 KB | 23 tests for `src/lib/env.ts` |
| 41 | `tests/lib/rbac.test.ts` | ~6 KB | 27 tests for `src/lib/rbac.ts` |
| 42 | `tests/unit/utm.test.ts` | ~2 KB | 18 tests for `src/lib/utm.ts` |
| 43 | `tests/api/health.test.ts` | ~3 KB | 11 integration tests for /api/health |
| 44 | `tests/api/inquiries.test.ts` | ~5 KB | 17 integration tests for /api/v1/inquiries |
| 45 | `tests/api/admin-auth.test.ts` | ~3 KB | 7 integration tests for /api/v1/auth/* |
| 46 | `scripts/security-tests.ts` | ~12 KB | 22 security tests (SQLi, XSS, CSRF, IDOR, etc.) |

**Subtotal**: 10 files

---

## Category 10: New mini-services

Pre-existing in the repo.

| # | Directory | Files | Purpose |
|---|---|---|---|
| 47 | `mini-services/email-worker/` | index.ts + package.json | Email retry queue (port 3002) |
| 48 | `mini-services/audit-worker/` | index.ts + package.json | Async audit-log writer (port 3003) |
| 49 | `mini-services/health-monitor/` | index.ts + package.json | Service health polling (port 3004) |
| 50 | `mini-services/notification-service/` | index.ts + package.json | Notification ingestion (port 3005) |

**Subtotal**: 4 directories (8+ files)

---

## Category 11: New storage directories

Auto-created by the backup scripts.

| # | Directory | Purpose |
|---|---|---|
| 51 | `storage/backups/` | Stores `.sql.gz` + `.sha256` backup files |
| 52 | `storage/logs/` | Stores `backup.log`, `restore.log`, `cron.log`, `health.log` |
| 53 | `storage/uploads/` | Private upload storage (outside public_html) |
| 54 | `storage/exports/` | CSV export staging |

**Subtotal**: 4 directories

---

## Summary

| Category | Count |
|---|---|
| 1. Documentation deliverables (`docs/deliverables/`) | 22 files |
| 2. `.htaccess` files | 5 files |
| 3. Operational scripts (`scripts/`) | 3 files |
| 4. Documentation (non-deliverables, `docs/`) | 1 file |
| 5. Deploy artefacts (`deploy/cpanel/`) | 3 files |
| 6. Source code (`src/`) | ~500+ files (pre-existing) |
| 7. Prisma schema | 1 file (pre-existing, modified) |
| 8. Entry point (`server.js`) | 1 file (pre-existing) |
| 9. Tests (`tests/` + `scripts/security-tests.ts`) | 10 files |
| 10. Mini-services (`mini-services/`) | 4 directories / 8+ files |
| 11. Storage directories (`storage/`) | 4 directories |

**Files added specifically in the production build cycle** (DOCS-001, HTACCESS-001, BACKUP-001):
- 22 documentation deliverables
- 5 `.htaccess` files
- 3 operational scripts (`backup.sh`, `restore.sh`, `verify-backup.sh`)
- 1 explainer doc (`docs/HTACCESS_EXPLAINER.md`)

**Total new files in production build cycle**: 31

---

## Verification

To verify the files added in this production build cycle are present:

```bash
cd ~/alaminn.info

# Category 1: Documentation deliverables
ls docs/deliverables/ | wc -l   # Expect: 22

# Category 2: .htaccess files
ls -la public/.htaccess .htaccess storage/.htaccess db/.htaccess docs/.htaccess
# Expect: all 5 files exist

# Category 3: Operational scripts
ls -la scripts/backup.sh scripts/restore.sh scripts/verify-backup.sh
# Expect: all 3 files exist, mode 755

# Category 4: HTACCESS explainer
ls -la docs/HTACCESS_EXPLAINER.md
# Expect: file exists
```

---

## Reference

- **Production build cycle tasks**: DOCS-001, HTACCESS-001, BACKUP-001
- **Pre-existing source**: developed in earlier tasks (not listed individually)
- **Audit date**: 2026-07-19
- **New files in build cycle**: 31
- **Pre-existing files**: ~500+
