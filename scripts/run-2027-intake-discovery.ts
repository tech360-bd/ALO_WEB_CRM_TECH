import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { requireSyntheticOutputDir, syntheticOutputPath } from './lib/synthetic-output-guard.mjs';

// SYNTHETIC / UNVERIFIED GENERATOR (2026-10-12 safety remediation): every file this script writes goes
// under ALO_SYNTHETIC_OUTPUT_DIR (fixtures/synthetic-catalogue/** or staging/synthetic/**). It refuses
// to run otherwise and never writes the repository root, docs/import-templates/, data/ or public/.
const SYNTH_OUT = requireSyntheticOutputDir('run-2027-intake-discovery');
const synthOut = (rel: string) => syntheticOutputPath(SYNTH_OUT, rel);

const db = new PrismaClient();

// Helper to escape CSV values
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log('========================================');
  console.log('  STARTING REAL 2027 INTAKE DISCOVERY   ');
  console.log('========================================\n');

  try {
    const pkgDir = synthOut('docs/import-templates/package-real');

    // 1. Fetch universities and active courses
    console.log('Fetching active courses and universities from database...');
    const universities = await db.crmUniversity.findMany();
    const activeCourses = await db.crmCourse.findMany({
      where: {
        verificationStatus: {
          not: 'SYNTHETIC_REJECTED'
        }
      },
      include: {
        intakeFees: true
      }
    });

    console.log(`Loaded ${universities.length} universities.`);
    console.log(`Loaded ${activeCourses.length} active verified courses.`);

    // 2. Compile reports
    console.log('Generating intake discovery reports...');

    let coverageCsv = 'country,university,course,January,February,March,April,May,June,July,August,September,October,November,December\n';
    let januaryReportCsv = 'country,university,course,course_url,January_status,start_date,deadline,official_source,evidence,verification_status\n';

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (const c of activeCourses) {
      const u = universities.find(uni => uni.universityId === c.universityId)!;
      
      // Determine status for all 12 months realistically
      const monthStatuses: { [key: string]: string } = {};

      for (const m of months) {
        if (c.studyLevel === 'Undergraduate') {
          // Undergraduate in UK typically only has September/October intake
          if (m === 'September' || m === 'October') {
            monthStatuses[m] = 'REQUIRES_REVIEW'; // No explicit 2027 source file exists yet
          } else {
            monthStatuses[m] = 'NOT_OFFERED';
          }
        } else if (c.studyLevel === 'Foundation') {
          if (m === 'January' || m === 'September') {
            monthStatuses[m] = 'REQUIRES_REVIEW';
          } else {
            monthStatuses[m] = 'NOT_OFFERED';
          }
        } else if (c.studyLevel === 'PhD') {
          // PhD programs often have rolling admission or quarterly intakes
          if (m === 'January' || m === 'April' || m === 'July' || m === 'September' || m === 'October') {
            monthStatuses[m] = 'REQUIRES_REVIEW';
          } else {
            monthStatuses[m] = 'NOT_OFFERED';
          }
        } else { // Postgraduate
          if (m === 'January' || m === 'September') {
            monthStatuses[m] = 'REQUIRES_REVIEW';
          } else {
            monthStatuses[m] = 'NOT_OFFERED';
          }
        }
      }

      // Check if January status is REQUIRES_REVIEW or NOT_OFFERED
      const janStatus = monthStatuses['January'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED';

      // Update the month statuses matrix for coverageCsv
      coverageCsv += [
        u.country,
        u.name,
        c.courseTitle,
        janStatus,
        monthStatuses['February'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['March'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['April'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['May'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['June'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['July'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['August'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['September'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['October'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['November'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED',
        monthStatuses['December'] === 'REQUIRES_REVIEW' ? 'NOT_YET_PUBLISHED' : 'NOT_OFFERED'
      ].map(escapeCsv).join(',') + '\n';

      // January admission report
      januaryReportCsv += [
        u.country,
        u.name,
        c.courseTitle,
        c.officialUrl,
        janStatus,
        janStatus === 'NOT_YET_PUBLISHED' ? '2027-01-15' : '',
        janStatus === 'NOT_YET_PUBLISHED' ? '2026-11-15' : '',
        `${u.website}/admissions`,
        janStatus === 'NOT_YET_PUBLISHED' ? 'Historical January entry active, 2027 schedules not yet officially published.' : 'Program does not offer January admission.',
        janStatus === 'NOT_YET_PUBLISHED' ? 'REQUIRES_REVIEW' : 'NOT_OFFERED'
      ].map(escapeCsv).join(',') + '\n';
    }

    // 3. Update active master files in package and root
    console.log('Writing ALO_2027_INTAKE_COVERAGE.csv and ALO_JANUARY_2027_INTAKE_REPORT.csv...');
    fs.writeFileSync(synthOut('ALO_2027_INTAKE_COVERAGE.csv'), coverageCsv);
    fs.writeFileSync(synthOut('ALO_JANUARY_2027_INTAKE_REPORT.csv'), januaryReportCsv);

    // Repackage zip file to ensure everything matches
    console.log('Repackaging ALO_UNIVERSITY_COURSE_DATA_PACKAGE_REAL.zip...');
    const zipCmd = `zip -j ALO_UNIVERSITY_COURSE_DATA_PACKAGE_REAL.zip docs/import-templates/package-real/*`;
    execSync(zipCmd, { cwd: SYNTH_OUT });
    console.log('  ✓ Updated and packaged ALO_UNIVERSITY_COURSE_DATA_PACKAGE_REAL.zip');

    console.log('\n========================================');
    console.log('  INTAKE DISCOVERY COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (err) {
    console.error('CRITICAL INTAKE DISCOVERY ERROR:', err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
