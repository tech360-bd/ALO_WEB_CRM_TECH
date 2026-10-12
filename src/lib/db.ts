import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Query logging can expose authentication material in bound parameters.
const prismaLogLevel = process.env.NODE_ENV === 'production'
  ? (['error'] as const)
  : (['error', 'warn'] as const);

/**
 * Offline / sandbox development mode: when DATABASE_URL points at a local
 * SQLite file (file:...), connect through the libsql driver adapter instead
 * of the native MySQL query engine. This lets the full platform run in
 * environments without a MySQL server or access to binaries.prisma.sh.
 *
 * Requires the client to have been generated from prisma/schema.dev.prisma
 * (see docs/DEV-SQLITE-SANDBOX.md). Production behavior — MySQL via
 * DATABASE_URL — is completely unchanged.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? ''
  if (process.env.ALO_DB_DRIVER === 'sqlite' || url.startsWith('file:')) {
    if (process.env.NODE_ENV === 'production' || !url.startsWith('file:')) throw new Error('SQLite is a file-backed development/verification mode only.');
    // Resolved at runtime through Node (never bundled): the wasm client entry
    // and its .wasm engine asset are not webpack-compatible.
    const moduleApi = process.getBuiltinModule?.('module');
    if (!moduleApi) throw new Error('Node 22 is required for SQLite verification.');
    const nodeRequire = moduleApi.createRequire(`${process.cwd()}/package.json`)
    const { PrismaLibSQL } = nodeRequire('@prisma/adapter-libsql')
    const { PrismaClient: WasmPrismaClient } = nodeRequire('.prisma/client/wasm')
    const adapter = new PrismaLibSQL({ url })
    return new WasmPrismaClient({
      adapter,
      log: [...prismaLogLevel],
    }) as PrismaClient
  }
  return new PrismaClient({
    log: [...prismaLogLevel],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
