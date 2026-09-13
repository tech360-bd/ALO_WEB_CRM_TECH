import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const course = await db.crmCourse.findFirst({
    include: { university: true }
  });
  console.log('Sample course:', course);
  const emptyCountryCount = await db.crmCourse.count({ where: { country: '' } });
  console.log('Courses with empty country field:', emptyCountryCount);
}

main().then(() => db.$disconnect()).catch(console.error);
