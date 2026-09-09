import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const total = await db.crmCourse.count();
  const published = await db.crmCourse.count({ where: { status: 'active' } });
  const searchable = await db.crmCourse.count({ where: { status: 'active' } });
  
  // Courses linked to universities (universityId is not empty and relation is valid)
  const linkedToUnis = await db.crmCourse.count({
    where: { universityId: { not: '' } }
  });

  // Courses linked to countries (country is not empty)
  const linkedToCountries = await db.crmCourse.count({
    where: { country: { not: '' } }
  });

  // Courses with tuition, intake, requirements
  // Let's check intake fees count
  const withIntakeFees = await db.crmCourse.count({
    where: { intakeFees: { some: {} } }
  });
  const withRequirements = await db.crmCourse.count({
    where: { requirements: { some: {} } }
  });

  console.log('Total Courses:', total);
  console.log('Published Courses (status: active):', published);
  console.log('Searchable Courses:', searchable);
  console.log('Courses Linked to Universities:', linkedToUnis);
  console.log('Courses Linked to Countries:', linkedToCountries);
  console.log('Courses with Tuition / Intake Fees (some records):', withIntakeFees);
  console.log('Courses with Requirements (some records):', withRequirements);
}

main().then(() => db.$disconnect()).catch(console.error);
