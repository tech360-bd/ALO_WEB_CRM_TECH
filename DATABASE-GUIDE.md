# Production MySQL safety

`prisma/schema.prisma` declares MySQL; do not change provider. Configure DATABASE_URL through hosting environment settings using the actual database host/user/database and URL-encoded password. DB_HOST etc. in the template do not replace Prisma's DATABASE_URL. Obtain connection limits and TLS requirements from the provider; do not assume an IP, local server or pool size.

There are 479 models and 11 migrations. The earliest HR migration alters EmployeeHR before the initialization migration creates it. Static index/foreign-key definitions exist, but real constraint, transaction, collation, enum and migration replay behavior is NOT VERIFIED. Generation/validation fail at an engine download; production migration status is unavailable without authorized database configuration.

Ordinary deployment must not run migrations, db push, reset or seeds. Before an explicit `npx prisma migrate deploy`: verify backup by restoring to isolation, inspect `_prisma_migrations` with `npx prisma migrate status`, reconcile history/order against a schema inventory, review compatibility of old/new application code, and approve a recovery procedure. No history edits, baselining or destructive commands are authorized by these instructions alone.

Seeds exist (`prisma/seed-complete.ts`, seed-rbac and other scripts) but have not been certified production-safe. No automatic initial-admin or seed run. Review existing bootstrap/idempotency and use unique credentials via hosting secrets if an initial administrator is genuinely needed.
