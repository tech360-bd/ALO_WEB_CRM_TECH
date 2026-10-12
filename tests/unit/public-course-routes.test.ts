import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  courseCount: vi.fn(),
  courseFindMany: vi.fn(),
  courseFindFirst: vi.fn(),
  universityFindFirst: vi.fn(),
  universityFindMany: vi.fn(),
  getOptionalAuth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    crmCourse: {
      count: mocks.courseCount,
      findMany: mocks.courseFindMany,
      findFirst: mocks.courseFindFirst,
    },
    crmUniversity: {
      findFirst: mocks.universityFindFirst,
      findMany: mocks.universityFindMany,
    },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({ getOptionalAuth: mocks.getOptionalAuth }));

import { GET as courseFinderGET } from '@/app/api/course-finder/route';
import { GET as courseDetailGET } from '@/app/api/courses/[slug]/route';
import { GET as courseFinderDetailGET } from '@/app/api/course-finder/[slug]/route';
import { GET as coursesListGET } from '@/app/api/courses/route';
import { publicCourseWhere } from '@/lib/public-catalog';

const SECRET = 'aloeduca_secret_user at mysql.internal.host';

function courseRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    courseId: 'CRS-001',
    slug: 'msc-data-science-leeds',
    courseTitle: 'MSc Data Science',
    universityId: 'UNI-001',
    status: 'active',
    verificationStatus: 'VERIFIED',
    publicationStatus: 'published',
    sourceUrl: 'https://example.edu/course',
    officialUrl: 'https://example.edu/course',
    studyLevel: 'Master',
    subjectArea: 'Data Science',
    disciplineArea: 'Computing',
    country: 'United Kingdom',
    city: 'Leeds',
    campus: 'Main',
    durationMonths: 12,
    description: 'Course description',
    qualification: 'MSc',
    deliveryMode: 'On campus',
    attendanceMode: '',
    currency: 'GBP',
    tuitionFee: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    university: {
      id: 'uni-row',
      universityId: 'UNI-001',
      name: 'Example University',
      slug: 'example-university',
      country: 'United Kingdom',
      city: 'Leeds',
      campusName: 'Main',
      ranking: 0,
      worldRanking: 120,
      type: 'Public',
      founded: 1900,
      students: '',
      intlStudents: '',
      ieltsMin: 6.5,
      tuitionRange: '',
      scholarships: true,
      website: 'https://example.edu',
      officialUrl: 'https://example.edu',
      sourceUrl: 'https://example.edu',
      lastVerifiedAt: '2026-09-01',
      status: 'active',
      publicationStatus: 'published',
      verificationStatus: 'VERIFIED',
      slug: 'example-university',
      description: 'Overview',
      campuses: '[]',
      admissionNotes: 'staff-only note',
      partnerDescription: 'partner-only text',
    },
    intakeFees: [{
      intakeYear: 2027,
      intakeMonth: 'January',
      intakeName: '',
      applicationDeadline: '2027-01-15',
      appFeeAmount: 0,
      appFeeCurrency: '',
      yearlyTuition: 21000,
      tuitionCurrency: 'GBP',
      tuitionPeriod: 'year',
      depositAmount: 0,
      depositCurrency: '',
      feeSourceUrl: '',
      intakeSourceUrl: 'https://example.edu/intakes',
      status: 'active',
      verificationStatus: 'VERIFIED',
      totalTuition: 0,
    }],
    requirements: [],
    scholarshipRecords: [],
    commissions: [{ partnerCommission: 900, internalExpected: 1200, internalNotes: 'internal', intakeYear: 2027 }],
    _count: { scholarshipRecords: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  mocks.getOptionalAuth.mockResolvedValue(null);
  mocks.courseCount.mockResolvedValue(1);
  mocks.courseFindMany.mockResolvedValue([courseRecord()]);
  mocks.courseFindFirst.mockResolvedValue(courseRecord());
  mocks.universityFindFirst.mockResolvedValue(null);
  mocks.universityFindMany.mockResolvedValue([]);
});

describe('GET /api/course-finder (public Course Finder)', () => {
  it('rejects malformed parameters with 400 and never queries the database', async () => {
    const res = await courseFinderGET(new Request('https://alo.test/api/course-finder?page=abc'));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false, error: expect.stringContaining('"page"') });
    expect(mocks.courseCount).not.toHaveBeenCalled();
    expect(mocks.courseFindMany).not.toHaveBeenCalled();
  });

  it('returns real, paginated, verified course rows with a stable slug and university link', async () => {
    mocks.courseCount.mockResolvedValue(49);
    const res = await courseFinderGET(new Request('https://alo.test/api/course-finder?country=United%20Kingdom&intake=January&page=2&limit=24'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, total: 49, page: 2, pages: 3, totalPages: 3, limit: 24 });
    expect(body.courses[0]).toMatchObject({
      courseTitle: 'MSc Data Science',
      slug: 'msc-data-science-leeds',
      universitySlug: 'example-university',
      yearlyTuition: 21000,
      tuitionCurrency: 'GBP',
      intakeMonth: 'January',
      intakeYear: 2027,
    });
    expect(mocks.courseFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 24 }));
  });

  it('applies the public visibility rule in the database query (not only in the UI)', async () => {
    await courseFinderGET(new Request('https://alo.test/api/course-finder'));
    const call = mocks.courseFindMany.mock.calls[0][0];
    expect(call.where.AND[0]).toEqual(publicCourseWhere());
    expect(mocks.courseCount).toHaveBeenCalledWith({ where: expect.objectContaining({ AND: expect.any(Array) }) });
  });

  it('sends filters to the database instead of ignoring them', async () => {
    await courseFinderGET(new Request('https://alo.test/api/course-finder?city=Leeds&scholarship=yes&tuitionMax=30000'));
    const json = JSON.stringify(mocks.courseCount.mock.calls[0][0].where);
    expect(json).toContain('"city"');
    expect(json).toContain('"scholarshipRecords"');
    expect(json).toContain('"yearlyTuition"');
  });

  it('returns a generic 500 on database failure, never an empty list and never driver details', async () => {
    mocks.courseCount.mockRejectedValue(new Error(SECRET));
    const res = await courseFinderGET(new Request('https://alo.test/api/course-finder?search=data'));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('temporarily unavailable');
    expect(text).not.toContain('aloeduca');
    expect(text).not.toContain('mysql.internal');
  });

  it('never returns commission, notes, or partner fields', async () => {
    const res = await courseFinderGET(new Request('https://alo.test/api/course-finder'));
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('commission');
    expect(text).not.toContain('internal');
    expect(text).not.toContain('staff-only');
    expect(text).not.toContain('partner-only');
  });
});

describe('GET /api/courses/[slug] (course detail)', () => {
  const call = (slug: string, headers: Record<string, string> = {}) =>
    courseDetailGET(new Request(`https://alo.test/api/courses/${slug}`, { headers }) as any, {
      params: Promise.resolve({ slug }),
    });

  it('looks up by exact identifier and enforces public visibility for anonymous visitors', async () => {
    const res = await call('msc-data-science-leeds');
    expect(res.status).toBe(200);
    const where = mocks.courseFindFirst.mock.calls[0][0].where;
    expect(JSON.stringify(where)).not.toContain('courseTitle');
    expect(where.AND[0]).toEqual(publicCourseWhere());
  });

  it('returns 404 for a public visitor when the record is not published and verified', async () => {
    mocks.courseFindFirst.mockResolvedValue(null);
    expect((await call('draft-course')).status).toBe(404);
  });

  it('withholds commission data from partners and from anonymous visitors', async () => {
    mocks.getOptionalAuth.mockResolvedValue({ roles: ['PARTNER'] });
    const res = await call('msc-data-science-leeds', { authorization: 'Bearer x' });
    const body = await res.json();
    expect(body.data).not.toHaveProperty('commissions');
    expect(JSON.stringify(body)).not.toContain('partnerCommission');
    const include = mocks.courseFindFirst.mock.calls[0][0].include;
    expect(include).not.toHaveProperty('commissions');
  });

  it('never returns commission rows on the public detail endpoint, even for staff', async () => {
    mocks.getOptionalAuth.mockResolvedValue({ roles: ['SUPER_ADMIN'] });
    const res = await call('msc-data-science-leeds', { authorization: 'Bearer x' });
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('commissions');
    expect(text).not.toContain('partnerCommission');
    expect(text).not.toContain('internalExpected');
  });

  it('does not expose a partner-only university description publicly', async () => {
    const res = await call('msc-data-science-leeds');
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('partner-only text');
    expect(text).not.toContain('staff-only note');
  });
});

describe('GET /api/courses (public list)', () => {
  it('ignores ?status=all for anonymous visitors and keeps the verified-only rule', async () => {
    const { NextRequest } = await import('next/server');
    mocks.getOptionalAuth.mockResolvedValue(null);
    const res = await coursesListGET(new NextRequest('https://alo.test/api/courses?status=all'));
    expect(res.status).toBe(200);
    const where = mocks.courseFindMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('status', 'all');
    expect(where).toEqual(publicCourseWhere());
    expect(JSON.stringify(where)).toContain('"verificationStatus":"VERIFIED"');
  });
});

describe('GET /api/course-finder/[slug] (legacy detail endpoint)', () => {
  it('returns 404 for an unknown identifier with no fuzzy fallback', async () => {
    mocks.universityFindFirst.mockResolvedValue(null);
    mocks.courseFindFirst.mockResolvedValue(null);
    const res = await courseFinderDetailGET(new Request('https://alo.test/api/course-finder/mba') as any, {
      params: Promise.resolve({ slug: 'mba' }),
    });
    expect(res.status).toBe(404);
    expect(JSON.stringify(mocks.universityFindFirst.mock.calls[0][0].where)).not.toContain('"name"');
    expect(JSON.stringify(mocks.courseFindFirst.mock.calls[0][0].where)).not.toContain('courseTitle');
  });

  it('strips internal fields from a returned course and its university', async () => {
    mocks.universityFindFirst.mockResolvedValue(null);
    mocks.courseFindFirst.mockResolvedValue(courseRecord());
    mocks.courseFindMany.mockResolvedValue([]);
    const res = await courseFinderDetailGET(new Request('https://alo.test/api/course-finder/msc-data-science-leeds') as any, {
      params: Promise.resolve({ slug: 'msc-data-science-leeds' }),
    });
    expect(res.status).toBe(200);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain('commissions');
    expect(text).not.toContain('staff-only note');
    expect(text).not.toContain('partner-only text');
    expect(text).not.toContain('internalNotes');
  });
});

it('filters similar-course intakes as strictly as the main public course', async () => {
  const { NextRequest } = await import('next/server');
  const res = await courseDetailGET(new NextRequest('https://alo.test/api/courses/msc-data-science-leeds'), { params: Promise.resolve({ slug: 'msc-data-science-leeds' }) });
  expect(res.status).toBe(200);
  const query = mocks.courseFindMany.mock.calls[0][0];
  expect(query.select.intakeFees.where).toEqual({ status: 'active', verificationStatus: 'VERIFIED' });
});
