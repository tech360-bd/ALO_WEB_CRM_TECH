# Official-data subset delivery package

The companion ZIP is a small, auditable source-and-evidence bundle for the Aston AI MSc month-coverage research subset. It contains implementation source, the additive migration and current Prisma schema, staging data, research status, and the offline integrity checker. It is not a complete copy of the private ALO application and does not include credentials, database dumps, student data, or production secrets.

## Safe operation

- `npm run data:course-month:check` validates and prints a dry-run summary; it makes no database writes.
- `npm run data:course-month:stage` is an explicit database write. Do not run it until a protected backup is verified, the additive migration has been reviewed/deployed, and the CRM has exactly one university and one course matching the official title and canonical URL. The import refuses to create or guess missing/ambiguous CRM records and never publishes staged rows.
- Super Admin decisions use `/api/admin/course-month-coverage` and `/api/admin/course-month-coverage/{id}`. The public read endpoint only returns `APPROVED` rows: `/api/course-month-coverage?courseSlug=...&from=2027-01&to=2028-01`.
- Candidate official source records are registered with `verificationStatus=pending` and seven-day monitoring enabled. They remain outside the monitoring crawler's verified-source scope until a permitted source check verifies them.

No migration was applied and no database write or public publication occurred during this work. Production deployment, cache invalidation across every ALO surface, complete worldwide research, and five end-to-end acceptance rounds remain outstanding.
