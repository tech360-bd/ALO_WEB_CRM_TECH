# ALO Education — MySQL Migration Readiness Report

## Current State
- **Prisma provider:** `sqlite`
- **Schema models:** 158
- **DATABASE_URL:** `file:/home/z/my-project/db/custom.db`
- **Schema comment:** Already says "MySQL 8"

## MySQL Compatibility Audit

### ✅ SAFE — No Blockers Found

1. **No `@db.Text` annotations** — 0 found (clean for both SQLite and MySQL)
2. **No `Unsupported` types** — 0 found
3. **No `Bytes` type** — 0 found
4. **No `Decimal` type** — 0 found
5. **No SQLite-specific raw SQL** — `json_extract`, `json_each`, `ROWID`, `last_insert_rowid` not found in source
6. **No `better-sqlite3` or `sqlite3` imports** — Prisma handles the abstraction
7. **`$queryRaw` usage** — Only in `/api/health/route.ts`: `db.$queryRaw\`SELECT 1\`` — MySQL-compatible
8. **JSON fields** — Stored as `String @default("[]")` or `String @default("{}")` — works on both SQLite and MySQL
9. **Date fields** — All use `DateTime @default(now())` and `@updatedAt` — Prisma-compatible for both
10. **Enums** — All stored as `String` (not Prisma enums) — compatible with both
11. **Indexes** — All use `@@index` syntax — compatible with both
12. **Unique constraints** — All use `@unique` and `@@unique` — compatible with both
13. **Relations** — Standard Prisma `@relation` syntax — compatible with both
14. **Seed scripts** — Use `PrismaClient` directly, no SQLite-specific logic
15. **Docker** — `docker-compose.yml` currently has PostgreSQL (needs MySQL service swap)

## Migration Steps (Safe — Non-Destructive)

### Step 1: Create MySQL Schema File (already done)
```bash
cp prisma/schema.prisma prisma/schema.mysql.prisma
# Change provider to "mysql"
```

### Step 2: Install MySQL on Production Server
```bash
sudo apt install mysql-server
sudo mysql_secure_installation
mysql -u root -p
CREATE DATABASE alo_education CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aloedu'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON alo_education.* TO 'aloedu'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Update .env.production (already done)
```
DATABASE_URL="mysql://aloedu:YOUR_PASSWORD@localhost:3306/alo_education"
```

### Step 4: Push Schema to MySQL
```bash
# On production server:
npx prisma db push --schema=prisma/schema.mysql.prisma
```

### Step 5: Run Seeds
```bash
bun run db:seed
```

### Step 6: Update Docker Compose (swap PostgreSQL → MySQL)
```yaml
db:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: root_password
    MYSQL_DATABASE: alo_education
    MYSQL_USER: aloedu
    MYSQL_PASSWORD: YOUR_PASSWORD
```

## Migration Risk: LOW

The schema was originally designed for MySQL 8 (per the comment). All Prisma types used are compatible with both SQLite and MySQL. No SQLite-specific features are used in the application code.

## Required Docker Change

The `docker-compose.yml` currently has a PostgreSQL service. For production MySQL deployment, replace with:

```yaml
db:
  image: mysql:8.0
  container_name: alo-mysql
  restart: unless-stopped
  environment:
    MYSQL_ROOT_PASSWORD: root_password
    MYSQL_DATABASE: alo_education
    MYSQL_USER: aloedu
    MYSQL_PASSWORD: YOUR_PASSWORD
  ports:
    - "3306:3306"
  volumes:
    - alo-mysqldata:/var/lib/mysql
  networks:
    - alo-network
```

## Verdict: MySQL migration is SAFE and READY when production server is set up.
