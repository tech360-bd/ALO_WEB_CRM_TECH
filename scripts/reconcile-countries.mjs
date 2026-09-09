import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const allCountries = await db.country.findMany();
  const activeCountries = allCountries.filter(c => c.status === 'active');
  
  // Group CrmUniversity by country field
  const universities = await db.crmUniversity.findMany({ select: { country: true } });
  const uniCountries = new Set(universities.map(u => u.country).filter(Boolean));

  // Group CrmCourse by country field
  const courses = await db.crmCourse.findMany({ select: { country: true } });
  const courseCountries = new Set(courses.map(c => c.country).filter(Boolean));

  console.log('A. Total Country records:', allCountries.length);
  console.log('B. Published Country records:', activeCountries.length);
  console.log('C. Countries visible on public website (active status):', activeCountries.length);
  console.log('D. Countries represented by universities (by string field):', uniCountries.size);
  console.log('E. Countries represented by courses (by string field):', courseCountries.size);

  console.log('\n--- Countries in Database (Public Destinations) ---');
  for (const c of allCountries) {
    console.log(`- ${c.name} (Code: ${c.code}, Slug: ${c.slug}, Status: ${c.status})`);
  }

  console.log('\n--- Countries in CrmUniversity ---');
  for (const name of Array.from(uniCountries).sort()) {
    const count = universities.filter(u => u.country === name).length;
    console.log(`- ${name}: ${count} Universities`);
  }

  console.log('\n--- Countries in CrmCourse ---');
  for (const name of Array.from(courseCountries).sort()) {
    const count = courses.filter(c => c.country === name).length;
    console.log(`- ${name}: ${count} Courses`);
  }
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1); });
