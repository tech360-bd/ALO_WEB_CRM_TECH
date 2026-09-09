import { db } from '../src/lib/db.js';

async function main() {
  console.log('--- ACTUAL DB COUNTS BY COUNTRY ---');
  const unisByCountry = await db.crmUniversity.groupBy({
    by: ['country'],
    _count: { id: true }
  });
  console.log(JSON.stringify(unisByCountry, null, 2));

  console.log('\n--- FIRST 5 UNIVERSITIES ---');
  const unis = await db.crmUniversity.findMany({ take: 5 });
  console.log(JSON.stringify(unis.map(u => ({ id: u.universityId, name: u.name, country: u.country })), null, 2));

  console.log('\n--- INTAKE COUNTS ---');
  const totalIntakes = await db.crmCourseIntakeFee.count();
  console.log('Total Intake Records:', totalIntakes);
}

main().catch(console.error);
