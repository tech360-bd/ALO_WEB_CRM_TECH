import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  uniGroupBy: vi.fn(), uniCount: vi.fn(), uniFindMany: vi.fn(),
  crsGroupBy: vi.fn(), crsCount: vi.fn(), crsFindMany: vi.fn(), crsFindFirst: vi.fn(),
  intGroupBy: vi.fn(), intCount: vi.fn(), intFindMany: vi.fn(),
  reqGroupBy: vi.fn(), reqCount: vi.fn(),
  uurGroupBy: vi.fn(), wurGroupBy: vi.fn(), conflicts: vi.fn(),
  cmpFind: vi.fn(), legacyFind: vi.fn(), studentAccess: vi.fn(), resultCreate: vi.fn(),
  write: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/rate-limiter', () => ({ rateLimitMiddleware: () => null }));
vi.mock('@/lib/student-resource-auth', () => ({ requireStudentResource: m.studentAccess }));
vi.mock('@/lib/db', () => ({
  db: {
    crmUniversity: { groupBy: m.uniGroupBy, count: m.uniCount, findMany: m.uniFindMany, update: m.write, updateMany: m.write },
    crmCourse: { groupBy: m.crsGroupBy, count: m.crsCount, findMany: m.crsFindMany, findFirst: m.crsFindFirst, update: m.write, updateMany: m.write },
    crmCourseIntakeFee: { groupBy: m.intGroupBy, count: m.intCount, findMany: m.intFindMany },
    crmCourseRequirement: { groupBy: m.reqGroupBy, count: m.reqCount },
    universityUpdateRequest: { groupBy: m.uurGroupBy },
    weeklyUpdateRequest: { groupBy: m.wurGroupBy },
    dataConflict: { findMany: m.conflicts },
    courseComparisonList: { findFirst: m.cmpFind },
    courseComparison: { findFirst: m.legacyFind },
    finderEligibilityResult: { create: m.resultCreate },
  },
}));

import { NextResponse } from 'next/server';
import { GET as review } from '@/app/api/admin/catalog-review/route';
import { GET as publicCompare } from '@/app/api/course-finder/public-compare/route';
import { GET as studentCompare } from '@/app/api/course-finder/compare/route';
import { POST as eligibility } from '@/app/api/course-finder/eligibility-engine/route';
import { POST as legacyMerge } from '@/app/api/admin/university-data/duplicates/merge/route';
import { GET as legacyDuplicates } from '@/app/api/admin/university-data/duplicates/route';
import { publicCourseIdentifierWhere, publicCourseWhere, publicIntakeWhere, publicRequirementWhere, publicUniversityWhere } from '@/lib/public-catalog';
import { courseDuplicateGroups, countMap, intakeDuplicateGroups, universityDuplicateGroups } from '@/lib/course-finder/catalog-review-analysis';

const admin = { userId: 'a1', actorUserId: 'a1', userType: 'ADMIN', identityDomain: 'portal', authenticationMethod: 'cookie', roles: [] };
const get = (url: string) => new Request(`https://alo.test${url}`);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
  for (const g of [m.uniGroupBy, m.crsGroupBy, m.intGroupBy, m.reqGroupBy, m.uurGroupBy, m.wurGroupBy]) g.mockResolvedValue([]);
  for (const c of [m.uniCount, m.crsCount, m.intCount, m.reqCount]) c.mockResolvedValue(0);
  m.uniFindMany.mockResolvedValue([]); m.crsFindMany.mockResolvedValue([]); m.intFindMany.mockResolvedValue([]); m.conflicts.mockResolvedValue([]);
});

describe('admin catalogue review API', () => {
  it('rejects unauthenticated and non-admin callers before any query', async () => {
    m.auth.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    expect((await review(get('/api/admin/catalog-review'))).status).toBe(401);
    for (const who of [{ ...admin, userType: 'STUDENT', roles: ['ADMIN'] }, { ...admin, userType: 'COUNSELOR' }, { ...admin, identityDomain: undefined }]) {
      m.auth.mockResolvedValueOnce(who);
      expect((await review(get('/api/admin/catalog-review'))).status).toBe(403);
    }
    expect(m.uniGroupBy).not.toHaveBeenCalled();
    expect(m.uniFindMany).not.toHaveBeenCalled();
  });

  it('summary counts public records with the canonical public filter (not a separate rule)', async () => {
    m.auth.mockResolvedValue(admin);
    m.uniGroupBy.mockResolvedValue([{ verificationStatus: 'VERIFIED', _count: { _all: 2 } }, { verificationStatus: 'NEEDS_REVIEW', _count: { _all: 5 } }]);
    m.uniCount.mockResolvedValue(1);
    const res = await review(get('/api/admin/catalog-review?view=summary'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(m.uniCount).toHaveBeenCalledWith({ where: publicUniversityWhere() });
    expect(m.crsCount).toHaveBeenCalledWith({ where: publicCourseWhere() });
    expect(m.intCount).toHaveBeenCalledWith({ where: { ...publicIntakeWhere(), course: { is: publicCourseWhere() } } });
    expect(m.reqCount).toHaveBeenCalledWith({ where: { ...publicRequirementWhere(), course: { is: publicCourseWhere() } } });
    expect(body.entities.university).toMatchObject({ publiclyVisible: 1, verification: { VERIFIED: 2, NEEDS_REVIEW: 5 } });
  });

  it('reports database failure honestly instead of showing figures', async () => {
    m.auth.mockResolvedValue(admin);
    m.uniGroupBy.mockRejectedValue(new Error('connect ECONNREFUSED secret-host'));
    const res = await review(get('/api/admin/catalog-review?view=summary'));
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain('secret-host');
  });

  it('duplicates view reports groups and states that merge is unavailable', async () => {
    m.auth.mockResolvedValue(admin);
    m.uniFindMany.mockResolvedValue([
      { universityId: 'U1', name: 'University of Leeds', country: 'United Kingdom', website: 'https://www.leeds.ac.uk' },
      { universityId: 'U2', name: 'The University of Leeds', country: 'United Kingdom', website: 'https://leeds.ac.uk/' },
      { universityId: 'U3', name: 'University of York', country: 'United Kingdom', website: 'https://www.york.ac.uk' },
    ]);
    m.intFindMany.mockResolvedValue([
      { id: 'i1', courseId: 'C1', intakeYear: 2027, intakeMonth: 'September' },
      { id: 'i2', courseId: 'C1', intakeYear: 2027, intakeMonth: 'Sep' },
    ]);
    const body = await (await review(get('/api/admin/catalog-review?view=duplicates'))).json();
    expect(body.universities).toHaveLength(1);
    expect(body.universities[0].records.map((r: { universityId: string }) => r.universityId)).toEqual(['U1', 'U2']);
    expect(body.intakes).toHaveLength(1);
    expect(body.mergeAvailable).toBe(false);
  });

  it('analysis helpers only group, never invent', () => {
    expect(universityDuplicateGroups([])).toEqual([]);
    expect(courseDuplicateGroups([
      { courseId: 'A', universityId: 'U1', courseTitle: 'MSc Data Science', studyLevel: 'Postgraduate' },
      { courseId: 'B', universityId: 'U1', courseTitle: 'MSc  Data-Science', studyLevel: 'postgraduate' },
      { courseId: 'C', universityId: 'U2', courseTitle: 'MSc Data Science', studyLevel: 'Postgraduate' },
    ]).map((g) => g.records.map((r) => r.courseId))).toEqual([['A', 'B']]);
    expect(intakeDuplicateGroups([{ id: '1', courseId: 'C', intakeYear: 2027, intakeMonth: 'January' }, { id: '2', courseId: 'C', intakeYear: 2028, intakeMonth: 'January' }])).toEqual([]);
    expect(countMap([{ status: '', _count: { _all: 3 } }], 'status')).toEqual({ '(blank)': 3 });
  });
});

describe('legacy duplicate endpoints fail closed', () => {
  it('merge requires a Super Admin and same origin, and never writes', async () => {
    m.auth.mockResolvedValue({ ...admin, userType: 'STUDENT' });
    const post = (origin = 'https://alo.test') => new Request('https://alo.test/api/admin/university-data/duplicates/merge', { method: 'POST', headers: { origin }, body: JSON.stringify({ masterId: 'U1', duplicateId: 'U2', type: 'university' }) });
    expect((await legacyMerge(post())).status).toBe(403);
    m.auth.mockResolvedValue(admin);
    expect((await legacyMerge(post())).status).toBe(403);
    m.auth.mockResolvedValue({ ...admin, userType: 'SUPER_ADMIN' });
    const res = await legacyMerge(post());
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'MERGE_WORKFLOW_REQUIRED' });
    expect(m.write).not.toHaveBeenCalled();
  });

  it('the old always-empty duplicate list no longer claims "no duplicates"', async () => {
    const res = await legacyDuplicates();
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({ success: false, code: 'MOVED_TO_CATALOG_REVIEW' });
  });
});

describe('public compare', () => {
  it('validates 1–4 identifiers', async () => {
    expect((await publicCompare(get('/api/course-finder/public-compare'))).status).toBe(400);
    expect((await publicCompare(get('/api/course-finder/public-compare?ids=a,b,c,d,e'))).status).toBe(400);
    expect(m.crsFindFirst).not.toHaveBeenCalled();
  });

  it('uses only the canonical public filters and lists non-public identifiers as unavailable', async () => {
    m.crsFindFirst.mockImplementation(async ({ where }: { where: unknown }) => (
      JSON.stringify(where) === JSON.stringify(publicCourseIdentifierWhere('msc-ds'))
        ? {
            courseId: 'CRS-1', slug: 'msc-ds', courseTitle: 'MSc Data Science', durationMonths: 12, internalNotes: 'secret', createdBy: 'staff',
            university: { universityId: 'U1', slug: 'uni-one', name: 'University One', country: 'United Kingdom' },
            intakeFees: [{ intakeYear: 2027, intakeMonth: 'September', yearlyTuition: 21000, tuitionCurrency: 'GBP', feeSourceUrl: 'https://uni-one.ac.uk/fees' }],
            requirements: [{ ieltsOverall: 6.5, moiAccepted: false, officialRequirementUrl: 'https://uni-one.ac.uk/entry' }],
            _count: { scholarshipRecords: 0 },
          }
        : null
    ));
    const res = await publicCompare(get('/api/course-finder/public-compare?ids=msc-ds,unverified-course'));
    const body = await res.json();
    expect(res.status).toBe(200);
    const call = m.crsFindFirst.mock.calls[0][0];
    expect(call.where).toEqual(publicCourseIdentifierWhere('msc-ds'));
    expect(call.include.intakeFees.where).toEqual(publicIntakeWhere());
    expect(call.include.requirements.where).toEqual(publicRequirementWhere());
    expect(body.unavailable).toEqual(['unverified-course']);
    expect(body.courses).toHaveLength(1);
    expect(body.courses[0]).toMatchObject({ courseTitle: 'MSc Data Science', universityName: 'University One', durationMonths: 12, requirement: { ieltsOverall: 6.5, moiAccepted: false } });
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/secret|ranking|createdBy/i);
  });
});

describe('student saved comparison', () => {
  it('only returns courses that are currently public', async () => {
    m.studentAccess.mockResolvedValue({ studentId: 'S1' });
    m.cmpFind.mockResolvedValue({ courseIds: JSON.stringify(['CRS-1', 'CRS-DRAFT']) });
    await studentCompare(Object.assign(get('/api/course-finder/compare'), { nextUrl: new URL('https://alo.test/api/course-finder/compare') }) as never);
    const arg = m.crsFindMany.mock.calls[0][0];
    expect(arg.where).toEqual({ AND: [publicCourseWhere(), { courseId: { in: ['CRS-1', 'CRS-DRAFT'] } }] });
    expect(arg.include.intakeFees.where).toEqual(publicIntakeWhere());
    expect(arg.include.requirements.where).toEqual(publicRequirementWhere());
  });
});

describe('eligibility engine for compared courses', () => {
  const post = (body: unknown) => new Request('https://alo.test/api/course-finder/eligibility-engine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  it('restricts evaluation to the compared public courses (same engine, same public filter)', async () => {
    m.auth.mockResolvedValue(NextResponse.json({}, { status: 401 }));
    await eligibility(post({ courseIds: ['msc-ds', 'CRS-2', 'msc-ds'], academicProfile: [], englishTests: [], studyPreferences: { preferredSubject: 'ignored' } }));
    const where = m.crsFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ AND: [publicCourseWhere(), { OR: [{ courseId: { in: ['msc-ds', 'CRS-2'] } }, { slug: { in: ['msc-ds', 'CRS-2'] } }] }] });
  });

  it('rejects an empty or invalid courseIds list', async () => {
    const res = await eligibility(post({ courseIds: [1, ''] }));
    expect(res.status).toBe(400);
    expect(m.crsFindMany).not.toHaveBeenCalled();
  });
});
