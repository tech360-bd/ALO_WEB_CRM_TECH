import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const approx = await prisma.$queryRawUnsafe(`SELECT TABLE_NAME AS t, TABLE_ROWS AS r FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`);
for (const row of approx) console.log(`${row.t},${row.r ?? 0}`);
await prisma.$disconnect();
