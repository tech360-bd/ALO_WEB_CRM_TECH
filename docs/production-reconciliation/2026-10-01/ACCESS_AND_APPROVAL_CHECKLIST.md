# Read-only handoff and approval boundaries

No Hostinger authenticated tool, DB connection, SSH agent/key/config or SMTP secret was available in this session. GitHub repository/CI access is not hosting access. GitHub deployment metadata returned 403 Resource not accessible by integration. Do not supply secrets in chat, documents, PRs or source control.

## Evidence needed through secure access or an authorized operator

1. **Hostinger identity:** exact product/plan, website mapping, deployment ID/timestamp, uploaded archive digest, build/runtime logs with credentials redacted, and current artifact/package-lock/build identity. Do not upload/redeploy a ZIP or reconnect a branch merely to inspect it.
2. **Runtime environment:** private inspection of DATABASE_URL presence and its redacted protocol/host/port/database, whether user/password are populated, percent-encoding validity, query-key names (not values), and source/scope of configuration. Compare with the actual database account assignment. No output of full URLs, env dumps, `ps e`, password hashes, tokens or private keys.
3. **Database:** read-only approved access or operator results from READ_ONLY_DISCOVERY.sql; exact engine/distribution/version, host/name, required TLS policy and CA validation. Confirm whether hosted in this Hostinger account or externally. Database-auth errors are not proof of the database name or of a password-only error.
4. **History/metadata:** _prisma_migrations names, timestamps, checksums, rollback/completion markers; actual tables/columns/indexes/FKs/collations/check constraints. Exclude migration logs and customer rows. Compare with migration-checksums.json and schema-matrix.csv, honoring @@map names and database case sensitivity.
5. **Backups:** database-specific successful snapshot entry and timestamp, target database identity, snapshot ID, retention/recoverability, downloadable artifact availability, consistency method, checksum, files-vs-database scope, and whether private storage/build/runtime configuration are included. Do not click Restore, Generate, Restart or Deploy as part of read-only discovery.
6. **Scheduler:** existing job list and last-run outcomes with command secrets redacted, actual plan limits/timeout/timezone/runtime/executable availability and private logging. No job invocation, even “dry-run,” until side effects are reviewed.
7. **Email:** presence of SMTP_HOST/PORT/FROM/USER/PASSWORD, provider's TLS/auth requirements, authorized sender/domain verification, and redacted provider delivery history. DNS MX/DKIM does not establish outbound app SMTP configuration.

## Actions needing separate explicit approval

| Action | Why approval is required | Safe precondition |
|---|---|---|
| Change DB account secret, grants or app environment | Changes production security/config and may trigger restart/rebuild | Verified target identity and mismatch; capture redacted before-state; minimal approved correction |
| Restart/redeploy or connect GitHub deployment | Can replace files/execute hooks; may change runtime | Verified artifact/branch/startup/storage mapping; backup evidence and explicit deployment authorization |
| Login/logout or invalid-password test | Creates/revokes sessions, writes audit/login attempts, may lock account | Designated test account + allowed writes/cleanup policy; no real-user password guesses |
| Approval/payment/payroll/cron test | Business state, outbound effects and audit records | Isolated staging first; explicit tightly scoped production approval if still necessary |
| SMTP test email | Outbound message/provider logs; possible app token/queue mutation | Designated consenting test inbox, approval to send, bounded one-message test and provider/inbox evidence |
| Restore rehearsal | Writes to destination; may trigger outbound jobs and expose PII | Separate approved isolated DB/files destination, restricted access, no outbound credentials, verified snapshot; never live restore |
| Schema/backfill/migration | Alters existing data/schema; MySQL DDL may auto-commit | Engine/schema/history known, backup restore demonstrated, reviewed forward plan, staging rehearsal and explicit approval |
| DNS change | Affects web/mail routing and deliverability | Concrete requirement + current/proposed record/risk/rollback plan; currently no requirement found |

No credentials, test recipient, hosting path, database name, port or account identifier is requested as a public value. A secure connection must be provided through the platform's credential/access mechanism if available, otherwise an authorized operator can perform the read-only checks and return sanitized metadata. No repo/source ZIP is needed.
