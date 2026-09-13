import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const users = await prisma.portalUser.findMany({
  select: { email: true, userType: true, status: true },
  orderBy: { email: 'asc' }
});
for (const u of users) console.log(`${u.email}\t${u.userType}\t${u.status}`);
await prisma.$disconnect();
