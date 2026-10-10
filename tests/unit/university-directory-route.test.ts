import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  universityCount: vi.fn(),
  universityFindMany: vi.fn(),
  courseFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    crmUniversity: { count: mocks.universityCount, findMany: mocks.universityFindMany },
    crmCourse: { findMany: mocks.courseFindMany },
  },
}));

import { GET } from '@/app/api/course-finder/universities/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.universityCount.mockResolvedValue(31);
  mocks.universityFindMany.mockResolvedValue([{ id: 'uni-1', name: 'Example University', slug: 'example-university', country: 'United Kingdom', _count: { courses: 4 } }]);
});

describe('public university directory API', () => {
  it('returns paginated active, verified, published university records', async () => {
    const request = new Request('https://alo.test/api/course-finder/universities?countries=United%20Kingdom&page=2&limit=12');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, total: 31, page: 2, totalPages: 3, limit: 12 });
    expect(mocks.universityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 12,
      take: 12,
      select: expect.objectContaining({
        type: true,
        worldRanking: true,
        ranking: true,
        rankingProvider: true,
        rankingYear: true,
      }),
      where: expect.objectContaining({
        status: 'active',
        verificationStatus: 'VERIFIED',
        publicationStatus: { in: ['published', 'PUBLISHED'] },
        AND: [{ country: { in: ['United Kingdom'] } }],
      }),
    }));
  });

  it('fails closed rather than pretending an unsupported partner-only filter exists', async () => {
    const response = await GET(new Request('https://alo.test/api/course-finder/universities?isPartner=true'));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: expect.stringContaining('not represented') });
    expect(mocks.universityCount).not.toHaveBeenCalled();
    expect(mocks.universityFindMany).not.toHaveBeenCalled();
  });
});
