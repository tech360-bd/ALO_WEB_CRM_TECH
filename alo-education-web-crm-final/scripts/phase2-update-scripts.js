/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

p.scripts = p.scripts || {};
p.scripts.typecheck = 'tsc --noEmit';
p.scripts.seed = 'tsx prisma/seed-complete.ts';
p.scripts['seed:universities'] = 'tsx prisma/seed-universities.ts';
p.scripts['seed:homepage'] = 'tsx scripts/seed-homepage.ts';
p.scripts['db:seed'] = 'tsx prisma/seed-complete.ts';
p.scripts.test = "echo 'No tests yet - see EVIDENCE-REPORT.md section 13' && exit 0";
p.scripts.postinstall = 'prisma generate || true';

fs.writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n');
console.log('Scripts updated:');
console.log(JSON.stringify(p.scripts, null, 2));
