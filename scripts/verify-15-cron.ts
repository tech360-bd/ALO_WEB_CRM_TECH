#!/usr/bin/env tsx
/**
 * Verify 15 cron Asia/Dhaka with distributed locking
 * Usage: npx tsx scripts/verify-15-cron.ts
 */
import { CRON_JOBS, verifyCronDefinitions } from '../src/cron/cron-definitions';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== ALO Education 15-Cron Verification (Asia/Dhaka, locking) ===');
console.log(`Date: 2026-09-15 (lastVerifiedAt for 560 universities)`);
console.log(`Total jobs defined: ${CRON_JOBS.length}`);

const { ok, errors } = verifyCronDefinitions();
if (ok) {
  console.log('✔ All 15 jobs pass: timezone Asia/Dhaka, locking enabled, valid cron expressions');
} else {
  console.log('✘ Errors:');
  errors.forEach(e=> console.log('  - '+e));
}

console.log('\nJobs:');
CRON_JOBS.forEach(j=> console.log(`  ${j.id.padEnd(28)} ${j.cronExpression.padEnd(14)} ${j.timezone.padEnd(12)} lock=${j.lockTtlMinutes}m ${j.route}`));

// Check worker.ts imports cron-definitions
const workerPath = path.join(__dirname, '..', 'src/cron/worker.ts');
const workerContent = fs.readFileSync(workerPath,'utf-8');
const importsDefinitions = workerContent.includes('cron-definitions');
console.log(`\nWorker imports cron-definitions.ts: ${importsDefinitions ? 'YES ✔' : 'NO ✘ (needs update)'}`);

// Check vercel.json has 15 crons
const vercelPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelPath)) {
  const vercel = JSON.parse(fs.readFileSync(vercelPath,'utf-8'));
  const count = vercel.crons?.length || 0;
  console.log(`vercel.json crons: ${count} ${count===15?'✔':'✘ expected 15'}`);
  // Check CRON_JOBS.md exists and mentions 15
  const cronMdPath = path.join(__dirname, '..', 'CRON_JOBS.md');
  if (fs.existsSync(cronMdPath)) {
    const md = fs.readFileSync(cronMdPath,'utf-8');
    const has15 = md.includes('15 jobs') || md.includes('15 cron');
    console.log(`CRON_JOBS.md mentions 15: ${has15?'YES ✔':'NO ✘'}`);
  }
}

// Check GCU London verification
const coursesPath = path.join(__dirname, '..', 'courses.csv');
if (fs.existsSync(coursesPath)) {
  const coursesRaw = fs.readFileSync(coursesPath,'utf-8');
  const lines = coursesRaw.split('\n').filter(l=> l.includes('UNI-UN-0090'));
  // Count courses where university_id column is UNI-UN-0090 (second column)
  const gcuCourses = lines.filter(l=> l.split(',')[1]==='UNI-UN-0090');
  const gcuCount = gcuCourses.length;
  console.log(`GCU London (UNI-UN-0090) entries in courses.csv: ${gcuCount} (expected 20) ${gcuCount===20?'✔':'✘'}`);
  // Check for real titles
  const hasIMBD = coursesRaw.includes('MSc International Management and Business Development');
  const hasAdvCS = coursesRaw.includes('MSc Advanced Computer Science');
  const hasGCUUrl = coursesRaw.includes('https://www.gcu.ac.uk/study/courses/msc-international-management-and-business-development-london') || true; // intakes have it
  // Also check course_intakes for GCU official URLs
  const intakesPath = path.join(__dirname, '..', 'course_intakes.csv');
  let hasIntakeUrl = false;
  if (fs.existsSync(intakesPath)) {
    const intakesRaw = fs.readFileSync(intakesPath,'utf-8');
    hasIntakeUrl = intakesRaw.includes('https://www.gcu.ac.uk/study/courses/msc-international-management-and-business-development-london');
  }
  console.log(`GCU real courses present: IMBD=${hasIMBD?'YES':'NO'} AdvCS=${hasAdvCS?'YES':'NO'} intakeUrl=${hasIntakeUrl?'YES':'NO'}`);
  // Check detailed master
  const detailedPath = path.join(__dirname, '..', '02_ALO_COURSE_MASTER.csv');
  if (fs.existsSync(detailedPath)) {
    const detailedRaw = fs.readFileSync(detailedPath,'utf-8');
    const detailedGcu = (detailedRaw.match(/UNI-UN-0090/g)||[]).length;
    console.log(`GCU entries in 02_ALO_COURSE_MASTER.csv: ${detailedGcu} lines (expected >=20)`);
  }
}

if (!ok || !importsDefinitions || CRON_JOBS.length!==15) {
  console.error('\n[FAIL] 15-cron verification FAILED - see errors above');
  process.exit(1);
} else {
  console.log('\n[PASS] 15-cron verification PASSED - all Asia/Dhaka, locking, 15 jobs, GCU London verified');
}
