import { db } from '../src/lib/db';
async function main() {
  const leads = await db.leadForm.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Recent leads (full data):');
  for (const l of leads) {
    console.log('---');
    console.log('  name:', l.name);
    console.log('  email:', l.email);
    console.log('  phone:', l.phone);
    console.log('  preferredCountry:', l.preferredCountry);
    console.log('  intake:', l.intake);
    console.log('  message:', l.message);
    console.log('  source:', l.source);
    console.log('  sourceSection:', l.sourceSection);
    console.log('  status:', l.status);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
