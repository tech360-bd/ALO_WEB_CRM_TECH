# `alo-cpanel/` — STATUS: LEGACY, NOT PART OF THE PRODUCTION RUNTIME

**Classification (2026-09-18 merge audit): `LEGACY` / `HISTORICAL REFERENCE`**

| | |
|---|---|
| Origin | `other-ai-builder-2026-09-13` branch, commit `b22a18ae` ("chore: upload other AI builder ALO source for comparison") |
| Stack | PHP 8 + PDO/MySQL, server-rendered pages, cPanel hosting assumptions |
| Files | 83 PHP/CSS/JS/SQL files |
| Deployed by | **nothing.** No GitHub workflow, deploy script, `Dockerfile`, `nginx.conf` or PM2 config references this directory |
| Production runtime | **Next.js 16 on Node 22, PM2 `alo-education`, port 3044** — see `.github/workflows/deploy-production.yml` |

## Why it is kept rather than deleted

The merge brief required that a secondary source be analysed and preserved rather
than discarded, and that legacy technology be *classified* rather than removed on
sight. This directory is the second AI builder's complete alternative
implementation of the same CRM (leads, students, applications, courses,
universities, communications, marketing, finance, tasks, reports, users, cron).
It is retained as a reference for behaviour that may not yet exist on the
Next.js side, and as evidence in the merge audit.

## Why it is NOT wired into production

The brief states the intended production system is VPS-based and asks that
cPanel/PHP references be classified and that the active runtime not depend on
obsolete infrastructure. Porting 83 PHP files into the Next.js app would be a
rewrite, not a merge, and would duplicate routes that already exist under
`src/app/api/`. So it is quarantined here, inert, with no route, build or
deploy path reaching it.

## Security note — it shipped with real credentials

`config/config.php` in the original commit contained:

- the **real production database password** (the same value previously found in
  `OPERATIONS-BOOK.md` — see `docs/SECURITY_FINDINGS_2026-09-18.md`, SEC-D)
- the **real database username**
- a default `APP_KEY` placeholder used as a live value

All three were replaced with `getenv()` lookups during this merge
(`alo_env()` helper, no insecure fallback). `install.php`'s form placeholder
that echoed the real username was also generalised. **The password must still
be treated as compromised and rotated** — it remains in git history on the
`other-ai-builder-2026-09-13` branch.

Two further hazards if this code were ever deployed:

1. `install.php` is a web-reachable installer that **overwrites
   `config/config.php`**. It does guard on a `.installed` marker file, but a
   live deployment must confirm that marker exists, or the file must be
   removed after install.
2. `uploads/` is web-served; the `.htaccess` files there must be verified on
   the target host before any upload path is enabled.

## If you want its functionality

Compare feature-by-feature against `src/app/api/` and port deliberately:

| cPanel area | Existing Next.js equivalent |
|---|---|
| `leads/`, `students/`, `applications/` | `src/app/api/crm/`, `src/app/api/applications/`, `src/app/crm/` |
| `communications/`, `whatsapp/` | `src/app/api/communications/`, `src/lib/whatsapp-cloud-api.ts` |
| `marketing/` | `src/app/api/marketing/`, `src/lib/marketing/` |
| `finance/` | `src/app/api/commissions/`, `src/lib/double-entry-ledger.ts` |
| `cron/` | `src/app/api/cron/` (now guarded by `src/lib/cron-auth.ts`) |
| `app/csrf.php`, `app/permissions.php`, `app/validation.php` | `src/lib/auth-middleware.ts`, `src/lib/access-control/` |
| `database/schema.sql` | `prisma/schema.prisma` (479 models vs this app's ~40 tables) |

The Next.js implementation is the larger and more complete of the two; nothing
was found in this directory that the main app lacks at the data-model level.
