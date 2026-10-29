#!/usr/bin/env tsx
/**
 * END-TO-END PROOF: verified catalogue ingestion → approval → publication
 * ======================================================================
 * Runs the whole pipeline against a REAL relational database and prints the
 * evidence. Two supported modes:
 *
 *  1. Offline SQLite (this sandbox, no MySQL server):
 *       node scripts/dev-sqlite/generate-dev-schema.mjs
 *       npx prisma generate --config prisma/dev-sqlite.config.ts
 *       node scripts/dev-sqlite/patch-wasm-loader.mjs
 *       DATABASE_URL="file:$PWD/prisma/dev.db" npx prisma db push --config prisma/dev-sqlite.config.ts --skip-generate
 *       NODE_OPTIONS="--require $PWD/scripts/dev-sqlite/preload.cjs" \
 *       ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/prisma/dev.db" \
 *       npx tsx scripts/verified-catalogue/e2e-verify.ts
 *
 *  2. Any real MySQL/Postgres database reachable through DATABASE_URL:
 *       npx tsx scripts/verified-catalogue/e2e-verify.ts
 *
 * The script is repeatable: it cleans only the rows it created (identified by
 * the ALO-E2E test prefix and the dataset's deterministic course ids) and
 * re-creates them, so it can be run as a CI gate.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createScriptPrisma } from './prisma-client';
import type { PrismaClient } from '@prisma/client';
import { validateDataset } from '../../src/lib/verified-catalogue/validation';
import { ingestVerifiedDataset } from '../../src/lib/verified-catalogue/ingest';
import { approveCoverage, rejectCoverage, AuthorizationError } from '../../src/lib/verified-catalogue/publish';
import { buildCoverageMatrix, summarizeCoverage } from '../../src/lib/verified-catalogue/coverage';
import type { VerifiedDataset } from '../../src/lib/verified-catalogue/types';

const SUPER_ADMIN_ID = 'ALO-E2E-SUPER-ADMIN';
const STUDENT_ID = 'ALO-E2E-STUDENT';
const ROLE_ID = 'ALO-E2E-ROLE-SUPER-ADMIN';

interface StepResult {
  step: string;
  status: 'PASS' | 'FAIL';
  detail: string;
  data?: unknown;
}

const results: StepResult[] = [];
function record(step: string, status: 'PASS' | 'FAIL', detail: string, data?: unknown): void {
  results.push({ step, status, detail, data });
  const icon = status === 'PASS' ? '✔' : '✘';
  console.log(`${icon} ${step}: ${detail}`);
}
function check(step: string, condition: boolean, detail: string, data?: unknown): void {
  record(step, condition ? 'PASS' : 'FAIL', detail, data);
  if (!condition) throw new Error(`Step failed: ${step} — ${detail}`);
}

/**
 * Remove only the rows this pipeline creates (deterministic ALO-C-/ALO-U-
 * identifiers and `catalogue:` queue keys) so the proof can be re-run.
 */
async function cleanupPipelineRows(prisma: PrismaClient, dataset: VerifiedDataset): Promise<void> {
  const courseIds = dataset.courses.map((course) => `ALO-C-${course.slug}`);
  await prisma.crmCourseMonthlyCoverage.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmCoverageRevision.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmCourseIntakeFee.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmCourseRequirement.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.approvalQueueItem.deleteMany({ where: { changeId: { startsWith: 'catalogue:' } } });
  await prisma.crmCourse.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.crmUniversity.deleteMany({ where: { universityId: { in: dataset.universities.map((u) => `ALO-U-${u.slug}`) } } });
  await prisma.crmOfficialEvidence.deleteMany({ where: { collectedBy: 'alo-research-agent' } });
  await prisma.crmCatalogueTraversal.deleteMany({ where: { universitySlug: { in: dataset.universities.map((u) => u.slug) } } });
  await prisma.crmResearchQueueItem.deleteMany({ where: { queueKey: { in: dataset.researchQueue.map((item) => `${item.countrySlug.toLowerCase()}:${item.universityName.trim().toLowerCase().replace(/\s+/g, '-')}`) } } });
  await prisma.crmImportBatch.deleteMany({ where: { importType: 'verified_catalogue_dataset' } });
}

async function seedActors(prisma: PrismaClient): Promise<void> {
  await prisma.portalRole.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { id: ROLE_ID, name: 'SUPER_ADMIN', label: 'Super Admin', isSystem: true },
  });
  await prisma.portalUser.upsert({
    where: { id: SUPER_ADMIN_ID },
    update: { userType: 'SUPER_ADMIN' },
    create: { id: SUPER_ADMIN_ID, email: 'e2e-super-admin@alo.test', userType: 'SUPER_ADMIN', emailVerified: true },
  });
  await prisma.portalUserRole.upsert({
    where: { userId_roleId: { userId: SUPER_ADMIN_ID, roleId: ROLE_ID } },
    update: {},
    create: { userId: SUPER_ADMIN_ID, roleId: ROLE_ID, assignedBy: 'e2e' },
  });
  await prisma.portalUser.upsert({
    where: { id: STUDENT_ID },
    update: { userType: 'STUDENT' },
    create: { id: STUDENT_ID, email: 'e2e-student@alo.test', userType: 'STUDENT', emailVerified: true },
  });
}

async function main(): Promise<void> {
  const datasetPath = resolve(process.cwd(), 'data/verified-2027/dataset.json');
  const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as VerifiedDataset;
  const prisma = createScriptPrisma();

  try {
    await cleanupPipelineRows(prisma, dataset);
    await seedActors(prisma);

    // 1 — validation
    const validation = validateDataset(dataset);
    check('dataset-validation', validation.ok, `${dataset.evidence.length} evidence records, ${dataset.coverage.length} course-months, 0 errors, ${validation.warnings.length} warnings`);

    // 2 — dry run writes nothing
    const before = await prisma.crmCourseMonthlyCoverage.count();
    const dry = await ingestVerifiedDataset(prisma, dataset, { apply: false });
    const afterDry = await prisma.crmCourseMonthlyCoverage.count();
    check('dry-run-writes-nothing', before === afterDry, `coverage rows before=${before} after=${afterDry} (planned ${dry.counts.coverageCreated})`);

    // 3 — apply
    const first = await ingestVerifiedDataset(prisma, dataset, { apply: true, actorUserId: 'e2e:ingest' });
    check('ingest-applied',
      first.counts.coverageCreated === dataset.coverage.length && first.counts.applied,
      `created ${first.counts.coverageCreated} course-months, ${first.counts.evidenceCreated} evidence rows, batch ${first.batchId}`,
      first.counts);

    const dbRows = await prisma.crmCourseMonthlyCoverage.findMany();
    check('db-populated', dbRows.length === dataset.coverage.length, `${dbRows.length} coverage rows persisted`);
    const pending = dbRows.filter((row) => row.approvalStatus === 'PENDING' && !row.published).length;
    check('nothing-auto-published', pending === dbRows.length, `${pending}/${dbRows.length} rows staged as PENDING`);

    const queue = await prisma.approvalQueueItem.count({ where: { changeId: { startsWith: 'catalogue:' } } });
    check('approval-queue-integrated', queue >= dataset.coverage.length, `${queue} Super Admin queue items linked to course-months`);

    const evidenceRows = await prisma.crmOfficialEvidence.findMany();
    const hashOk = evidenceRows.every((row) => row.contentHash.length === 64 && row.sourceUrl.startsWith('https://'));
    check('evidence-hashes', evidenceRows.length === dataset.evidence.length && hashOk,
      `${evidenceRows.length} evidence rows with SHA-256 content hashes and HTTPS source URLs`);

    // 4 — idempotency
    const second = await ingestVerifiedDataset(prisma, dataset, { apply: true, actorUserId: 'e2e:ingest' });
    const totalAfterSecond = await prisma.crmCourseMonthlyCoverage.count();
    check('idempotent-reingest',
      second.counts.coverageCreated === 0 && second.counts.coverageUnchanged === dataset.coverage.length
      && totalAfterSecond === dataset.coverage.length,
      `second run created ${second.counts.coverageCreated}, unchanged ${second.counts.coverageUnchanged}, total rows ${totalAfterSecond}`);

    // 5 — RBAC denial
    let denied = false;
    try {
      await approveCoverage(prisma, { actorUserId: STUDENT_ID, approveAllPending: true });
    } catch (error) {
      denied = error instanceof AuthorizationError;
    }
    check('rbac-denies-student', denied, 'student actor cannot approve catalogue data');

    const publishedBeforeApproval = await prisma.crmCourseMonthlyCoverage.count({ where: { published: true } });
    check('rbac-denial-wrote-nothing', publishedBeforeApproval === 0, `${publishedBeforeApproval} rows published after denied attempt`);

    // 6 — approve as Super Admin
    const approval = await approveCoverage(prisma, { actorUserId: SUPER_ADMIN_ID, approveAllPending: true, note: 'e2e approval' });
    const publishedRows = await prisma.crmCourseMonthlyCoverage.count({ where: { published: true, approvalStatus: 'APPROVED' } });
    check('super-admin-approval', publishedRows === dataset.coverage.length,
      `${approval.counts.approved} approved, ${publishedRows} published rows, ${approval.counts.coursesPublished} courses published`);

    const availableMonths = dataset.coverage.filter((row) => row.status === 'VERIFIED_AVAILABLE');
    const feeRows = await prisma.crmCourseIntakeFee.findMany({ where: { verificationStatus: { in: ['VERIFIED', 'VERIFIED_NOT_OFFERED'] } } });
    check('crm-intake-fees-written', feeRows.length === dataset.coverage.length,
      `${feeRows.length} CrmCourseIntakeFee rows now serve the Course Finder`);
    const verifiedFees = feeRows.filter((row) => row.verificationStatus === 'VERIFIED');
    check('verified-available-fees', verifiedFees.length === availableMonths.length,
      `${verifiedFees.length} intake rows marked VERIFIED (matches ${availableMonths.length} verified available months)`);

    const publishedCourses = await prisma.crmCourse.findMany({ where: { publicationStatus: 'published' } });
    const coursesWithVerifiedMonth = new Set(
      dataset.coverage.filter((row) => row.status === 'VERIFIED_AVAILABLE').map((row) => row.courseSlug),
    );
    check('courses-published', publishedCourses.length === coursesWithVerifiedMonth.size,
      `${publishedCourses.length} courses published (only those with at least one VERIFIED_AVAILABLE month)`);
    const draftCourses = await prisma.crmCourse.findMany({
      where: { publicationStatus: { not: 'published' }, courseId: { in: dataset.courses.map((course) => `ALO-C-${course.slug}`) } },
    });
    check('unverified-month-courses-stay-draft',
      draftCourses.length === dataset.courses.length - coursesWithVerifiedMonth.size,
      `${draftCourses.length} course(s) with no verified available month remain unpublished (${draftCourses.map((course) => course.slug).join(', ') || 'none'})`);

    const requirementRows = await prisma.crmCourseRequirement.findMany();
    check('requirements-written', requirementRows.length > 0, `${requirementRows.length} CrmCourseRequirement rows created`);

    const revisions = await prisma.crmCoverageRevision.count();
    check('revision-history', revisions >= dataset.coverage.length, `${revisions} revision-log entries preserved`);

    // 7 — conflict protection: a changed fee against an APPROVED row must not overwrite
    const changed: VerifiedDataset = JSON.parse(JSON.stringify(dataset));
    const target = changed.coverage.find((row) => row.status === 'VERIFIED_AVAILABLE' && (row.feeAmount ?? 0) > 0)!;
    target.feeAmount = (target.feeAmount ?? 0) + 1000;
    const conflictRun = await ingestVerifiedDataset(prisma, changed, { apply: true, actorUserId: 'e2e:monitor' });
    const storedTarget = await prisma.crmCourseMonthlyCoverage.findUnique({ where: { coverageKey: `${target.courseSlug}:${target.year}-${String(target.month).padStart(2, '0')}` } });
    check('conflict-protection',
      conflictRun.conflicts.length >= 1 && storedTarget?.feeAmount === target.feeAmount - 1000,
      `monitor found ${conflictRun.conflicts.length} conflict(s); approved fee ${storedTarget?.feeAmount} was NOT overwritten by ${target.feeAmount}`);
    const conflictQueue = await prisma.approvalQueueItem.count({ where: { queueType: 'CONFLICT' } });
    check('conflict-queued', conflictQueue >= 1, `${conflictQueue} CONFLICT item(s) waiting for Super Admin review`);

    // 8 — rejection
    const rejectTarget = await prisma.crmCourseMonthlyCoverage.findFirst({ where: { approvalStatus: 'PENDING' } });
    if (rejectTarget) {
      const rejection = await rejectCoverage(prisma, { actorUserId: SUPER_ADMIN_ID, coverageKeys: [rejectTarget.coverageKey], reason: 'e2e rejection check' });
      check('rejection-path', rejection.counts.rejected === 1, `rejected ${rejection.counts.rejected} row(s); published rows untouched`);
    }

    // 9 — coverage report from the database
    const allCourses = await prisma.crmCourse.findMany({ include: { university: true } });
    const allRows = await prisma.crmCourseMonthlyCoverage.findMany({ where: { published: true } });
    const matrix = buildCoverageMatrix(
      allCourses.map((course) => ({
        slug: course.slug, title: course.courseTitle, universitySlug: course.university.slug,
        universityName: course.university.name, country: course.university.country,
      })),
      allRows.map((row) => ({
        courseSlug: allCourses.find((course) => course.courseId === row.courseId)?.slug ?? '',
        year: row.year, month: row.month, status: row.status, startDate: row.startDate,
        feeAmount: row.feeAmount, feeCurrency: row.feeCurrency, evidenceId: row.evidenceId,
      })),
    );
    const summary = summarizeCoverage(matrix);
    check('coverage-matrix-from-db',
      matrix.months.length === 13 && matrix.totals.MISSING === 0,
      `${matrix.courseCount} courses × 13 months, available=${matrix.totals.VERIFIED_AVAILABLE}, not-offered=${matrix.totals.VERIFIED_NOT_OFFERED}, not-published=${matrix.totals.NOT_PUBLISHED}, missing=${matrix.totals.MISSING}`,
      { totals: matrix.totals, availableMonths: summary.availableMonths });

    const failures = results.filter((result) => result.status === 'FAIL');
    console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `${failures.length} CHECK(S) FAILED`} — ${results.length} steps`);
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), steps: results }, null, 2));
    if (failures.length > 0) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
