import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  universityFindFirst: vi.fn(),
  courseCount: vi.fn(),
  courseFindMany: vi.fn(),
  getOptionalAuth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    crmUniversity: { findFirst: mocks.universityFindFirst },
    crmCourse: { count: mocks.courseCount, findMany: mocks.courseFindMany },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({ getOptionalAuth: mocks.getOptionalAuth }));

import type { NextRequest } from 'next/server';
import { GET } from '@/app/api/universities/[slug]/route';
import { publicCourseWhere, publicIntakeWhere, publicRequirementWhere, publicUniversityWhere } from '@/lib/public-catalog';

function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

const university = {
  id: 'uni-db-id',
  universityId: 'UNI-001',
  universityCode: 'PROVIDER-001',
  name: 'Example University',
  slug: 'example-university',
  country: 'United Kingdom',
  city: 'Leeds',
  campusName: 'Main',
  campuses: '[]',
  rankingRecords: [],
  scholarshipRecords: [],
  courses: undefined,
  _count: { courses: 45, scholarshipRecords: 0 },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  verificationStatus: 'VERIFIED',
  publicationStatus: 'published',
  status: 'active',
  lastVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
  sourceUrl: 'https://example.edu',
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.universityFindFirst.mockResolvedValue(university);
  mocks.getOptionalAuth.mockResolvedValue({ roles: [] });
  mocks.courseCount
    .mockResolvedValueOnce(13)
    .mockResolvedValueOnce(7)
    .mockResolvedValueOnce(45)
    .mockResolvedValueOnce(40)
    .mockResolvedValueOnce(35)
    .mockResolvedValueOnce(10);
  mocks.courseFindMany.mockResolvedValue([
    {
      id: 'course-db-id',
      courseId: 'CS-2027',
      courseCode: 'CS-2027',
      courseTitle: 'Computer Science',
      slug: 'computer-science',
      studyLevel: 'Master',
      qualification: 'MSc',
      durationMonths: 12,
      status: 'active',
      internationalEligibility: 'eligible',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'published',
      officialUrl: 'https://example.edu/cs',
      sourceUrl: 'https://example.edu/cs',
      lastVerifiedAt: '2026-09-01',
      intakeFees: [{ intakeYear: 2027, intakeMonth: 'September', verificationStatus: 'VERIFIED', intakeSourceUrl: 'https://example.edu/international' }],
      courseIntakes: [],
      requirements: [],
    },
  ]);
});

describe('university information catalogue API', () => {
  it('returns all-year paginated international-eligible courses without requiring an intake record', async () => {
    mocks.courseCount.mockReset()
      .mockResolvedValueOnce(471) // candidate CRM course records
      .mockResolvedValueOnce(450) // verified and published course records
      .mockResolvedValueOnce(120) // explicit international-eligibility records
      .mockResolvedValueOnce(200) // eligibility not explicitly confirmed
      .mockResolvedValueOnce(115) // course codes recorded
      .mockResolvedValueOnce(15); // no verified source-backed intake/fee record
    mocks.courseFindMany.mockResolvedValueOnce([{
      id: 'course-db-id', courseId: 'CS-2027', courseCode: 'CS-2027',
      courseTitle: 'Computer Science', slug: 'computer-science', studyLevel: 'Master',
      qualification: 'MSc', durationMonths: 12, status: 'active',
      internationalEligibility: 'eligible', verificationStatus: 'VERIFIED',
      publicationStatus: 'published', officialUrl: 'https://example.edu/cs',
      sourceUrl: 'https://example.edu/cs', lastVerifiedAt: '2026-09-01', intakeFees: [], requirements: [],
    }]);
    const response = await GET(
      makeRequest('https://alo.test/api/universities/example-university?catalogue=international&coursePage=3&courseLimit=12'),
      { params: Promise.resolve({ slug: 'example-university' }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.internationalCourseCatalog).toMatchObject({
      page: 3, pageSize: 12, totalCourses: 120, totalPages: 10,
      candidateCourseRecords: 471, verifiedPublishedCourseRecords: 450,
      verifiedInternationalCourseRecords: 120, eligibilityNotConfirmedCourseRecords: 200,
      courseCodesRecorded: 115, courseCodesMissing: 5,
      verifiedInternationalCoursesWithoutVerifiedIntake: 15,
      catalogueCoverageStatus: 'RESEARCH_REQUIRED',
    });
    expect(body.data.intakeWindow).toBeUndefined();
    expect(body.data.popularCourses[0]).toMatchObject({ courseCode: 'CS-2027', internationalEligibility: 'eligible', intakes: [] });
    expect(mocks.courseFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 24,
      take: 12,
      orderBy: [{ studyLevel: 'asc' }, { courseTitle: 'asc' }],
      where: expect.objectContaining({
        universityId: 'UNI-001',
        status: 'active',
        verificationStatus: 'VERIFIED',
        publicationStatus: { in: ['published', 'PUBLISHED'] },
        internationalEligibility: expect.objectContaining({ in: expect.arrayContaining(['eligible']) }),
      }),
      include: expect.objectContaining({
        intakeFees: expect.objectContaining({ where: expect.objectContaining({
          status: 'active', verificationStatus: 'VERIFIED',
          OR: [{ intakeSourceUrl: { startsWith: 'https://' } }, { feeSourceUrl: { startsWith: 'https://' } }],
        }) }),
      }),
    }));
    const courseWhere = mocks.courseFindMany.mock.calls[0][0].where;
    expect(courseWhere).not.toHaveProperty('intakeFees');
  });

  it('returns a bounded, paginated, explicitly international-eligible January 2027–January 2028 listing and honest coverage status', async () => {
    const response = await GET(
      makeRequest('https://alo.test/api/universities/example-university?intakeWindow=2027-01%3A2028-01&coursePage=2&courseLimit=12'),
      { params: Promise.resolve({ slug: 'example-university' }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.intakeWindow).toMatchObject({
      start: '2027-01',
      end: '2028-01',
      totalCourses: 13,
      totalPages: 2,
      page: 2,
      pageSize: 12,
      courseCodesRecorded: 7,
      courseCodesMissing: 6,
      catalogueCoverageStatus: 'RESEARCH_REQUIRED',
      candidateCourseRecords: 45,
      verifiedPublishedCourseRecords: 40,
      verifiedInternationalCourseRecords: 35,
      eligibilityNotConfirmedCourseRecords: 10,
      courseRecordsNotCurrentlyPublishable: 5,
      verifiedInternationalCoursesWithoutWindowIntake: 22,
    });
    expect(body.data.universityCode).toBe('PROVIDER-001');
    expect(body.data.popularCourses[0]).toMatchObject({
      courseCode: 'CS-2027',
      internationalEligibility: 'eligible',
      courseTitle: 'Computer Science',
    });
    expect(mocks.courseFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 12,
      take: 12,
      orderBy: { courseTitle: 'asc' },
      where: expect.objectContaining({
        universityId: 'UNI-001',
        status: 'active',
        verificationStatus: 'VERIFIED',
        publicationStatus: { in: ['published', 'PUBLISHED'] },
        internationalEligibility: expect.objectContaining({ in: expect.arrayContaining(['eligible']) }),
        intakeFees: expect.objectContaining({ some: expect.objectContaining({ verificationStatus: 'VERIFIED', intakeSourceUrl: { startsWith: 'https://' } }) }),
      }),
      include: expect.objectContaining({
        intakeFees: expect.objectContaining({ where: expect.objectContaining({ verificationStatus: 'VERIFIED', intakeSourceUrl: { startsWith: 'https://' } }) }),
      }),
    }));
    const courseWhere = mocks.courseFindMany.mock.calls[0][0].where;
    expect(courseWhere.internationalEligibility.in).not.toContain('not_verified');
    expect(courseWhere).not.toHaveProperty('courseIntakes');
    const universityQuery = mocks.universityFindFirst.mock.calls[0][0];
    expect(universityQuery.where.AND).toEqual(expect.arrayContaining([publicUniversityWhere()]));
  });

  it('filters embedded public courses, fees, and requirements to verified published records', async () => {
    const response = await GET(
      makeRequest('https://alo.test/api/universities/example-university'),
      { params: Promise.resolve({ slug: 'example-university' }) },
    );

    expect(response.status).toBe(200);
    const query = mocks.universityFindFirst.mock.calls[0][0];
    expect(query.include.courses.where).toEqual(publicCourseWhere());
    expect(query.include.courses.include.intakeFees.where).toEqual(publicIntakeWhere());
    expect(query.include.courses.include.requirements.where).toEqual(publicRequirementWhere());
    expect(query.include.rankingRecords.where).toEqual({ verificationStatus: 'VERIFIED' });
    expect(query.include.scholarshipRecords.where).toMatchObject({
      status: 'active',
      verificationStatus: { in: ['VERIFIED', 'verified', 'VERIFIED_RECENT', 'verified_recent'] },
      lastCheckedAt: { gte: expect.any(String), lte: expect.any(String) },
      officialScholarshipUrl: { startsWith: 'https://' },
    });
    expect(query.include._count.select.courses.where).toEqual(publicCourseWhere());
  });

  it('does not apply public publication filters to an authorized staff profile lookup', async () => {
    mocks.getOptionalAuth.mockResolvedValue({ roles: ['SUPER_ADMIN'] });
    const response = await GET(
      makeRequest('https://alo.test/api/universities/example-university'),
      { params: Promise.resolve({ slug: 'example-university' }) },
    );

    expect(response.status).toBe(200);
    const query = mocks.universityFindFirst.mock.calls[0][0];
    expect(query.where).not.toHaveProperty('publicationStatus');
    expect(query.where).not.toHaveProperty('verificationStatus');
    expect(query.include.courses).not.toHaveProperty('where');
    expect(query.include.courses.include.intakeFees).not.toHaveProperty('where');
    expect(query.include.courses.include.requirements).not.toHaveProperty('where');
    expect(query.include.rankingRecords).not.toHaveProperty('where');
    expect(query.include.scholarshipRecords).not.toHaveProperty('where');
    expect(query.include._count.select.courses).toBe(true);
  });

  it('rejects a missing university slug without querying data', async () => {
    const response = await GET(
      makeRequest('https://alo.test/api/universities/?intakeWindow=2027-01%3A2028-01'),
      { params: Promise.resolve({ slug: '  ' }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.universityFindFirst).not.toHaveBeenCalled();
  });
});
