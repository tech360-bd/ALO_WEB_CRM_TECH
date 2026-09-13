import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaLogLevel = process.env.NODE_ENV === 'production'
  ? (['error'] as const)
  : (['query', 'error', 'warn'] as const);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [...prismaLogLevel],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db