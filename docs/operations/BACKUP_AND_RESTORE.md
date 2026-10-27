# Backup and restore

Applies to the current MySQL-backed application and, without change, to any call-center data added later (call recordings become one more artefact in the same set).

**Current verified position (2026-10-27): there is no evidence in this repository that a restore has ever been completed.** `deploy/ubuntu/restore.sh` is a refusal stub. Until the drill in §4 passes, no migration, schema change or pilot may proceed.

---

## 1. What must be backed up

| Artefact | Why | Sensitivity |
| --- | --- | --- |
| MySQL database | CRM, applications, memory, knowledge, call records | High — personal data |
| Uploaded documents / `storage/` | student documents, knowledge source files | High |
| Call recordings (Phase 6+) | consent evidence, dispute resolution | **Restricted** |
| `.env` / secrets | restore of a working host | **Restricted** |
| `prisma/migrations` | schema provenance | Low |
| Application source at the deployed commit | reproducibility | Low |
| AI gateway registry config | service continuity | Medium |

## 2. Existing tooling and its gaps

| Script | What it does | Gap |
| --- | --- | --- |
| `scripts/backup-mysql.sh` | parses `DATABASE_URL`, writes a 0600 `--defaults-extra-file`, `mysqldump --single-transaction` + gzip + sha256, `umask 077`, trap cleanup | no encryption of the output; no off-host copy; no retention pruning; no freshness alert |
| `deploy/ubuntu/backup.sh` | DB dump + `.env` (0600) + migrations tarball + source tarball + manifest | hard-codes `/opt/alo-education`; unencrypted `.env`; no verification |
| `scripts/backup_agentos.sh` | copies `storage/agentos.db` if it exists | the file does not exist (SQLite is verification-only) — misleading, should be marked obsolete |
| `deploy/ubuntu/restore.sh` | refuses (`exit 1`) | no restore path exists |
| `ROLLBACK-GUIDE.md`, `RELEASE_MANAGEMENT_GUIDE.md` | process guidance | not tied to a tested restore |

## 3. Target procedure (to be implemented in Phase 2/8)

```bash
# 1. Dump (existing script, unchanged behaviour)
BACKUP_DIR=/srv/backups/alo scripts/backup-mysql.sh

# 2. Encrypt (new step) — public key on the host, private key offline
age -r "$ALO_BACKUP_RECIPIENT" -o "$DUMP.age" "$DUMP"

# 3. Checksum + manifest
sha256sum "$DUMP.age" > "$DUMP.age.sha256"

# 4. Off-host copy (object storage or a second host)
rclone copy "$DUMP.age" remote:alo-backups/$(date +%F)/

# 5. Freshness record
date -u +%FT%TZ > "$LATEST_MARKER"
```

Required additions: `age`/GPG encryption, off-host copy, 30/7 daily/weekly retention with a documented deletion rule, an alert when the newest backup is older than 26 hours, and a quarterly restore drill (below).

## 4. Restore drill (must pass before Phase 2 migrations)

Run on an **isolated host**, never against production:

1. Provision a fresh MySQL 8.4 instance with an empty datadir.
2. Create the application user with least privilege; verify `SHOW GRANTS`.
3. `mysql < dump.sql` (or decrypt first); record wall-clock time and any warnings.
4. `npx prisma migrate status` — must report **no pending** and **no failed** migrations.
5. Row-count parity against the source for a fixed list of critical tables (`User`, `Student`, `Application`, `LeadForm`, `CommunicationMessage`, `CallLog`); record the numbers.
6. `GET /api/health` on a booted instance pointing at the restored DB → `200` with `status: ok`.
7. Log in as a non-admin test user; open one CRM record; confirm authorization still denies a cross-role read.
8. Restore one uploaded document and verify its `fileHash` matches.
9. Destroy the isolated instance and record the drill (date, duration, operator, anomalies) in this file.

**Pass condition:** all nine steps succeed and step 5 has zero unexplained differences. Any failure blocks migration work.

## 5. Restore verification for recordings (Phase 6+)

Recordings are large binary artefacts; the drill additionally verifies: object checksum matches the DB `fileHash`, retention job can locate and delete an expired recording, and deletion leaves an audit stub with no content.

## 6. Failure modes to plan for

| Failure | Response |
| --- | --- |
| Backup silently stopped running | freshness alert; run the drill's steps 1–5 immediately |
| Dump is corrupt/truncated | sha256 mismatch at verify time (always verify before shipping off-host) |
| Restore into a DB with a newer schema | `migrate status` reports drift → abort, restore the matching release instead |
| Lost encryption key | backup is unrecoverable — store the private key offline in two locations, documented |
| Disk full during dump | dump writes to a temp path with `set -euo pipefail`; alert on disk < 20 % |

## 7. Sign-off table (to be filled by the operator)

| Date | Drill type | Duration | Operator | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| — | full restore | — | — | **not yet performed** | Phase 1 audit finding F10 |
