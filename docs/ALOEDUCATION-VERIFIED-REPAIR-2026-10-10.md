# aloeducation.com verified repair, 2026-10-10

Scope: aloeducation.com on Hostinger managed Node.js. Other domains, DNS and VPS work in the supplied documents are reference-only.

The original production Prisma P2021 failures came from an empty database despite a successful SELECT 1 connection check. The reviewed 19-migration baseline was applied after verifying the original empty backup. No reset, record deletion or demo seed was run.

The latest source introduced two unapplied migrations. A fresh export was obtained, its broken MariaDB longtext DDL was detected by a failed local restore, and a recoverable backup was reconstructed from the previously verified canonical schema plus every unchanged data INSERT from the fresh export. The complete backup restored successfully in isolated MySQL 8.4. The production column-name signature matched the baseline (7,856 columns). Both follow-up migrations passed on that restored copy before production execution.

Production now has 534 tables, 21 finished migrations, zero unfinished migrations, nullable audit_logs.userId and StudentIdSequence. The existing portal account and 14 services, 6 editorial guides and 2 scholarship references were preserved.

Confirmed source repairs include stored staff-role authority instead of email-based role grants; real communication ownership and visibility filters; transactional message/action audits; no anonymous communication identity matching; content administration authorization; archive-only public content deletion; and truthful provider delivery status. Broadcast administration now requires stored staff permission, uses a separate authorized approver, and refuses disconnected portal delivery instead of fabricating sent records. The quota initializer retries confirmed MySQL first-row races while preserving the atomic conditional increment.

Latest upstream build defects repaired: malformed lockfile, missing Prisma AuditLog opposite relation, duplicate redirects, invalid university listing JSX/state/handlers, and unsafe offline database adapter loading. Existing upstream changes through c5bfcbbaef4e612eddb55f5f8516e5b1526e68cc were retained.

The supplied-document ledger records requirements without treating source presence as functional completion. Earlier READY/COMPLETE reports in this repository are historical claims and are superseded by current measured evidence. Successful provider delivery, real-account staff/student login, the entire employee/B2B lifecycle, all SEO deliverables, all reference repositories and every private workflow are not established by a build or health check. The initial real company administrator identity and external provider credentials remain necessary for those acceptance checks. No production administrator or demo identity has been invented.
