# Prisma Migrations

This folder is the **source of truth** for database schema changes. It replaces the
previous `prisma db push` workflow so that schema changes are versioned, reviewable
and deployable to production via `npx prisma migrate deploy`.

## Folder layout

```
prisma/migrations/
├── migration_lock.toml                  # Locks the dev provider (sqlite)
├── README.md                            # This file
├── 00000000000000_initial/              # SQLite (dev) initial migration
│   └── migration.sql                    #   55 CREATE TABLE statements
└── 00000000000000_mysql_initial/        # MySQL 8 (production) initial migration
    └── migration.sql                    #   25 CREATE TABLE statements (see Notes)
```

## Two providers, two schemas

This project targets **two databases**:

| Environment | Provider   | Schema file                  | Lock file value |
|-------------|------------|------------------------------|-----------------|
| Local dev   | `sqlite`   | `prisma/schema.prisma`       | `sqlite`        |
| Production  | `mysql`    | `prisma/schema.mysql.prisma` | `mysql`         |

`prisma/schema.prisma` is the **dev schema** (SQLite, the default Prisma uses).
`prisma/schema.mysql.prisma` is the **production schema** (MySQL 8, with `@db.*`
column-type annotations like `VARCHAR(255)`, `DATETIME(3)`, `LONGTEXT`, etc.).

The two schemas are intentionally separate because SQLite does not understand the
`@db.*` annotations that MySQL requires for correct column sizing.

## `migration_lock.toml`

```
provider = "sqlite"
```

This locks the **dev** workflow to SQLite so that `npx prisma migrate dev` and
`npx prisma migrate deploy` operate against the SQLite dev database by default.

For production (MySQL) deploys, the deploy script temporarily:

1. copies `prisma/schema.mysql.prisma` → `prisma/schema.prisma` (so Prisma uses the
   MySQL datasource), and
2. flips `provider` in `migration_lock.toml` to `"mysql"`

…then runs `npx prisma migrate deploy`, and finally restores the SQLite versions.

## Creating new migrations (dev workflow)

When you change `prisma/schema.prisma` (add a model, add a column, rename a field,
etc.):

```bash
# 1. Edit prisma/schema.prisma (SQLite dev schema)
# 2. Generate the migration SQL without applying it yet:
npx prisma migrate dev --name <short_description> --create-only

# 3. Inspect prisma/migrations/<timestamp>_<name>/migration.sql
# 4. Apply it to the local dev DB:
npx prisma migrate dev
```

> **Drift gotcha:** if you previously used `prisma db push` (as this project did),
> `migrate dev` will detect drift because the `_prisma_migrations` table is empty.
> To recover, use `prisma migrate diff --from-empty --to-schema-datamodel
> prisma/schema.prisma --script` to baseline the existing schema (this is how
> `00000000000000_initial` was created).

## Mirroring changes to the MySQL schema

After landing a migration in `prisma/schema.prisma`, apply the **same change** to
`prisma/schema.mysql.prisma` (with the appropriate `@db.*` column types), then
regenerate the MySQL initial migration:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.mysql.prisma \
  --script \
  > prisma/migrations/00000000000000_mysql_initial/migration.sql
```

(For a brand-new MySQL production database, only the **latest** `00000000000000_mysql_initial`
SQL is applied — it always represents the full schema from empty. For an already-deployed
MySQL DB, you would instead generate an incremental diff via:

```bash
npx prisma migrate diff \
  --from-migrations prisma/migrations/00000000000000_mysql_initial \
  --to-schema-datamodel prisma/schema.mysql.prisma \
  --script \
  > prisma/migrations/<timestamp>_<name>/migration.sql
```

…then in production run `npx prisma migrate deploy` to apply only the new migration.)

## Deploying in production (cPanel / MySQL 8)

The deploy script (`deploy/cpanel/setup-cpanel.sh` and `deploy/deploy.sh`) does
this for you. The manual flow is:

```bash
# 1. Make sure the MySQL schema is the active one:
cp prisma/schema.mysql.prisma prisma/schema.prisma

# 2. Flip the lock to MySQL:
sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/migrations/migration_lock.toml

# 3. Make sure DATABASE_URL points at the MySQL DB:
export DATABASE_URL="mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm"

# 4. Generate the Prisma Client for MySQL:
npx prisma generate

# 5. Apply migrations:
npx prisma migrate deploy

# 6. Seed if needed:
npx prisma db seed
```

After deploy, you can revert `prisma/schema.prisma` and `migration_lock.toml` back
to the SQLite versions so local dev continues to work — production has already
recorded the migration in its own `_prisma_migrations` table.

## Validation & formatting

```bash
npx prisma validate    # confirms both schemas are syntactically valid
npx prisma format      # formats schema files in place
```

## Notes & known issues

- **The two schemas are out of sync.** As of this writing,
  `prisma/schema.prisma` (SQLite) has **55 models**, while
  `prisma/schema.mysql.prisma` has only **25 models**. The 30 missing models in
  the MySQL schema are all of the `EnglishLearning*` (11) and `HigherStudy*` (19)
  tables. The MySQL migration in `00000000000000_mysql_initial/migration.sql`
  therefore only creates 25 tables. **Before going live on MySQL production**, a
  follow-up task must add the 30 missing models to `prisma/schema.mysql.prisma`
  (mirroring their definitions from `prisma/schema.prisma`, with `@db.*` column
  types) and regenerate the MySQL initial migration. Until then, the English
  Learning and Higher Study modules will not have tables on the production MySQL
  database.
- The local SQLite dev database (`db/custom.db`, 274 seeded rows) is left
  untouched. Migrating it onto the new migration history would require either
  `prisma migrate resolve --applied 00000000000000_initial` (to mark the existing
  schema as already migrated) or wiping and re-seeding.
