import { db } from '../src/lib/db';
async function main() {
  const unis = await db.crmUniversity.findMany({
    where: { OR: [{ name: { contains: 'Oxford' } }, { name: 'MIT' }, { name: { contains: 'Cambridge' } }] },
    select: { name: true, country: true, status: true, worldRanking: true }
  });
  console.log('Found:', unis.length);
  unis.forEach(u => console.log(`  - ${u.name} | ${u.country} | ${u.status} | rank ${u.worldRanking}`));
  
  // Also count all
  const allCount = await db.crmUniversity.count();
  console.log('Total universities in DB:', allCount);
  
  // Get first 5 by alphabetical
  const alpha = await db.crmUniversity.findMany({ orderBy: { name: 'asc' }, take: 5, select: { name: true }});
  console.log('First 5 alphabetically:', alpha.map(u=>u.name));
  
  // Get last 5 by alphabetical
  const omega = await db.crmUniversity.findMany({ orderBy: { name: 'desc' }, take: 5, select: { name: true }});
  console.log('Last 5 alphabetically:', omega.map(u=>u.name));
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
