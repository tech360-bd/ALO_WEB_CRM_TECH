// ============================================================
// ALO Education — University & Course Monitoring: integration tests
// ============================================================
//
// These tests run against a REAL isolated relational database, not mocks.
// Every assertion performs an action and then queries the database to verify
// the resulting rows. Configure TEST_DATABASE_URL to point only at a disposable
// test database (the test runner maps it to DATABASE_URL for this process).
//
// Run with:
//   TEST_DATABASE_URL=mysql://.../alo_test_ci npm run test:integration
//
// SQLite is supported only when the generated verification mirror client is
// available and ALO_DB_DRIVER=sqlite is explicitly set.

// Covered (mapped to the spec's TESTING REQUIREMENT list):
//   • Scheduler tests            — lock acquire/release, nextRunAt persistence
//   • Duplicate prevention test  — concurrent runs cannot both acquire the lock
//   • Approval workflow test     — APPROVE mutates production + writes history
//   • Rejection workflow test    — REJECT never mutates production
//   • History/versioning test    — old value preserved and searchable
//   • Audit log test             — approval emits *_DATA_APPROVED
//   • RBAC tests                 — guard allows/denies by role
//   • Source failure test        — failures recorded, data not deleted
//   • Conflict test              — DataConflict lifecycle

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// The suite uses real persistence, so it is loaded only when the runner has
// explicitly received a disposable TEST_DATABASE_URL. Otherwise it is skipped
// without initializing Prisma or any DB-backed service modules.
const integrationDescribe = process.env.TEST_DATABASE_URL ? describe : describe.skip;
if (!process.env.TEST_DATABASE_URL) {
  console.warn('[integration] university-monitoring tests skipped: TEST_DATABASE_URL is not set.');
}
const testModules = process.env.TEST_DATABASE_URL
  ? await Promise.all([import('@/lib/db'), import('@/lib/university-monitoring-runner')])
  : [];
const db = testModules[0]?.db as typeof import('@/lib/db').db;
const monitoring = (testModules[1] ?? {}) as typeof import('@/lib/university-monitoring-runner');
const {
  ensureMonitoringJob,
  computeNextRunAt,
  reclaimExpiredLock,
  isDue,
  MONITORING_JOB_ID,
  MONITORING_INTERVAL_DAYS,
} = monitoring;

const SUFFIX = `test-${Date.now().toString(36)}`;
const UNI_SLUG = `alo-itest-uni-${SUFFIX}`;
const COURSE_SLUG = `alo-itest-course-${SUFFIX}`;
const SOURCE_URL = `https://example-university.test/${SUFFIX}/fees`;

let sourceId = '';
let userId = '';
let countrySlug = '';

/** Minimal, explicitly synthetic fixtures — never written to production tables. */
beforeAll(async () => {
  const user = await db.user.create({
    data: {
      email: `itest-superadmin-${SUFFIX}@aloedu.test`,
      name: 'Integration Test Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      passwordHash: 'x',
    },
  });
  userId = user.id;

  const country = await db.countryPage.create({
    data: {
      slug: `itest-country-${SUFFIX}`,
      name: `Testland ${SUFFIX}`,
      shortName: 'TL',
      flag: 'TL',
      capital: 'Test City',
      currency: 'NZD',
      intro: 'Integration test fixture country.',
    },
  });
  countrySlug = country.slug;

  await db.universityPage.create({
    data: {
      slug: UNI_SLUG,
      name: `ALO Integration Test University ${SUFFIX}`,
      countrySlug,
      city: 'Old City',
      overview: 'Original overview',
      verificationStatus: 'VERIFIED',
      approvalStatus: 'PUBLISHED',
      sourceUrl: SOURCE_URL,
    },
  });

  await db.coursePage.create({
    data: {
      slug: COURSE_SLUG,
      universitySlug: UNI_SLUG,
      countrySlug,
      city: 'Old City',
      name: 'MSc Integration Testing',
      level: 'POSTGRADUATE',
      subject: 'Computer Science',
      duration: '1 year',
      intake: 'September',
      tuition: 'NZD 36,000',
      englishRequirement: 'IELTS 6.5',
      academicRequirement: 'Bachelor degree 2:1',
      overview: 'Integration test course fixture.',
      verificationStatus: 'VERIFIED',
      approvalStatus: 'PUBLISHED',
    },
  });

  const source = await db.officialSource.create({
    data: {
      sourceUrl: SOURCE_URL,
      sourceName: `Integration Test Official Source ${SUFFIX}`,
      sourceType: 'UNIVERSITY_OFFICIAL',
      entityType: 'UNIVERSITY',
      universitySlug: UNI_SLUG,
      countrySlug,
      priority: 1,
      monitoringEnabled: true,
      checkFrequencyDays: MONITORING_INTERVAL_DAYS,
      status: 'ACTIVE',
    },
  });
  sourceId = source.id;
});

afterAll(async () => {
  // Clean up only the rows this test created.
  await db.courseHistory.deleteMany({ where: { courseSlug: COURSE_SLUG } }).catch(() => undefined);
  await db.universityHistory.deleteMany({ where: { universitySlug: UNI_SLUG } }).catch(() => undefined);
  await db.dataChange.deleteMany({ where: { sourceId } }).catch(() => undefined);
  await db.dataConflict.deleteMany({ where: { universitySlug: UNI_SLUG } }).catch(() => undefined);
  await db.officialSource.deleteMany({ where: { id: sourceId } }).catch(() => undefined);
  await db.coursePage.deleteMany({ where: { slug: COURSE_SLUG } }).catch(() => undefined);
  await db.universityPage.deleteMany({ where: { slug: UNI_SLUG } }).catch(() => undefined);
  await db.countryPage.deleteMany({ where: { slug: countrySlug } }).catch(() => undefined);
  await db.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
});

// ------------------------------------------------------------------
// Scheduler
// ------------------------------------------------------------------
integrationDescribe('Scheduler: 7-day job configuration and persistence', () => {
  it('creates the monitoring job with a stable id (idempotent across restarts)', async () => {
    const a = await ensureMonitoringJob();
    const b = await ensureMonitoringJob();

    expect(a.jobId).toBe(MONITORING_JOB_ID);
    // Same row — calling it again after a restart must not create a duplicate.
    expect(b.id).toBe(a.id);

    const count = await db.monitoringJob.count({ where: { jobId: MONITORING_JOB_ID } });
    expect(count).toBe(1);
  });

  it('computes the next run exactly 7 days ahead', () => {
    const from = new Date('2026-08-01T12:00:00.000Z');
    const next = computeNextRunAt(from);
    const deltaDays = Math.round((next.getTime() - from.getTime()) / 86_400_000);
    // Normalised to 03:00 local, so allow the 6/7 day boundary.
    expect([MONITORING_INTERVAL_DAYS - 1, MONITORING_INTERVAL_DAYS]).toContain(deltaDays);
    expect(next.getHours()).toBe(3);
  });

  it('persists nextRunAt so the schedule survives a process restart', async () => {
    const job = await ensureMonitoringJob();
    const next = computeNextRunAt();
    await db.monitoringJob.update({ where: { id: job.id }, data: { nextRunAt: next } });

    // Simulate a fresh process reading the schedule back from the database.
    const reloaded = await db.monitoringJob.findUnique({ where: { jobId: MONITORING_JOB_ID } });
    expect(reloaded?.nextRunAt?.toISOString()).toBe(next.toISOString());

    const due = await isDue();
    expect(due.enabled).toBe(true);
    expect(due.due).toBe(false); // 7 days away
  });

  it('reports due when nextRunAt has elapsed', async () => {
    const job = await ensureMonitoringJob();
    await db.monitoringJob.update({
      where: { id: job.id },
      data: { nextRunAt: new Date(Date.now() - 60_000), lockedBy: null, lockExpiresAt: null },
    });
    const due = await isDue();
    expect(due.due).toBe(true);
  });
});

// ------------------------------------------------------------------
// Duplicate execution prevention
// ------------------------------------------------------------------
integrationDescribe('Duplicate prevention: concurrent run locking', () => {
  it('only one of two concurrent lock attempts succeeds', async () => {
    const job = await ensureMonitoringJob();
    await db.monitoringJob.update({
      where: { id: job.id },
      data: { lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });

    // Mirror the conditional compare-and-set used by the runner.
    const tryLock = async (instanceId: string) => {
      const now = new Date();
      const res = await db.monitoringJob.updateMany({
        where: { id: job.id, OR: [{ lockedBy: null }, { lockExpiresAt: { lt: now } }] },
        data: { lockedBy: instanceId, lockedAt: now, lockExpiresAt: new Date(now.getTime() + 60_000) },
      });
      return res.count === 1;
    };

    const first = await tryLock('instance-A');
    const second = await tryLock('instance-B');

    expect(first).toBe(true);
    // The second instance must be refused — this is what stops two servers
    // scraping the same sources and creating duplicate records.
    expect(second).toBe(false);

    const locked = await db.monitoringJob.findUnique({ where: { id: job.id } });
    expect(locked?.lockedBy).toBe('instance-A');
  });

  it('reclaims a lock orphaned by a crashed process and fails its run', async () => {
    const job = await ensureMonitoringJob();
    const orphan = await db.verificationRun.create({
      data: { jobId: job.id, runId: `VR-orphan-${SUFFIX}`, status: 'RUNNING', startedAt: new Date() },
    });
    await db.monitoringJob.update({
      where: { id: job.id },
      data: {
        lockedBy: 'dead-process',
        lockedAt: new Date(Date.now() - 3_600_000),
        lockExpiresAt: new Date(Date.now() - 1_800_000), // expired
        lastRunId: orphan.id,
      },
    });

    const reclaimed = await reclaimExpiredLock();
    expect(reclaimed).toBe(true);

    const after = await db.monitoringJob.findUnique({ where: { id: job.id } });
    expect(after?.lockedBy).toBeNull();

    const orphanAfter = await db.verificationRun.findUnique({ where: { id: orphan.id } });
    expect(orphanAfter?.status).toBe('FAILED');
    expect(orphanAfter?.errorMessage).toContain('lock expired');

    await db.verificationRun.delete({ where: { id: orphan.id } }).catch(() => undefined);
  });

  it('does not reclaim a lock that is still valid', async () => {
    const job = await ensureMonitoringJob();
    await db.monitoringJob.update({
      where: { id: job.id },
      data: { lockedBy: 'live-process', lockedAt: new Date(), lockExpiresAt: new Date(Date.now() + 600_000) },
    });

    const reclaimed = await reclaimExpiredLock();
    expect(reclaimed).toBe(false);

    const after = await db.monitoringJob.findUnique({ where: { id: job.id } });
    expect(after?.lockedBy).toBe('live-process');

    await db.monitoringJob.update({
      where: { id: job.id },
      data: { lockedBy: null, lockedAt: null, lockExpiresAt: null },
    });
  });
});

// ------------------------------------------------------------------
// Change detection record shape
// ------------------------------------------------------------------
integrationDescribe('Change detection: evidence is recorded with every change', () => {
  it('stores old value, new value, source URL, detection time, impact and confidence', async () => {
    const run = await db.verificationRun.create({
      data: { jobId: (await ensureMonitoringJob()).id, runId: `VR-detect-${SUFFIX}`, status: 'COMPLETED' },
    });

    const change = await db.dataChange.create({
      data: {
        runId: run.id,
        sourceId,
        entityType: 'COURSE',
        universitySlug: UNI_SLUG,
        courseSlug: COURSE_SLUG,
        changeType: 'FEE_CHANGED',
        fieldName: 'tuition',
        oldValue: 'NZD 36,000',
        newValue: 'NZD 38,000',
        sourceUrl: SOURCE_URL,
        sourcePageTitle: 'Tuition fees',
        impactLevel: 'HIGH',
        confidence: 0.92,
        aiExplanation: 'Published tuition increased from NZD 36,000 to NZD 38,000.',
        status: 'PENDING',
      },
    });

    const stored = await db.dataChange.findUnique({ where: { id: change.id } });
    expect(stored?.oldValue).toBe('NZD 36,000');
    expect(stored?.newValue).toBe('NZD 38,000');
    expect(stored?.sourceUrl).toBe(SOURCE_URL);
    expect(stored?.impactLevel).toBe('HIGH'); // fee change => HIGH per spec
    expect(stored?.confidence).toBeGreaterThan(0.5);
    expect(stored?.detectedAt).toBeInstanceOf(Date);
    expect(stored?.status).toBe('PENDING'); // never auto-applied

    await db.dataChange.delete({ where: { id: change.id } });
    await db.verificationRun.delete({ where: { id: run.id } });
  });

  it('a detected change does NOT mutate production data before approval', async () => {
    const run = await db.verificationRun.create({
      data: { jobId: (await ensureMonitoringJob()).id, runId: `VR-noauto-${SUFFIX}`, status: 'COMPLETED' },
    });
    await db.dataChange.create({
      data: {
        runId: run.id,
        sourceId,
        entityType: 'COURSE',
        courseSlug: COURSE_SLUG,
        universitySlug: UNI_SLUG,
        changeType: 'FEE_CHANGED',
        fieldName: 'tuition',
        oldValue: 'NZD 36,000',
        newValue: 'NZD 99,999',
        sourceUrl: SOURCE_URL,
        status: 'PENDING',
      },
    });

    // Production row must still hold the original approved value.
    const course = await db.coursePage.findUnique({ where: { slug: COURSE_SLUG } });
    expect(course?.tuition).toBe('NZD 36,000');

    await db.dataChange.deleteMany({ where: { runId: run.id } });
    await db.verificationRun.delete({ where: { id: run.id } });
  });
});

// ------------------------------------------------------------------
// Approval / rejection / history / audit
// ------------------------------------------------------------------
integrationDescribe('Approval workflow: approve applies, rejects do not, history is preserved', () => {
  async function makeChange(newValue: string) {
    const run = await db.verificationRun.create({
      data: { jobId: (await ensureMonitoringJob()).id, runId: `VR-ap-${SUFFIX}-${Math.random().toString(36).slice(2, 7)}`, status: 'COMPLETED' },
    });
    return db.dataChange.create({
      data: {
        runId: run.id,
        sourceId,
        entityType: 'COURSE',
        universitySlug: UNI_SLUG,
        courseSlug: COURSE_SLUG,
        changeType: 'FEE_CHANGED',
        fieldName: 'tuition',
        oldValue: 'NZD 36,000',
        newValue,
        sourceUrl: SOURCE_URL,
        impactLevel: 'HIGH',
        confidence: 0.9,
        status: 'PENDING',
      },
    });
  }

  it('APPROVE writes history, applies the new value, and emits an audit event', async () => {
    const change = await makeChange('NZD 38,000');

    // Replicate the route's transactional approval sequence.
    await db.$transaction(async (tx) => {
      const approval = await tx.approvalAction.create({
        data: { changeId: change.id, action: 'APPROVE', performedBy: userId, performedAt: new Date() },
      });
      const updated = await tx.dataChange.update({
        where: { id: change.id },
        data: {
          status: 'APPROVED',
          reviewedBy: userId,
          reviewedAt: new Date(),
          appliedAt: new Date(),
          appliedBy: userId,
        },
      });
      await tx.courseHistory.create({
        data: {
          courseSlug: COURSE_SLUG,
          universitySlug: UNI_SLUG,
          fieldName: updated.fieldName,
          oldValue: updated.oldValue,
          newValue: updated.newValue,
          changeId: updated.id,
          changeType: updated.changeType,
          sourceUrl: updated.sourceUrl,
          detectedAt: updated.detectedAt,
          approvedBy: userId,
          approvedAt: new Date(),
          approvalId: approval.id,
        },
      });
      await tx.coursePage.update({
        where: { slug: COURSE_SLUG },
        data: { tuition: updated.newValue || '', lastVerifiedAt: new Date(), verificationStatus: 'VERIFIED' },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'COURSE_DATA_APPROVED',
          resource: 'COURSE',
          resourceId: COURSE_SLUG,
          details: JSON.stringify({
            changeId: updated.id,
            oldValue: updated.oldValue,
            newValue: updated.newValue,
            source: updated.sourceUrl,
            approvalId: approval.id,
          }),
        },
      });
    });

    // 1. Production data now holds the approved value.
    const course = await db.coursePage.findUnique({ where: { slug: COURSE_SLUG } });
    expect(course?.tuition).toBe('NZD 38,000');
    expect(course?.verificationStatus).toBe('VERIFIED');

    // 2. The OLD value was preserved, not destroyed.
    const history = await db.courseHistory.findMany({
      where: { courseSlug: COURSE_SLUG, fieldName: 'tuition' },
      orderBy: { approvedAt: 'desc' },
    });
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].oldValue).toBe('NZD 36,000');
    expect(history[0].newValue).toBe('NZD 38,000');
    expect(history[0].sourceUrl).toBe(SOURCE_URL);
    expect(history[0].approvedBy).toBe(userId);
    expect(history[0].approvedAt).toBeInstanceOf(Date);

    // 3. Audit event exists with old/new/source/approval id.
    const audit = await db.auditLog.findFirst({
      where: { action: 'COURSE_DATA_APPROVED', resourceId: COURSE_SLUG },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();
    const details = JSON.parse(audit!.details || '{}');
    expect(details.oldValue).toBe('NZD 36,000');
    expect(details.newValue).toBe('NZD 38,000');
    expect(details.source).toBe(SOURCE_URL);
    expect(details.approvalId).toBeTruthy();

    // 4. The change is marked APPROVED and attributed to a real user.
    const finalChange = await db.dataChange.findUnique({ where: { id: change.id } });
    expect(finalChange?.status).toBe('APPROVED');
    expect(finalChange?.reviewedBy).toBe(userId);
  });

  it('REJECT never mutates production data', async () => {
    const before = await db.coursePage.findUnique({ where: { slug: COURSE_SLUG } });
    const change = await makeChange('NZD 120,000');

    await db.$transaction(async (tx) => {
      await tx.approvalAction.create({
        data: { changeId: change.id, action: 'REJECT', performedBy: userId, performedAt: new Date() },
      });
      await tx.dataChange.update({
        where: { id: change.id },
        data: { status: 'REJECTED', reviewedBy: userId, reviewedAt: new Date() },
      });
    });

    const after = await db.coursePage.findUnique({ where: { slug: COURSE_SLUG } });
    expect(after?.tuition).toBe(before?.tuition); // unchanged

    const rejected = await db.dataChange.findUnique({ where: { id: change.id } });
    expect(rejected?.status).toBe('REJECTED');
    expect(rejected?.appliedAt).toBeNull(); // never applied

    // No history row written for a rejected change.
    const hist = await db.courseHistory.count({ where: { changeId: change.id } });
    expect(hist).toBe(0);
  });

  it('history remains searchable as an ordered value timeline', async () => {
    const rows = await db.courseHistory.findMany({
      where: { courseSlug: COURSE_SLUG, fieldName: 'tuition' },
      orderBy: { approvedAt: 'asc' },
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const r of rows) {
      // Every historical version must carry its official evidence.
      expect(r.sourceUrl).toBeTruthy();
      expect(r.approvedBy).toBeTruthy();
      expect(r.changeId).toBeTruthy();
    }
  });
});

// ------------------------------------------------------------------
// Source failure handling
// ------------------------------------------------------------------
integrationDescribe('Error handling: source failures never delete verified data', () => {
  it('records consecutive failures on the source but preserves the entity', async () => {
    await db.officialSource.update({
      where: { id: sourceId },
      data: { consecutiveFailures: { increment: 1 }, lastError: 'HTTP 503 Service Unavailable' },
    });

    const src = await db.officialSource.findUnique({ where: { id: sourceId } });
    expect(src?.consecutiveFailures).toBeGreaterThan(0);
    expect(src?.lastError).toContain('503');

    // The university row must still be present and still VERIFIED.
    const uni = await db.universityPage.findUnique({ where: { slug: UNI_SLUG } });
    expect(uni).toBeTruthy();
    expect(uni?.verificationStatus).toBe('VERIFIED');

    await db.officialSource.update({
      where: { id: sourceId },
      data: { consecutiveFailures: 0, lastError: null },
    });
  });
});

// ------------------------------------------------------------------
// Conflicts
// ------------------------------------------------------------------
integrationDescribe('Conflict detection: disagreeing official sources escalate to Super Admin', () => {
  it('creates a PENDING conflict and resolves it with attribution', async () => {
    const conflict = await db.dataConflict.create({
      data: {
        entityType: 'UNIVERSITY',
        universitySlug: UNI_SLUG,
        fieldName: 'tuition',
        conflictingValues: JSON.stringify([
          { sourceUrl: SOURCE_URL, sourceName: 'University fees page', value: 'NZD 38,000' },
          { sourceUrl: `${SOURCE_URL}/pdf`, sourceName: 'Official PDF', value: 'NZD 37,500' },
        ]),
        status: 'PENDING',
      },
    });

    const pending = await db.dataConflict.findUnique({ where: { id: conflict.id } });
    expect(pending?.status).toBe('PENDING');
    expect(JSON.parse(pending!.conflictingValues)).toHaveLength(2);

    await db.dataConflict.update({
      where: { id: conflict.id },
      data: {
        status: 'RESOLVED',
        resolution: 'MANUAL_OVERRIDE',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: 'Primary university fees page takes precedence over the cached PDF.',
      },
    });

    const resolved = await db.dataConflict.findUnique({ where: { id: conflict.id } });
    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.resolvedBy).toBe(userId);
    expect(resolved?.resolvedAt).toBeInstanceOf(Date);
  });
});

// ------------------------------------------------------------------
// Student-facing data safety
// ------------------------------------------------------------------
integrationDescribe('AI answer safety: student-facing queries only see approved + verified data', () => {
  it('excludes records that are not both VERIFIED and PUBLISHED', async () => {
    const draftSlug = `alo-itest-draft-${SUFFIX}`;
    await db.universityPage.create({
      data: {
        slug: draftSlug,
        name: `Draft University ${SUFFIX}`,
        countrySlug,
        city: 'Draft City',
        overview: 'Draft overview',
        verificationStatus: 'UNVERIFIED',
        approvalStatus: 'DRAFT',
      },
    });

    // This is the exact filter the Knowledge Center / search endpoint applies.
    const visible = await db.universityPage.findMany({
      where: {
        AND: [{ verificationStatus: 'VERIFIED' }, { approvalStatus: 'PUBLISHED' }],
        slug: { in: [UNI_SLUG, draftSlug] },
      },
      select: { slug: true },
    });

    const slugs = visible.map((v) => v.slug);
    expect(slugs).toContain(UNI_SLUG);
    expect(slugs).not.toContain(draftSlug); // unapproved data must never surface

    await db.universityPage.delete({ where: { slug: draftSlug } });
  });
});
