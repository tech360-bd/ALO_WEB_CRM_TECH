import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicCourseWhere, publicIntakeWhere, publicRequirementWhere, publicScholarshipWhere } from '@/lib/public-catalog';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  courseCount: vi.fn(),
  courseFindMany: vi.fn(),
  studentFindFirst: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    crmCourse: { count: mocks.courseCount, findMany: mocks.courseFindMany },
    student: { findFirst: mocks.studentFindFirst },
  },
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: { roles: string[] }) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));

import { GET } from '@/app/api/partner/programs/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ roles: ['PARTNER'] });
  mocks.courseCount.mockResolvedValue(0);
  mocks.courseFindMany.mockResolvedValue([]);
  mocks.studentFindFirst.mockResolvedValue(null);
});

describe('partner program discovery', () => {
  it('limits external partners to public courses and verified supporting records', async () => {
    const response = await GET(new Request('https://alo.test/api/partner/programs') as never);

    expect(response.status).toBe(200);
    expect(mocks.courseFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: publicCourseWhere(),
      include: expect.objectContaining({
        intakeFees: expect.objectContaining({ where: publicIntakeWhere() }),
        requirements: expect.objectContaining({ where: publicRequirementWhere() }),
        scholarshipRecords: expect.objectContaining({ where: publicScholarshipWhere() }),
      }),
    }));
  });

  it('keeps the internal administrator view available for review workflows', async () => {
    mocks.auth.mockReturnValue({ roles: ['SUPER_ADMIN'] });
    await GET(new Request('https://alo.test/api/partner/programs') as never);

    expect(mocks.courseFindMany.mock.calls[0][0].where).toEqual({});
    expect(mocks.courseFindMany.mock.calls[0][0].include.intakeFees).not.toHaveProperty('where');
  });
});
