import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
console.log('Keys of db:', Object.keys(db).filter(k => /invoice|refund/i.test(k)));
db.$disconnect();
