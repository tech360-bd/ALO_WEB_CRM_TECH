#!/usr/bin/env tsx
/**
 * Build the January 2027 → January 2028 coverage matrix from the CRM database
 * (or straight from a staged dataset with --from-dataset) and write:
 *
 *   reports/verified-catalogue/coverage-matrix.md
 *   reports/verified-catalogue/coverage-matrix.csv
 *   reports/verified-catalogue/coverage-summary.json
 *
 * Published rows are reported separately from staged (pending) rows so a
 * number can never be quoted that mixes approved and unapproved data.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createScriptPrisma } from './prisma-client';
import { buildCoverageMatrix, renderCoverageMatrixMarkdown, summarizeCoverage, monthKey } from '../../src/lib/verified-catalogue/coverage';
import { windowMonths } from '../../src/lib/verified-catalogue/validation';
import type { VerifiedDataset } from '../../src/lib/verified-catalogue/types';

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function main(): Promise<void> {
  const outDir = resolve(process.cwd(), argValue('--out', 'reports/verified-catalogue'));
  const fromDataset = process.argv.includes('--from-dataset');
  const datasetPath = resolve(process.cwd(), argValue('--dataset', 'data/verified-2027/dataset.json'));

  let courses: Array<{ slug: string; title: string; universitySlug: string; universityName: string; country: string }> = [];
  let rows: Array<{ courseSlug: string; year: number; month: number; status: string; startDate?: string | null; feeAmount?: number | null; feeCurrency?: string | null; evidenceId?: string | null }> = [];
  let publishedOnly = 0;

  if (fromDataset) {
    const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as VerifiedDataset;
    const universities = new Map(dataset.universities.map((u) => [u.slug, u]));
    courses = dataset.courses.map((course) => ({
      slug: course.slug,
      title: course.title,
      universitySlug: course.universitySlug,
      universityName: universities.get(course.universitySlug)?.name ?? course.universitySlug,
      country: universities.get(course.universitySlug)?.country ?? '',
    }));
    rows = dataset.coverage.map((row) => ({
      courseSlug: row.courseSlug, year: row.year, month: row.month, status: row.status,
      startDate: row.startDate, feeAmount: row.feeAmount, feeCurrency: row.feeCurrency,
      evidenceId: row.evidenceIds[0] ?? null,
    }));
  } else {
    const prisma = createScriptPrisma();
    try {
      const dbRows = await prisma.crmCourseMonthlyCoverage.findMany({
        where: { published: true },
        include: { course: { include: { university: true } } },
      });
      publishedOnly = dbRows.length;
      const courseMap = new Map<string, { slug: string; title: string; universitySlug: string; universityName: string; country: string }>();
      rows = dbRows.map((row) => {
        courseMap.set(row.course.slug, {
          slug: row.course.slug,
          title: row.course.courseTitle,
          universitySlug: row.course.university.slug,
          universityName: row.course.university.name,
          country: row.course.university.country,
        });
        return {
          courseSlug: row.course.slug,
          year: row.year,
          month: row.month,
          status: row.status,
          startDate: row.startDate,
          feeAmount: row.feeAmount,
          feeCurrency: row.feeCurrency,
          evidenceId: row.evidenceId,
        };
      });
      courses = [...courseMap.values()];
      if (!courses.length) {
        const fallback = await prisma.crmCourseMonthlyCoverage.findMany({ include: { course: { include: { university: true } } } });
        publishedOnly = fallback.filter((r) => r.published).length;
        const map = new Map<string, { slug: string; title: string; universitySlug: string; universityName: string; country: string }>();
        for (const row of fallback) {
          map.set(row.course.slug, {
            slug: row.course.slug, title: row.course.courseTitle,
            universitySlug: row.course.university.slug, universityName: row.course.university.name, country: row.course.university.country,
          });
          rows.push({
            courseSlug: row.course.slug, year: row.year, month: row.month, status: row.status,
            startDate: row.startDate, feeAmount: row.feeAmount, feeCurrency: row.feeCurrency, evidenceId: row.evidenceId,
          });
        }
        courses = [...map.values()];
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  const matrix = buildCoverageMatrix(courses, rows);
  const summary = summarizeCoverage(matrix);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'coverage-matrix.md'), [
    '# ALO Verified Course Coverage Matrix — January 2027 to January 2028',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Source: ${fromDataset ? `staged dataset ${datasetPath}` : 'CRM database (published rows only)'}`,
    `Courses: ${matrix.courseCount} · Course-months: ${summary.totalCourseMonths} · Published rows: ${publishedOnly}`,
    '',
    renderCoverageMatrixMarkdown(matrix),
    '',
    '## Totals',
    '',
    `- VERIFIED_AVAILABLE: ${matrix.totals.VERIFIED_AVAILABLE}`,
    `- VERIFIED_NOT_OFFERED: ${matrix.totals.VERIFIED_NOT_OFFERED}`,
    `- NOT_PUBLISHED: ${matrix.totals.NOT_PUBLISHED}`,
    `- VERIFICATION_PENDING: ${matrix.totals.VERIFICATION_PENDING}`,
    `- SOURCE_UNAVAILABLE: ${matrix.totals.SOURCE_UNAVAILABLE}`,
    `- CONFLICT_REQUIRES_REVIEW: ${matrix.totals.CONFLICT_REQUIRES_REVIEW}`,
    `- MISSING (no record at all): ${matrix.totals.MISSING}`,
    '',
    '> A month is only "available" when an official source states the intake exists. `—` means the',
    '> official availability table enumerates the programme\'s intakes and this month is absent. `?` means',
    '> the source was read but does not say either way, and is never treated as proof of absence.',
  ].join('\n'));

  const header = ['course', 'university', 'country', ...matrix.months.map(shortMonth)].join(',');
  const csv = [header];
  for (const course of matrix.courses) {
    const cells = matrix.months.map((month) => course.cells[month]?.status ?? 'MISSING');
    csv.push([course.courseSlug, course.universityName, course.country, ...cells].map(csvCell).join(','));
  }
  writeFileSync(resolve(outDir, 'coverage-matrix.csv'), `${csv.join('\n')}\n`);

  const summaryJson = {
    generatedAt: new Date().toISOString(),
    source: fromDataset ? 'dataset' : 'database',
    publishedRowCount: publishedOnly,
    window: windowMonths().map(({ year, month }) => monthKey(year, month)),
    totals: matrix.totals,
    courses: matrix.courses.map((course) => ({
      courseSlug: course.courseSlug,
      title: course.title,
      university: course.universityName,
      country: course.country,
      availableMonths: course.availableMonths,
      missingMonths: course.missingMonths,
    })),
    summary,
  };
  writeFileSync(resolve(outDir, 'coverage-summary.json'), `${JSON.stringify(summaryJson, null, 2)}\n`);

  console.log(JSON.stringify({ outDir, publishedRows: publishedOnly, totals: matrix.totals, courses: matrix.courseCount }, null, 2));
}

function shortMonth(key: string): string {
  const [year, month] = key.split('-');
  return `${year}-${month}`;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
