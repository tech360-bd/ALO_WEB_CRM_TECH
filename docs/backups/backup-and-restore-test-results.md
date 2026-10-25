# Backup and restore — test results

**Date:** 2026-10-25
**Environment:** development sandbox. No MySQL server, no `mysqldump`, no
`mysql` client, no `sqlite3`, no access to the Hostinger host.
**Verdict:** backup **tooling exists and fails safely**, but **no restore has been
proven**. Nothing in this document should be read as "backups are recoverable".

## 1. What exists in the repository

| Artefact | Status | Behaviour (read from the file) |
|---|---|---|
| `scripts/backup-mysql.sh` | **active script** | Logical `mysqldump` of the application database; credentials from `DATABASE_URL` or explicit `DB_*` variables; password written only to a private `mktemp` defaults file (`umask 077`, `chmod 700` backup dir); gzip + `sha256` checksum; `set -Eeuo pipefail`; pre-flight `command -v` checks for `node mysqldump gzip sha256sum mktemp`; traps remove the credential file and any partial dump on error/SIGINT/SIGTERM |
| `scripts/backup_agentos.sh` | active script | AgentOS artefact backup (shell syntax valid) |
| `deploy/ubuntu/backup.sh`, `restore.sh`, `rollback.sh`, `deploy.sh`, `health-check.sh`, `alo-education.service` | **disabled on purpose** | Each refuses to run: they exit non-zero unless on `main`, then print `DISABLED: legacy deployment/recovery is not an approved Hostinger production mechanism` and make no change. They are retained as audit evidence, not as a recovery path |
| Hostinger backups | **external, unverified** | `HOSTINGER-RUNTIME-STANDARD.md` requires backups outside overwritten release directories and forbids guessing paths. The actual schedule, retention and restore procedure are **not recorded in this repository** |

Production is Hostinger cPanel Node.js (`HOSTINGER-DEPLOYMENT-GUIDE.md`,
`CPANEL-DEPLOYMENT-GUIDE.md` referenced from `docs/DEPLOYMENT.md`); the Docker,
Caddy, PM2 and systemd files are marked legacy and are not the live path.

## 2. Tests actually executed

| # | Test | Command | Result |
|---|---|---|---|
| 1 | Shell syntax, MySQL backup | `bash -n scripts/backup-mysql.sh` | **PASS** — no syntax error |
| 2 | Shell syntax, AgentOS backup | `bash -n scripts/backup_agentos.sh` | **PASS** — no syntax error |
| 3 | Pre-flight guard actually fires | `BACKUP_DIR=/tmp/alobk bash scripts/backup-mysql.sh` | **PASS** — exit `1`, stderr `[Backup] Required command unavailable: mysqldump`, **no partial file left in the backup dir** |
| 4 | Restore from a real dump | — | **BLOCKED** — no dump can be produced here (no `mysqldump`), and no database to restore into |
| 5 | Restore of uploaded files | — | **BLOCKED** — no access to the production `storage/` tree |
| 6 | Restore drill on a disposable MySQL | — | **BLOCKED** — no MySQL server reachable; `mysqldump`/`mysql`/`sqlite3` are all absent from this image |
| 7 | RPO/RTO measurement | — | **NOT RUN** — requires test 4 |

Test 3 matters: it is the difference between "the script silently produced an empty
backup" and "the script refused". It refused.

## 3. StarRocks tool

Reviewed and **not adopted**: ALO's databases are MySQL
(`prisma/schema.prisma` → `provider = "mysql"`), and the tool targets StarRocks
3.5+ shared-nothing only. Full reasoning and the verified upstream facts are in
`docs/backups/starrocks-compatibility-review.md`.

## 4. Restore procedure that must be proven on the host

Until this is executed and recorded with real numbers, backups remain **unverified**:

1. Take a backup with `scripts/backup-mysql.sh` into a private directory outside the
   release tree; record the `.sql.gz` name and its `sha256`.
2. Create a **disposable** MySQL database (never production, never the live schema).
3. `gunzip -c <dump>.sql.gz | mysql <disposable>` .
4. Verify: table count, row counts for `User`, `CrmUniversity`, `CrmCourse`,
   `Student`, `Application`, `PhdProposal`, referential checks, and application
   login against the restored copy.
5. Record the wall-clock restore duration and the size of the dump.
6. Only then state an RPO/RTO. Do not publish numbers that were not measured.
7. Delete the disposable database.

## 5. Gaps

| Gap | Impact |
|---|---|
| No recorded Hostinger backup schedule/retention in the repo | Cannot state an RPO |
| No executed restore test | **Recoverability unproven** |
| Uploads (`storage/**`) not covered by `backup-mysql.sh` | A database-only restore would reference files that may not exist |
| No integrity check (e.g. `mysqlcheck`) in the backup script | Corruption would only be found at restore time |
| No off-host verification of the checksum | A backup on the same disk is not a backup |
| `deploy/ubuntu/restore.sh` quarantined | There is no in-repo automated recovery path |

## 6. What can be said with evidence

* The MySQL backup script is syntactically valid, fails closed when a dependency is
  missing, keeps the password out of the command line and out of stdout, and cleans
  up partial output.
* **No restore has been performed. Backup recoverability is unproven (BLOCKED).**
* No production data was read, written or deleted during this exercise.
