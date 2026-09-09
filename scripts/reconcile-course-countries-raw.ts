import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('Running Raw SQL Course-Country Reconciliation...');
  
  // Perform the update using raw SQL which executes in milliseconds
  const affected = await db.$executeRawUnsafe(
    `UPDATE CrmCourse c 
     JOIN CrmUniversity u ON c.universityId = u.universityId 
     SET c.country = u.country 
     WHERE c.country = '' OR c.country IS NULL`
  );
  
  console.log(`Reconciliation complete. Affected rows: ${affected}`);
  
  // Verify counts
  const emptyCount = await db.crmCourse.count({ where: { country: '' } });
  console.log(`Courses remaining with empty country: ${emptyCount}`);
  
  // Group by country to see the distribution
  const courses = await db.crmCourse.findMany({ select: { country: true } });
  const courseCountries = new Set(courses.map(c => c.country).filter(Boolean));
  console.log('\n--- Reconciled Countries in CrmCourse ---');
  for (const name of Array.from(courseCountries).sort()) {
    const count = courses.filter(c => c.country === name).length;
    console.log(`- ${name}: ${count} Courses`);
  }
}

main().then(() => db.$disconnect()).catch(e => {
  console.error('Reconciliation error:', e);
  process.exit(1);
});
