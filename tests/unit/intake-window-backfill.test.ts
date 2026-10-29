import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INTAKE_WINDOW_MONTHS } from '@/lib/course-finder/intake-window';
import {
  backfillIntakeWindow,
  summarizeIntakeWindowCoverage,
  type IntakeWindowRecord,
} from '@/lib/course-finder/intake-window-backfill';

const routeMocks = vi.hoisted(() => ({
  auth: { userId: 'admin-1', actorUserId: 'admin-1', userType: 'ADMIN', roles: ['ADMIN'] },
  courseFindMany: vi.fn(),
  intakeFindMany: vi.fn(),
  intakeCreate: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: typeof routeMocks.auth) => Promise<Response>) =>
    (request: Request) => handler(request, routeMocks.auth),
}));
vi.mock('@/lib/db', () => ({
  db: {
    crmCourse: { findMany: routeMocks.courseFindMany },
    crmCourseIntakeFee: { findMany: routeMocks.intakeFindMany, create: routeMocks.intakeCreate },
  },
}));

import { GET, POST } from '@/app/api/admin/courses/intakes/backfill/route';

const sourceRow = (courseId: string, year: number, month: string, extra: Partial<IntakeWindowRecord> = {}): IntakeWindowRecord => ({
  courseId,
  intakeYear: year,
  intakeMonth: month,
  verificationStatus: 'VERIFIED',
  status: 'active',
  intakeSourceUrl: 'https://university.example.edu/admissions/intakes',
  ...extra,
});

describe('intake window coverage policy', () => {
  it('counts distinct, source-backed course-months; scheduled placeholders never count as availability', () => {
    const complete = INTAKE_WINDOW_MONTHS.map((period) => sourceRow('C1', period.year, period.monthName));
    complete.push(sourceRow('C1', 2027, '2027-01')); // duplicate Jan alias
    const partial = [
      sourceRow('C2', 2027, 'September'),
      sourceRow('C2', 2027, 'Jan', { verificationStatus: 'SCHEDULED', intakeSourceUrl: '' }),
      sourceRow('C2', 2027, 'February', { intakeSourceUrl: 'http://university.example.edu/fees' }),
      sourceRow('C2', 2028, 'February'), // outside the inclusive window
      sourceRow('C2', 2027, 'January 2028'), // explicit month year conflicts with intakeYear
    ];

    expect(summarizeIntakeWindowCoverage(
      [{ courseId: 'C1' }, { courseId: 'C2' }, { courseId: 'C3' }],
      [...complete, ...partial],
    )).toEqual({
      requiredMonths: 13,
      coursesWithFullWindow: 1,
      coursesWithPartialWindow: 1,
      coursesWithNoVerifiedWindow: 1,
      verifiedPeriods: 14,
      scheduledPeriods: 1,
      needsReviewPeriods: 1,
      missingPeriods: 23,
      duplicatePeriodRows: 1,
    });
  });

  it('rejects invalid report limits before querying', async () => {
    const courseFindMany = vi.fn();
    const intakeFindMany = vi.fn();
    const prisma = { crmCourse: { findMany: courseFindMany }, crmCourseIntakeFee: { findMany: intakeFindMany } } as never;
    await expect(backfillIntakeWindow(prisma, { limit: -1 })).rejects.toThrow(/limit must be an integer/);
    await expect(backfillIntakeWindow(prisma, { limit: 10_001 })).rejects.toThrow(/limit must be an integer/);
    await expect(backfillIntakeWindow(prisma, { courseId: '   ' })).rejects.toThrow(/courseId must not be blank/);
    expect(courseFindMany).not.toHaveBeenCalled();
    expect(intakeFindMany).not.toHaveBeenCalled();
  });

  it('historical backfill entry point is report-only in normal and dry-run mode', async () => {
    const courses = [{ courseId: 'C1', universityId: 'U1', courseTitle: 'MSc Example' }];
    const intakeRows = [sourceRow('C1', 2027, 'January')];
    const courseFindMany = vi.fn().mockResolvedValue(courses);
    const intakeFindMany = vi.fn().mockResolvedValue(intakeRows);
    const create = vi.fn();
    const prisma = {
      crmCourse: { findMany: courseFindMany },
      crmCourseIntakeFee: { findMany: intakeFindMany, create },
    } as never;

    const normal = await backfillIntakeWindow(prisma, { dryRun: false });
    const dry = await backfillIntakeWindow(prisma, { dryRun: true });
    expect(normal).toMatchObject({
      reportOnly: true,
      created: 0,
      verifiedPeriods: 1,
      missingPeriods: 12,
      coursesWithPartialWindow: 1,
    });
    expect(dry).toMatchObject({ reportOnly: true, created: 0, verifiedPeriods: 1 });
    expect(courseFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'active' } }));
    expect(intakeFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ courseId: { in: ['C1'] }, status: 'active' }),
    }));
    expect(create).not.toHaveBeenCalled();
  });
});

describe('admin intake coverage route authorization and safety', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    routeMocks.auth.userType = 'ADMIN';
    routeMocks.auth.roles = ['ADMIN'];
    routeMocks.courseFindMany.mockResolvedValue([{ courseId: 'C1', universityId: 'U1' }]);
    routeMocks.intakeFindMany.mockResolvedValue([sourceRow('C1', 2027, 'January')]);
  });

  it('requires an authorized catalogue reviewer before querying', async () => {
    routeMocks.auth.userType = 'STUDENT';
    routeMocks.auth.roles = ['STUDENT'];
    expect((await GET(new Request('https://alo.test/api/admin/courses/intakes/backfill'))).status).toBe(403);
    expect((await POST(new Request('https://alo.test/api/admin/courses/intakes/backfill', { method: 'POST', body: '{}' }))).status).toBe(403);
    expect(routeMocks.courseFindMany).not.toHaveBeenCalled();
    expect(routeMocks.intakeFindMany).not.toHaveBeenCalled();
  });

  it('POST stays read-only even when dryRun is false, and rejects invalid limits before DB access', async () => {
    const invalid = await POST(new Request('https://alo.test/api/admin/courses/intakes/backfill', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ limit: -1 }),
    }));
    expect(invalid.status).toBe(400);
    const invalidCourseId = await POST(new Request('https://alo.test/api/admin/courses/intakes/backfill', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ courseId: '   ' }),
    }));
    expect(invalidCourseId.status).toBe(400);
    expect(routeMocks.courseFindMany).not.toHaveBeenCalled();

    const response = await POST(new Request('https://alo.test/api/admin/courses/intakes/backfill', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dryRun: false }),
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, reportOnly: true, report: { created: 0, missingPeriods: 12 } });
    expect(body.message).toContain('No rows were created or changed');
    expect(routeMocks.intakeCreate).not.toHaveBeenCalled();
  });

  it('GET reports verified unique intake coverage and fails closed when the database is unavailable', async () => {
    const response = await GET(new Request('https://alo.test/api/admin/courses/intakes/backfill'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.coverage).toMatchObject({
      activeCourses: 1,
      coursesWithPartialWindow: 1,
      coursesWithNoWindow: 0,
      verifiedPeriods: 1,
      missingPeriods: 12,
    });

    routeMocks.courseFindMany.mockRejectedValueOnce(new Error('db unavailable'));
    expect((await GET(new Request('https://alo.test/api/admin/courses/intakes/backfill'))).status).toBe(503);
  });
});
