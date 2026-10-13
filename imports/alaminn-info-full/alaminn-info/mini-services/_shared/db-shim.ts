/**
 * mini-services/_shared/db-shim.ts
 * ------------------------------------------------------------------
 * Database abstraction for mini-services.
 *
 * Provides a Bun:sqlite-compatible API (`db.query(sql).get()` / `.all()`)
 * backed by Prisma Client — so mini-services work on BOTH:
 *   - Node.js (via `npx tsx`)  — uses Prisma Client
 *   - Bun      (via `bun --hot`) — uses Prisma Client (Bun supports Prisma)
 *
 * Replaces the old `import { Database } from "bun:sqlite"` pattern.
 * Supports BOTH SQLite (dev) and MySQL (production) via DATABASE_URL.
 */

import { PrismaClient } from "@prisma/client";

export interface QueryResult {
  get<T = unknown>(): T | null;
  all<T = unknown>(): T[];
}

export interface DbHandle {
  query(sql: string): QueryResult;
  exec(sql: string): void;
  close(): Promise<void>;
}

let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Open a database connection (returns a handle with bun:sqlite-like API).
 * For SQLite: path is ignored (Prisma reads DATABASE_URL).
 * For MySQL:  path is ignored (Prisma reads DATABASE_URL).
 */
export function openDatabase(_path?: string, _opts?: { readonly?: boolean }): DbHandle {
  const p = getPrisma();
  return {
    query(sql: string): QueryResult {
      return {
        async get<T = unknown>(): Promise<T | null> {
          const rows = await p.$queryRawUnsafe<T[]>(sql);
          return (rows as unknown[]).length > 0 ? (rows[0] as T) : null;
        },
        async all<T = unknown>(): Promise<T[]> {
          const rows = await p.$queryRawUnsafe<T[]>(sql);
          return rows as T[];
        },
      };
    },
    exec(sql: string): void {
      // Fire-and-forget for PRAGMA statements etc.
      p.$executeRawUnsafe(sql).catch(() => {
        /* swallow — PRAGMA calls are best-effort */
      });
    },
    async close(): Promise<void> {
      if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
      }
    },
  };
}

export { getPrisma as prisma };
