/**
 * Integration test: verified catalogue pipeline against a real database.
 *
 * Runs only when TEST_DATABASE_URL is provided (same convention as the other
 * live-DB suites in this folder). The self-contained equivalent that also
 * provisions SQLite is scripts/verified-catalogue/e2e-verify.ts.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { testDatabaseUrl } from '../helpers/test-database';
import { ingestVerifiedDataset } from '@/lib/verified-catalogue/ingest';
import { approveCoverage, AuthorizationError } from '@/lib/verified-catalogue/publish';
import { buildCoverageMatrix } from '@/lib/verified-catalogue/coverage';
import { validateDataset } from '@/lib/verified-catalogue/validation';
import type { VerifiedDataset } from '@/lib/verified-catalogue/types';

const url = testDatabaseUrl();
const suite = url ? describe : describe.skip;
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
const dataset = JSON.parse(readFileSync(resolve(process.cwd(), 'data/verified-2027/dataset.json'), 'utf8')) as VerifiedDataset;
const ADMIN_ID = 'ALO-IT-VERIFIED-ADMIN';
const STUDENT_ID = 'ALO-IT-VERIFIED-STUDENT';
const ROLE_ID = 'ALO-IT-VERIFIED-ROLE';
const courseIds = dataset.courses.map((course) => `ALO-C-${course.slug}`);

async function cleanup(): Promise<void> {
  await prisma.crmCourseMonthlyCoverage.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmCoverageRevision.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmCourseIntakeFee.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmCourseRequirement.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.approvalQueueItem.deleteMany({ where: { changeId: { startsWith: 'catalogue:' } } });
  await prisma.crmCourse.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmUniversity.deleteMany({ where: { universityId: { in: dataset.universities.map((u) => `ALO-U-${u.slug}`) } } });
  await prisma.crmOfficialEvidence.deleteMany({ where: { collectedBy: 'alo-research-agent' } });
  await prisma.crmImportBatch.deleteMany({ where: { importType: 'verified_catalogue_dataset' } });
}

suite('verified catalogue — real database', () => {
  beforeAll(async () => {
    await prisma.portalRole.upsert({ where: { name: 'SUPER_ADMIN' }, update: {}, create: { id: ROLE_ID, name: 'SUPER_ADMIN', label: 'Super Admin' } });
    await prisma.portalUser.upsert({ where: { id: ADMIN_ID }, update: {}, create: { id: ADMIN_ID, email: 'it-verified-admin@alo.test', userType: 'SUPER_ADMIN' } });
    await prisma.portalUser.upsert({ where: { id: STUDENT_ID }, update: {}, create: { id: STUDENT_ID, email: 'it-verified-student@alo.test', userType: 'STUDENT' } });
    await prisma.portalUserRole.upsert({ where: { userId_roleId: { userId: ADMIN_ID, roleId: ROLE_ID } }, update: {}, create: { userId: ADMIN_ID, roleId: ROLE_ID } });
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('validates, stages, refuses non-admin approval, then publishes after Super Admin approval', async () => {
    expect(validateDataset(dataset).ok).toBe(true);

    const first = await ingestVerifiedDataset(prisma, dataset, { apply: true, actorUserId: 'it:ingest' });
    expect(first.counts.coverageCreated).toBe(dataset.coverage.length);

    const second = await ingestVerifiedDataset(prisma, dataset, { apply: true, actorUserId: 'it:ingest' });
    expect(second.counts.coverageCreated).toBe(0);
    expect(second.counts.coverageUnchanged).toBe(dataset.coverage.length);

    await expect(approveCoverage(prisma, { actorUserId: STUDENT_ID, approveAllPending: true })).rejects.toBeInstanceOf(AuthorizationError);
    expect(await prisma.crmCourseMonthlyCoverage.count({ where: { published: true } })).toBe(0);

    const approval = await approveCoverage(prisma, { actorUserId: ADMIN_ID, approveAllPending: true });
    expect(approval.counts.approved).toBe(dataset.coverage.length);

    const published = await prisma.crmCourseMonthlyCoverage.findMany({
      where: { published: true }, include: { course: { include: { university: true } } },
    });
    const matrix = buildCoverageMatrix(
      published.map((row) => ({
        slug: row.course.slug, title: row.course.courseTitle, universitySlug: row.course.university.slug,
        universityName: row.course.university.name, country: row.course.university.country,
      })),
      published.map((row) => ({
        courseSlug: row.course.slug, year: row.year, month: row.month, status: row.status,
        startDate: row.startDate, feeAmount: row.feeAmount, feeCurrency: row.feeCurrency, evidenceId: row.evidenceId,
      })),
    );
    expect(matrix.totals.MISSING).toBe(0);
    expect(matrix.totals.VERIFIED_AVAILABLE).toBe(dataset.coverage.filter((row) => row.status === 'VERIFIED_AVAILABLE').length);
  }, 120000);
});
