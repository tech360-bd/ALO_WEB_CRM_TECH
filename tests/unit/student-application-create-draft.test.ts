import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicCourseWhere, publicIntakeWhere } from '@/lib/public-catalog';

const mocks = vi.hoisted(() => ({
  courseFindFirst: vi.fn(),
  studentFindFirst: vi.fn(),
  studentCreate: vi.fn(),
  applicationFindFirst: vi.fn(),
  applicationCreate: vi.fn(),
  documentCreate: vi.fn(),
  timelineCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    crmCourse: { findFirst: mocks.courseFindFirst },
    student: { findFirst: mocks.studentFindFirst, create: mocks.studentCreate },
    application: { findFirst: mocks.applicationFindFirst, create: mocks.applicationCreate },
    studentDocument: { create: mocks.documentCreate },
    timelineEvent: { create: mocks.timelineCreate },
  },
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>) => Promise<Response>) =>
    (request: Request) => handler(request, { userId: 'student-1', email: 'student@example.org', name: 'Student One', roles: ['STUDENT'] }),
}));

import { POST } from '@/app/api/student/applications/create-draft/route';

const verifiedCourse = (overrides: Record<string, unknown> = {}) => ({
  id: 'course-row-1',
  courseId: 'CRS-1',
  universityId: 'UNI-1',
  courseTitle: 'MSc Data Science',
  status: 'active',
  verificationStatus: 'VERIFIED',
  publicationStatus: 'published',
  sourceUrl: 'https://example.edu/courses/data-science',
  officialUrl: 'https://example.edu/courses/data-science',
  country: 'United Kingdom',
  studyLevel: 'Master',
  programLevel: '',
  university: { id: 'university-row-1', universityId: 'UNI-1', name: 'Example University', country: 'United Kingdom' },
  intakeFees: [],
  ...overrides,
});

function request(body: unknown): Request {
  return new Request('https://alo.test/api/student/applications/create-draft', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.courseFindFirst.mockResolvedValue(verifiedCourse());
  mocks.studentFindFirst.mockResolvedValue({ id: 'student-row-1' });
  mocks.studentCreate.mockResolvedValue({ id: 'student-row-1' });
  mocks.applicationFindFirst.mockResolvedValue(null);
  mocks.applicationCreate.mockResolvedValue({ id: 'application-row-1', applicationId: 'APP-1' });
  mocks.documentCreate.mockResolvedValue({});
  mocks.timelineCreate.mockResolvedValue({});
});

describe('POST /api/student/applications/create-draft', () => {
  it('queries only public verified courses and does not create a student for unavailable records', async () => {
    mocks.courseFindFirst.mockResolvedValue(null);
    const response = await POST(request({ courseId: 'CRS-HIDDEN' }) as never);

    expect(response.status).toBe(404);
    expect(mocks.courseFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [publicCourseWhere(), { OR: [{ courseId: 'CRS-HIDDEN' }, { id: 'CRS-HIDDEN' }] }] },
      include: expect.objectContaining({
        intakeFees: expect.objectContaining({
          where: { ...publicIntakeWhere(), intakeSourceUrl: { not: '' } },
        }),
      }),
    }));
    expect(mocks.studentFindFirst).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });

  it('leaves intake, country, and level blank rather than inventing defaults', async () => {
    mocks.courseFindFirst.mockResolvedValue(verifiedCourse({
      country: '',
      studyLevel: '',
      programLevel: '',
      university: { id: 'university-row-1', universityId: 'UNI-1', name: 'Example University', country: 'Australia' },
      intakeFees: [],
    }));
    const response = await POST(request({ courseId: 'CRS-1' }) as never);

    expect(response.status).toBe(200);
    expect(mocks.applicationCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      universityName: 'Example University',
      courseName: 'MSc Data Science',
      intake: '',
      country: 'Australia',
      level: '',
    }) });
    expect(mocks.timelineCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      description: expect.stringContaining('(intake not yet confirmed)'),
    }) });
  });

  it('accepts only an intake returned by the verified official-source query', async () => {
    mocks.courseFindFirst.mockResolvedValue(verifiedCourse({
      intakeFees: [{
        intakeYear: 2027,
        intakeMonth: 'January',
        verificationStatus: 'VERIFIED',
        status: 'active',
        intakeSourceUrl: 'https://example.edu/international/entry',
      }],
    }));
    const response = await POST(request({ courseId: 'CRS-1', intakeYear: '2027', intakeMonth: '1' }) as never);

    expect(response.status).toBe(200);
    expect(mocks.applicationCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ intake: 'January 2027' }) });
  });

  it('rejects an intake that was not returned as a source-verified record before writes', async () => {
    const response = await POST(request({ courseId: 'CRS-1', intakeYear: 2028, intakeMonth: 'January' }) as never);

    expect(response.status).toBe(422);
    expect(mocks.studentFindFirst).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });

  it('rejects a mismatched university identifier before creating a student record', async () => {
    const response = await POST(request({ courseId: 'CRS-1', universityId: 'UNI-OTHER' }) as never);

    expect(response.status).toBe(400);
    expect(mocks.studentFindFirst).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });
});
