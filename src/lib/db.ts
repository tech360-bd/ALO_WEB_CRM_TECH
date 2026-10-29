import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Query logging can expose authentication material in bound parameters.
const prismaLogLevel = process.env.NODE_ENV === 'production'
  ? (['error'] as const)
  : (['error', 'warn'] as const);

/**
 * Production always uses the MySQL datasource configured in prisma/schema.prisma.
 *
 * Two offline escape hatches exist so the application can be run against a real
 * relational database where no MySQL server (and no binaries.prisma.sh download)
 * is reachable. Neither is ever set in production — `DATABASE_URL` there is a
 * `mysql://` URL, so the plain `new PrismaClient()` branch below is taken — and
 * neither changes application behaviour or schema shape.
 *
 *  1. `DATABASE_URL` starting with `file:` — the documented SQLite development
 *     sandbox (docs/DEV-SQLITE-SANDBOX.md). The generated WASM client
 *     (`prisma/schema.dev.prisma`, provider `sqlite`) is driven through the
 *     libsql driver adapter.
 *  2. `ALO_DB_DRIVER=sqlite` — the AI-Workforce offline verification harness,
 *     which uses its own generated mirror client.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';
  const wantsSqlite = process.env.ALO_DB_DRIVER === 'sqlite' || url.startsWith('file:');

  if (wantsSqlite) {
    if (!url.startsWith('file:')) {
      throw new Error('SQLite mode requires a file: DATABASE_URL');
    }
    // Resolved at runtime so the Next.js bundler never pulls the verification
    // adapter into an application build.
    //
    // `process.getBuiltinModule` (Node >= 22.3, and this project pins Node 22
    // via scripts/assert-node22.cjs) is used instead of
    // `import { createRequire } from 'node:module'` on purpose: a static
    // `node:` import is part of the module graph, and if any client component
    // transitively imports this file webpack's browser compiler fails the
    // whole production build with
    // `UnhandledSchemeError: Reading from "node:module" is not handled by
    // plugins`. A property lookup on `process` is invisible to the bundler, so
    // the offline-verification branch can never break an application build.
    const nodeModule = (
      process as unknown as {
        getBuiltinModule?: (id: string) => { createRequire(path: string): NodeJS.Require } | undefined;
      }
    ).getBuiltinModule?.('module');
    if (!nodeModule) {
      throw new Error(
        'SQLite mode requires Node >= 22.3 (process.getBuiltinModule is unavailable)',
      );
    }
    const requireAdapter = nodeModule.createRequire(`${process.cwd()}/`);
    const { PrismaLibSQL } = requireAdapter('@prisma/adapter-libsql');
    const adapter = new PrismaLibSQL({ url });

    // Prefer the AI-Workforce verification mirror client when it has been
    // generated (scripts/ai-workforce/mirror-schema.mjs →
    // node_modules/.prisma-sqlite/client); otherwise fall back to the dev
    // sandbox WASM client generated from prisma/schema.dev.prisma.
    let ClientCtor: new (options: Record<string, unknown>) => PrismaClient;
    try {
      ClientCtor = requireAdapter('./node_modules/.prisma-sqlite/client').PrismaClient;
    } catch {
      ClientCtor = requireAdapter('.prisma/client/wasm').PrismaClient;
    }
    return new ClientCtor({ adapter, log: [...prismaLogLevel] }) as PrismaClient;
  }

  return new PrismaClient({ log: [...prismaLogLevel] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
