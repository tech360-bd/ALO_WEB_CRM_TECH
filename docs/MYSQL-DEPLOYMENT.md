# MySQL / MariaDB Production Deployment Guide

## ⚠️ NEVER run `prisma db push --accept-data-loss` against production. Use `prisma migrate deploy`.

## Step 1 — Backup
```bash
mysqldump -u <user> -p <database> > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Step 2 — Set DATABASE_URL
```env
DATABASE_URL=mysql://<user>:<password>@<host>:<port>/<database>?connection_limit=20&pool_timeout=10
```

## Step 3 — Switch provider to mysql
Edit `prisma/schema.prisma`:
```diff
datasource db {
-  provider = "sqlite"
+  provider = "mysql"
   url      = env("DATABASE_URL")
}
```

## Step 4 — Generate + migrate
```bash
bunx prisma generate
bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
bunx prisma migrate deploy
```

## Step 5 — Verify tables
```bash
mysql -u <user> -p <database> -e "SHOW TABLES;"
mysql -u <user> -p <database> -e "SELECT COUNT(*) FROM UniversityPage;"
mysql -u <user> -p <database> -e "SELECT COUNT(*) FROM Student;"
```

## Step 6 — Verify app
```bash
NODE_ENV=production node .next/standalone/server.js
curl http://localhost:3000/api/health
curl http://localhost:3000/api/stats
```

## MySQL notes
- Use `utf8mb4` charset
- VARCHAR(191) for indexed columns
- BigInt fields map to BIGINT

## Rollback
```bash
mysql -u <user> -p <database> < backup-YYYYMMDD-HHMMSS.sql
# Revert schema.prisma to provider = "sqlite"
```
