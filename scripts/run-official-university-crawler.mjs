import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { AstonAdapter } from '../src/lib/official-crawlers/aston-adapter.ts';

const outputDir = 'data/official-source-audit';
mkdirSync(outputDir, { recursive: true });

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const courseLimit = Number(limitArg?.split('=')[1] || process.env.ASTON_COURSE_LIMIT || 10);
const writeDb = args.has('--write-db');

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(fileName, rows) {
  if (rows.length === 0) {
    writeFileSync(join(outputDir, fileName), '');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  writeFileSync(join(outputDir, fileName), `${lines.join('\n')}\n`);
}

function sourceCheckToRow(check, targetType = '', targetId = '') {
  return {
    targetType,
    targetId,
    sourceType: check.sourceType,
    requestedUrl: check.requestedUrl,
    finalUrl: check.finalUrl,
    httpStatus: check.httpStatus,
    pageTitle: check.pageTitle,
    expectedEntity: check.expectedEntity,
    entityMatchStatus: check.entityMatchStatus,
    soft404: check.soft404 ? 'YES' : 'NO',
    contentHash: check.contentHash,
    checkedAt: check.checkedAt,
    verificationStatus: check.ok && !check.soft404 && check.entityMatchStatus !== 'MISMATCHED' ? 'FETCHED' : 'FETCH_FAILED',
    failureReason: check.failureReason || '',
  };
}

async function persistSourceChecks(rows) {
  const prisma = new PrismaClient();
  try {
    for (const row of rows) {
      await prisma.crmOfficialSourceCheck.create({
        data: {
          targetType: row.targetType,
          targetId: row.targetId,
          sourceType: row.sourceType,
          requestedUrl: row.requestedUrl,
          finalUrl: row.finalUrl,
          httpStatus: Number(row.httpStatus || 0),
          pageTitle: row.pageTitle,
          expectedEntity: row.expectedEntity,
          entityMatchStatus: row.entityMatchStatus,
          soft404: row.soft404 === 'YES',
          contentHash: row.contentHash,
          checkedAt: row.checkedAt,
          verificationStatus: row.verificationStatus,
          failureReason: row.failureReason,
          parserVersion: 'aston-adapter-2026-08-01',
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const adapter = new AstonAdapter();

  const profile = await adapter.parseUniversityProfile();
  const profileChecks = profile.officialSourceChecks || [];
  const catalogCheck = await adapter.fetchSourceCheck('https://www.aston.ac.uk/courses-atoz', 'COURSE_DIRECTORY');
  const discoveries = catalogCheck.html ? adapter.discoverCourseUrlsFromHtml(catalogCheck.html, catalogCheck.finalUrl) : [];
  const selectedDiscoveries = discoveries.slice(0, Number.isFinite(courseLimit) && courseLimit > 0 ? courseLimit : 10);

  const courseRows = [];
  const intakeRows = [];
  const sourceRows = [
    ...profileChecks.map((check) => sourceCheckToRow(check, 'UNIVERSITY', 'Aston University')),
    sourceCheckToRow(catalogCheck, 'COURSE_DIRECTORY', 'Aston University'),
  ];
  const parsingFailures = [];

  for (const discovery of selectedDiscoveries) {
    await new Promise((resolve) => setTimeout(resolve, 3100));
    const check = await adapter.fetchSourceCheck(discovery.url, 'INDIVIDUAL_COURSE', 'Aston University');
    sourceRows.push(sourceCheckToRow(check, 'COURSE', discovery.url));
    if (!check.ok || !check.html || check.soft404) {
      parsingFailures.push({
        url: discovery.url,
        reason: check.failureReason || 'Fetch failed or soft 404.',
        httpStatus: check.httpStatus,
      });
      continue;
    }

    const course = adapter.parseCoursePage(check.html, check.finalUrl, check);
    const validation = adapter.validateRecord(course);
    courseRows.push({
      officialCourseTitle: course.officialCourseTitle,
      officialCourseUrl: course.officialCourseUrl,
      award: course.award,
      studyLevel: course.studyLevel,
      campus: course.campus,
      deliveryMode: course.deliveryMode,
      studyMode: course.studyMode,
      duration: course.duration,
      internationalTuitionFee: course.internationalTuitionFee ?? 'NOT_PUBLISHED',
      feeCurrency: course.feeCurrency,
      feeYear: course.feeYear,
      ieltsOverall: course.ieltsOverall ?? 'NOT_PUBLISHED',
      ieltsComponentMin: course.ieltsComponentMin ?? 'NOT_PUBLISHED',
      intakesCount: course.intakes.length,
      verificationStatus: course.verificationStatus,
      parseWarnings: (course.parseWarnings || []).join('; '),
      validationErrors: validation.errors.join('; '),
      contentChecksum: course.contentChecksum,
      pageTitle: course.pageTitle,
    });

    for (const intake of course.intakes) {
      intakeRows.push({
        officialCourseUrl: course.officialCourseUrl,
        intakeMonth: intake.intakeMonth,
        intakeYear: intake.intakeYear,
        deadline: intake.deadline || 'NOT_PUBLISHED',
        tuitionFee: intake.tuitionFee ?? course.internationalTuitionFee ?? 'NOT_PUBLISHED',
        feeCurrency: intake.feeCurrency || course.feeCurrency || 'NOT_PUBLISHED',
        status: intake.status,
      });
    }
  }

  writeCsv('aston_official_source_checks.csv', sourceRows);
  writeCsv('aston_course_discovery.csv', discoveries.map((item) => ({
    url: item.url,
    sourceUrl: item.sourceUrl,
    linkText: item.linkText,
    contentHash: item.contentHash,
  })));
  writeCsv('aston_courses_parsed.csv', courseRows);
  writeCsv('aston_intakes_parsed.csv', intakeRows);
  writeCsv('aston_parsing_failures.csv', parsingFailures);

  if (writeDb) {
    await persistSourceChecks(sourceRows);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    startedAt,
    adapter: adapter.adapterName,
    status: 'PARTIAL_ASTON_OFFICIAL_SMOKE',
    writeDb,
    catalogUrl: 'https://www.aston.ac.uk/courses-atoz',
    catalogHttpStatus: catalogCheck.httpStatus,
    catalogPageTitle: catalogCheck.pageTitle,
    catalogEntriesDiscovered: discoveries.length,
    uniqueCoursePagesSelectedForSmoke: selectedDiscoveries.length,
    individualCoursePagesChecked: sourceRows.filter((row) => row.sourceType === 'INDIVIDUAL_COURSE').length,
    coursesParsed: courseRows.length,
    intakeRecordsParsed: intakeRows.length,
    parsingFailures: parsingFailures.length,
    verifiedCourses: courseRows.filter((row) => row.verificationStatus === 'VERIFIED').length,
    needsReviewCourses: courseRows.filter((row) => row.verificationStatus !== 'VERIFIED').length,
    note: 'This is an Aston official-source smoke crawl. It does not publish course rows and does not complete full Aston verification.',
  };

  writeFileSync(join(outputDir, 'aston_verification_report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(outputDir, 'aston_verification_report.md'), `# Aston University Official Source Smoke Report

- Status: ${report.status}
- Catalogue URL: ${report.catalogUrl}
- Catalogue HTTP status: ${report.catalogHttpStatus}
- Catalogue page title: ${report.catalogPageTitle}
- Catalogue entries discovered: ${report.catalogEntriesDiscovered}
- Individual course pages checked: ${report.individualCoursePagesChecked}
- Courses parsed: ${report.coursesParsed}
- Intake records parsed: ${report.intakeRecordsParsed}
- Parsing failures: ${report.parsingFailures}
- Verified courses: ${report.verifiedCourses}
- Needs-review courses: ${report.needsReviewCourses}

Rows were written to CSV reports only. No course was published by this script.
`);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
