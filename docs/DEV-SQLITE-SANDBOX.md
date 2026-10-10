# Offline SQLite Development Sandbox

Production runs Prisma against MySQL (see `prisma/schema.prisma` and
`docs/DEPLOYMENT.md`). In restricted environments — no MySQL server, no access
to `binaries.prisma.sh` for native query engines — the repository ships an
offline development pipeline that runs the full app against a local SQLite
database through the Prisma **libsql driver adapter** and the **WASM** client
(no native engine download required).

Nothing in this pipeline affects production: the MySQL schema, migrations,
and `npm run build` behaviour are unchanged. `src/lib/db.ts` selects the
libsql/WASM path **only** when `DATABASE_URL` starts with `file:`.

## Components

| Path | Purpose |
| --- | --- |
| `scripts/dev-sqlite/generate-dev-schema.mjs` | Derives `prisma/schema.dev.prisma` (SQLite provider) from `prisma/schema.prisma`. Never edit the generated file. |
| `scripts/dev-sqlite/patch-wasm-loader.mjs` | Patches the generated WASM client loader in `node_modules`. **Must be re-run after every `prisma generate` or `npm install`.** |
| `scripts/dev-sqlite/preload.cjs` | `--require` shim so seed scripts that construct their own `new PrismaClient()` transparently get the libsql/WASM client. |
| `scripts/dev-sqlite/seed-dev-fixtures.ts` | Idempotent dev-only fixtures: counselor users (`@aloeducation.dev`) and optional admin password repair. |
| `prisma/dev-sqlite.config.ts` | Prisma config pointing CLI commands at the dev schema. |
| `prisma/schema.dev.prisma` | Generated SQLite schema (gitignored). |
| `prisma/dev.db` | Local SQLite database (gitignored). |

## Setup

```bash
npm ci

# Prisma CLI still probes for engines; point it at a dummy file.
touch /tmp/dummy-engine
export PRISMA_QUERY_ENGINE_LIBRARY=/tmp/dummy-engine
export PRISMA_SCHEMA_ENGINE_BINARY=/tmp/dummy-engine

# 1. Generate the SQLite dev schema + client, patch the loader.
node scripts/dev-sqlite/generate-dev-schema.mjs
npx prisma generate --schema prisma/schema.dev.prisma --config prisma/dev-sqlite.config.ts
node scripts/dev-sqlite/patch-wasm-loader.mjs   # required after every generate

# 2. Create/update the database.
export DATABASE_URL="file:$PWD/prisma/dev.db"
npx prisma db push --config prisma/dev-sqlite.config.ts --skip-generate

# 3. Seed. Scripts that build their own PrismaClient need the preload shim.
NODE_OPTIONS="--require $PWD/scripts/dev-sqlite/preload.cjs" npx tsx prisma/seed-homepage.ts
NODE_OPTIONS="--require $PWD/scripts/dev-sqlite/preload.cjs" npx tsx prisma/seed-counselor.ts
DEV_ADMIN_PASSWORD='choose-a-dev-password' \
  NODE_OPTIONS="--require $PWD/scripts/dev-sqlite/preload.cjs" \
  npx tsx scripts/dev-sqlite/seed-dev-fixtures.ts

# 4. Run the app.
npx next dev -p 3000 -H 0.0.0.0
```

Put `DATABASE_URL="file:.../prisma/dev.db"` in `.env` so the dev server picks
it up automatically.

## Schema changes

After editing `prisma/schema.prisma`, repeat step 1 (generate + patch) and
step 2 (`db push`). Production still uses SQL migrations under
`prisma/migrations/` — write one for every schema change; `db push` is a
dev-sandbox convenience only.

## Notes & gotchas

- The WASM engine keeps everything in-process; low-memory machines may need
  swap for Turbopack compiles of large routes.
- `@prisma/adapter-libsql` is pinned to the same major/minor as `prisma`
  (6.19.x). Do not float it to 7.x while Prisma 6 is in use.
- Seed fixtures use clearly synthetic `@aloeducation.dev` addresses. Never
  run `scripts/dev-sqlite/seed-dev-fixtures.ts` against a production URL
  (it refuses nothing by itself — the guard is the `file:` DATABASE_URL you
  give it).
