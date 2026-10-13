import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaVersion?: string
}

// Bust cache when schema version changes (forces new client after prisma generate)
const SCHEMA_VERSION = 'v5-analytics-2026-07'

// Force new client creation when version changes
const cachedVersion = globalForPrisma.__prismaVersion
const cachedPrisma = globalForPrisma.prisma

if (cachedVersion !== SCHEMA_VERSION && cachedPrisma) {
  // Disconnect old client and clear cache
  cachedPrisma.$disconnect().catch(() => {})
  globalForPrisma.prisma = undefined
}

export const db =
  (globalForPrisma.__prismaVersion === SCHEMA_VERSION && globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: ['error', 'warn'],
      })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.__prismaVersion = SCHEMA_VERSION
}
