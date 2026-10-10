/**
 * Prisma config for the OFFLINE / SANDBOX SQLite development database.
 *
 * Not auto-loaded (Prisma only auto-loads `prisma.config.ts`); production
 * behavior is untouched. Use explicitly:
 *
 *   npx prisma db push --config prisma/dev-sqlite.config.ts
 *   npx prisma generate --schema prisma/schema.dev.prisma
 *
 * Uses the JS/WASM schema engine (`engine: 'js'`) shipped inside the prisma
 * npm package, so no engine binaries need to be downloaded from
 * binaries.prisma.sh — this works with npm-registry-only network access.
 */
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const dbFile = process.env.DEV_SQLITE_PATH
  ?? path.join(__dirname, 'dev.db');

export default defineConfig({
  experimental: { adapter: true },
  schema: path.join(__dirname, 'schema.dev.prisma'),
  engine: 'js',
  adapter: async () => new PrismaLibSQL({ url: `file:${dbFile}` }),
});
