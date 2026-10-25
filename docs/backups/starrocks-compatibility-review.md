# StarRocks backup-and-restore tool — compatibility review

**Repository reviewed:** https://github.com/deep-bi/starrocks-backup-and-restore
**Review date:** 2026-10-25
**Decision:** **DO NOT ADOPT.**
Reason: ALO's databases are MySQL, and this tool is explicitly StarRocks-only.

## 1. Verified facts (from the GitHub API and the repository README)

| Field | Value | Source |
|---|---|---|
| Licence | Apache-2.0 | `GET /repos/deep-bi/starrocks-backup-and-restore` |
| Language | Python (~482 k bytes) + shell | API `/languages` |
| Stars / archived | 13 / not archived | API |
| Last update | 2026-09-25 | API |
| Latest release | `v0.7.0a1` — **pre-release**, 2026-02-04 | API `/releases` |
| Latest stable | `v0.6.0` — 2026-02-04 | API `/releases` |
| Requirements | **StarRocks 3.5+, shared-nothing mode** | README |
| Distribution | PyPI package `starrocks-br` | README |
| Stated scope | full + incremental backups, backup history in an `ops` database, restore-chain resolution, inventory groups, single-table restore, retention/prune, concurrency control | README |

Not verified in this review (needs a disposable StarRocks cluster): dependency tree
resolution, TLS behaviour, required StarRocks privileges, retention/prune behaviour,
restore correctness, performance.

## 2. Why it does not apply to ALO today

| ALO component | Datastore | Evidence | StarRocks tool applicable? |
|---|---|---|---|
| ALO Education CRM | MySQL | `prisma/schema.prisma` → `datasource db { provider = "mysql" }` | **No** |
| PhD Proposal Builder tables | MySQL (47 `Phd*` models in the same schema) | same schema | **No** |
| AgentOS | MySQL (same Prisma schema) | same schema | **No** |
| AI gateway | no database (stateless) | `services/ai-gateway/*` | No |
| Uploads | filesystem (`storage/phd`, `storage/…`) | `src/lib/phd/storage.ts` | No |
| Offline verification DB | SQLite mirror | `prisma/verification-mirror/` | No |

There is no StarRocks cluster, no StarRocks client in `package.json`, and no
analytical workload that would justify introducing one. Migrating MySQL to StarRocks
in order to use this tool would be a destructive, unjustified re-platforming.

## 3. What ALO uses instead

`scripts/backup-mysql.sh` — logical `mysqldump` backup with:

* credentials read from the application's `DATABASE_URL` (or explicit
  `DB_DATABASE`/`DB_USERNAME`/… variables), written to a private temporary defaults
  file with `umask 077` — never on the command line, never printed;
* `gzip` + `sha256` checksum alongside each dump;
* `set -Eeuo pipefail`, an explicit pre-flight check for `mysqldump`, and cleanup
  traps that remove the credential file and partial dump on failure or SIGTERM.

`scripts/backup_agentos.sh` covers the AgentOS artefacts.

Both scripts were syntax-checked and executed in this environment; see
`docs/backups/backup-and-restore-test-results.md`.

## 4. Conditions under which this decision would be revisited

Only if **all** of the following become true:

1. A real StarRocks 3.5+ shared-nothing cluster exists and holds data ALO must
   recover (an analytics warehouse is not enough to justify a bespoke backup path
   for the system of record).
2. The cluster is inventoried, with an explicit backup inventory list.
3. A dedicated least-privilege service account exists, with credentials in a secret
   store (never in Git).
4. A full/incremental/restore cycle has been rehearsed in a disposable environment,
   including a **single-table** restore and a **full** restore with row-count and
   schema verification.
5. Retention/pruning is verified — the project's own changelog flags alpha-stage
   pruning behaviour, and the newest tag is a pre-release, so automated prune stays
   off until confirmed upstream.
6. Backup storage is off-host and access to it is restricted and separately
   credentialed.
7. RPO/RTO are measured from actual restore runs, not assumed.

## 5. Risks noted for the record

| Risk | Assessment |
|---|---|
| Pre-release-only for the newest tag | Requires pinning to a stable release (`v0.6.0`) and re-review before upgrade |
| Pruning/retention maturity | Do not enable automated deletion until upstream status is confirmed and tested |
| StarRocks-version coupling (3.5+) | Any upgrade could invalidate the tool |
| Single-maintainer project, 13 stars | Bus-factor risk; treat as a convenience wrapper around native `BACKUP`/`RESTORE` |
| Apache-2.0 licence | Compatible; not the blocker |

**Conclusion:** no action required for ALO's backups. If a StarRocks cluster is ever
introduced, re-run this review against the then-current release before installing
anything.
