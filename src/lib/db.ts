import { PrismaClient } from '@prisma/client'
import { createRequire } from 'node:module'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaLogLevel = process.env.NODE_ENV === 'production'
  ? (['error'] as const)
  : (['query', 'error', 'warn'] as const);

/**
 * Production always uses the MySQL datasource configured in prisma/schema.prisma.
 *
 * `ALO_DB_DRIVER=sqlite` is an offline-verification-only escape hatch used by
 * scripts/ai-workforce/run-verification.mjs so the AI Workforce acceptance
 * gates can be proved against a real relational database (real rows, real
 * constraints) in environments where no MySQL server is reachable. It is never
 * set in production and never changes application behaviour or schema shape.
 */
function createPrismaClient(): PrismaClient {
  if (process.env.ALO_DB_DRIVER === 'sqlite') {
    const url = process.env.DATABASE_URL;
    if (!url || !url.startsWith('file:')) {
      throw new Error('ALO_DB_DRIVER=sqlite requires a file: DATABASE_URL');
    }
    // Resolved at runtime so the Next.js bundler never pulls the verification
    // adapter into an application build.
    const requireAdapter = createRequire(`${process.cwd()}/`);
    const { PrismaLibSQL } = requireAdapter('@prisma/adapter-libsql');
    // The verification mirror client is generated from
    // prisma/verification-mirror/schema.sqlite.prisma, which is produced from
    // prisma/schema.prisma by scripts/ai-workforce/mirror-schema.mjs — same
    // models, same fields, SQLite provider.
    const { PrismaClient: MirrorPrismaClient } = requireAdapter('./node_modules/.prisma-sqlite/client');
    const adapter = new PrismaLibSQL({ url });
    return new MirrorPrismaClient({ adapter, log: [...prismaLogLevel] }) as PrismaClient;
  }
  return new PrismaClient({ log: [...prismaLogLevel] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
