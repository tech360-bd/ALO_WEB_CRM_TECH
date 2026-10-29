/**
 * Script-side Prisma factory.
 *
 * Production/MySQL: a normal PrismaClient using DATABASE_URL.
 * Offline sandbox: when DATABASE_URL is a `file:` SQLite URL, the libsql driver
 * adapter + WASM query compiler are used (the same mechanism as
 * `src/lib/db.ts` does for the app). This keeps the verified-catalogue CLI
 * usable in environments where no MySQL server is reachable, without touching
 * production behaviour.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

export function createScriptPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('file:')) {
    // The adapter option only exists on clients generated with
    // `driverAdapters`; the cast keeps the same script compiling against the
    // production (MySQL) client generation as well.
    return new PrismaClient({ adapter: new PrismaLibSQL({ url }) } as never);
  }
  return new PrismaClient();
}
