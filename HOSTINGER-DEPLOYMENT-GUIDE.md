# Hostinger deployment guide

The only supported production architecture is **Hostinger + Node.js 22.x + npm**, serving **aloeducation.com**.

See [HOSTINGER-RUNTIME-STANDARD.md](HOSTINGER-RUNTIME-STANDARD.md) for the authoritative build/start/environment/database contract, and [DEPLOYMENT_ENTRYPOINT_MATRIX.md](DEPLOYMENT_ENTRYPOINT_MATRIX.md) for branch ownership.

Use the repository root: `npm ci` → `npm run build` → `npm start`. If Hostinger asks for a startup file, select `server.js`. No generic cPanel hook, static/PHP fallback, SSH transport or system process manager is required or authorized.

Production uses the actual Hostinger-provisioned MySQL connection in `DATABASE_URL`. Do not substitute a sample database or infer credentials from historical deployment files. Verify persistent private storage outside overwritten releases before deployment.

GitHub Actions validates only. Hostinger's selected production branch must be `main`, with Arena/feature/development excluded from production triggers. Actual hPanel settings remain UNKNOWN and must be inspected before complete push safety can be asserted. No production deployment is authorized here.

Actual build/start, database health, artifact identity and full runtime verification remain BLOCKED.

## Filename history

This file was previously named `CPANEL-DEPLOYMENT-GUIDE.md`, and before that it
contained generic cPanel instructions. On 2026-10-13 every cPanel-named artifact
in the repository was removed at the owner's direction, because Hostinger is the
only authorized runtime and the cPanel material was obsolete, publicly served
(`public/docs/`), or contained infrastructure detail that should not ship:

| Removed | Why |
|---|---|
| `CPANEL-DEPLOYMENT-GUIDE.md` | renamed to this file; its content was already Hostinger-only |
| `CPANEL_DEPLOYMENT_GUIDE.md` (root) | obsolete cPanel settings, real account/database names, absolute server paths |
| `public/docs/CPANEL_DEPLOYMENT_GUIDE.md` | the same document **served publicly** from `public/` |
| `documentation/CPANEL-DEPLOYMENT-GUIDE.md` | generic cPanel guide; also the file where a real production DB password was once committed |
| `CPANEL_DEPLOY_COMMANDS.txt` | obsolete cPanel SSH/permission/restart commands |
| `cron/CPANEL_CRON_COMMANDS.txt` | cPanel crontab lines referencing `cron/*.php` wrappers that do not exist in this repository |
| `docs/runtime-standard/LEGACY-CPANEL-GUIDE.md` | retired cPanel discovery record |
| `.live-cpanel-evidence-dir` | pointer to `evidence/live-cpanel-final-20260801-021935`, a directory that no longer exists |
| `alo-education-web-crm-final/{CPANEL_*,\.live-cpanel-evidence-dir}` | duplicates inside the legacy exported copy |

Scheduling for the current runtime is documented in [CRON_JOBS.md](CRON_JOBS.md).
