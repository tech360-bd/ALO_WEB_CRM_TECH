import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  countryFindFirst: vi.fn(),
  courseFindMany: vi.fn(),
  uniFindMany: vi.fn(),
  scholFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    country: { findFirst: m.countryFindFirst },
    crmCourse: { findMany: m.courseFindMany },
    crmUniversity: { findMany: m.uniFindMany },
    crmScholarship: { findMany: m.scholFindMany },
  },
}));
vi.mock('@/components/website/PremiumCountryPage', () => ({ default: () => null }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND'); } }));

import { GET } from '@/app/api/destinations/[slug]/route';
import CountryDestinationPage from '@/app/destinations/[slug]/page';
import CountryCoursesPage from '@/app/destinations/[slug]/courses/page';
import CountryUniversitiesPage from '@/app/destinations/[slug]/universities/page';
import CountryScholarshipsPage from '@/app/destinations/[slug]/scholarships/page';
import { publicIntakeWhere, publicCourseWhere, publicScholarshipWhere, publicUniversityWhere } from '@/lib/public-catalog';

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  vi.resetAllMocks();
  m.courseFindMany.mockResolvedValue([{ courseId: 'C1', partnerDescription: 'internal', commissions: [{ x: 1 }] }]);
  m.uniFindMany.mockResolvedValue([{ universityId: 'U1', admissionNotes: 'internal', contactEmail: 'x@y.z' }]);
  m.scholFindMany.mockResolvedValue([]);
});

describe('/api/destinations/[slug]', () => {
  it('returns 404 for an unknown destination instead of falling back to UK data', async () => {
    m.countryFindFirst.mockResolvedValue(null);
    const res = await GET(new Request('http://x/api/destinations/atlantis'), params('atlantis'));
    expect(res.status).toBe(404);
    expect(m.courseFindMany).not.toHaveBeenCalled();
  });

  it('uses the canonical public catalogue filters and strips internal fields', async () => {
    m.countryFindFirst.mockResolvedValue(null);
    const res = await GET(new Request('http://x/api/destinations/uk'), params('uk'));
    expect(res.status).toBe(200);
    expect(m.courseFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicCourseWhere());
    expect(m.uniFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicUniversityWhere());
    expect(m.scholFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicScholarshipWhere());
    const { data } = await res.json();
    const text = JSON.stringify([data.linkedCourses, data.linkedUniversities, data.linkedScholarships]);
    expect(text).toContain('C1');
    expect(text).not.toContain('internal');
    expect(text).not.toContain('commissions');
    expect(text).not.toContain('x@y.z');
  });

  it('does not leak database error details', async () => {
    m.countryFindFirst.mockRejectedValue(new Error('mysql://user:password@db'));
    const res = await GET(new Request('http://x/api/destinations/uk'), params('uk'));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('mysql://');
  });
});

describe('/destinations/[slug] pages', () => {
  it('main page lists only public records (courses, universities, scholarships, nested intakes/requirements)', async () => {
    await CountryDestinationPage(params('uk'));
    const courseQuery = m.courseFindMany.mock.calls[0][0];
    expect(courseQuery.where.AND[0]).toEqual(publicCourseWhere());
    expect(courseQuery.include.intakeFees.where).toEqual(publicIntakeWhere());
    expect(courseQuery.include.requirements.where).toEqual({ verificationStatus: 'VERIFIED' });
    expect(m.uniFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicUniversityWhere());
    expect(m.scholFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicScholarshipWhere());
  });

  it('courses / universities / scholarships sub-pages use the same public filters', async () => {
    await CountryCoursesPage(params('uk'));
    await CountryUniversitiesPage(params('uk'));
    await CountryScholarshipsPage(params('uk'));
    expect(m.courseFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicCourseWhere());
    expect(m.uniFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicUniversityWhere());
    expect(m.scholFindMany.mock.calls[0][0].where.AND[0]).toEqual(publicScholarshipWhere());
  });
});
