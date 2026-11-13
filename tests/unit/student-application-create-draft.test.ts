import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicCourseWhere, publicIntakeWhere } from '@/lib/public-catalog';

const mocks = vi.hoisted(() => ({
  courseFindFirst: vi.fn(),
  studentFindUnique: vi.fn(),
  createCanonicalStudent: vi.fn(),
  applicationFindFirst: vi.fn(),
  applicationCreate: vi.fn(),
  applicationUpdate: vi.fn(),
  studentDocumentFindFirst: vi.fn(),
  applicationDocumentCreate: vi.fn(),
  applicationDocumentFindMany: vi.fn(),
  stageHistoryCreate: vi.fn(),
  statusLogCreate: vi.fn(),
  timelineCreate: vi.fn(),
  auth: vi.fn(),
}));

const tx = {
  application: {
    findFirst: mocks.applicationFindFirst,
    create: mocks.applicationCreate,
    update: mocks.applicationUpdate,
  },
  studentDocument: { findFirst: mocks.studentDocumentFindFirst },
  applicationDocument: {
    create: mocks.applicationDocumentCreate,
    findMany: mocks.applicationDocumentFindMany,
  },
  applicationStageHistory: { create: mocks.stageHistoryCreate },
  applicationStatusLog: { create: mocks.statusLogCreate },
};

vi.mock('@/lib/db', () => ({
  db: {
    crmCourse: { findFirst: mocks.courseFindFirst },
    student: { findUnique: mocks.studentFindUnique },
    timelineEvent: { create: mocks.timelineCreate },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  },
}));

vi.mock('@/lib/student/canonical-student', () => ({
  createCanonicalStudent: (...args: unknown[]) => mocks.createCanonicalStudent(...args),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
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
  mocks.auth.mockReturnValue({ userId: 'user-1', email: 'student@example.org', name: 'Student One', roles: ['STUDENT'] });
  mocks.courseFindFirst.mockResolvedValue(verifiedCourse());
  mocks.createCanonicalStudent.mockResolvedValue({ success: true, studentId: 'AE-2026000001', studentDbId: 'student-row-1', mode: 'LINKED' });
  mocks.studentFindUnique.mockResolvedValue({ id: 'student-row-1', studentId: 'AE-2026000001' });
  mocks.applicationFindFirst.mockResolvedValue(null);
  mocks.applicationCreate.mockResolvedValue({ id: 'application-row-1', applicationId: 'APP-1' });
  mocks.applicationUpdate.mockResolvedValue({});
  mocks.studentDocumentFindFirst.mockResolvedValue(null);
  mocks.applicationDocumentCreate.mockResolvedValue({});
  mocks.applicationDocumentFindMany.mockResolvedValue([]);
  mocks.stageHistoryCreate.mockResolvedValue({});
  mocks.statusLogCreate.mockResolvedValue({});
  mocks.timelineCreate.mockResolvedValue({});
});

describe('POST /api/student/applications/create-draft', () => {
  it('queries only public verified courses and does not link/create a student for unavailable records', async () => {
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
    expect(mocks.createCanonicalStudent).not.toHaveBeenCalled();
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
    expect(mocks.createCanonicalStudent).toHaveBeenCalledWith({ name: 'Student One', email: 'student@example.org', userId: 'user-1' });
    expect(mocks.applicationCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      universityName: 'Example University',
      courseName: 'MSc Data Science',
      courseId: 'CRS-1',
      universityId: 'UNI-1',
      intake: '',
      country: 'Australia',
      level: '',
    }) });
    expect(mocks.studentDocumentFindFirst).toHaveBeenCalledTimes(6);
    expect(mocks.applicationDocumentCreate).toHaveBeenCalledTimes(6);
    expect(mocks.applicationDocumentCreate.mock.calls[0][0].data).toMatchObject({ documentId: '', status: 'REQUIRED', fileUrl: '' });
    expect(mocks.timelineCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      description: expect.stringContaining('(intake not yet confirmed)'),
    }) });
  });

  it('does not expose partner, commission, or internal workflow fields when reusing an existing application', async () => {
    mocks.applicationFindFirst.mockResolvedValue({
      id: 'application-row-1', applicationId: 'APP-1', applicationCode: 'APP-1',
      universityId: 'UNI-1', universityName: 'Example University', courseId: 'CRS-1', courseName: 'MSc Data Science',
      country: 'United Kingdom', intake: '', level: 'Master', safeStatus: 'SUBMITTED', documentStatus: 'COMPLETE',
      stage: 'SUBMITTED_TO_B2B', isB2b: true, isB2bConfidential: true, b2bProviderId: 'private-provider-id',
      b2bCommissionAmount: 9000, internalNotes: 'private note',
    });
    const response = await POST(request({ courseId: 'CRS-1' }) as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.reused).toBe(true);
    expect(body.data).not.toHaveProperty('stage');
    expect(body.data).not.toHaveProperty('b2bProviderId');
    expect(body.data).not.toHaveProperty('b2bCommissionAmount');
    expect(body.data).not.toHaveProperty('internalNotes');
    expect(JSON.stringify(body)).not.toContain('private-provider-id');
    expect(JSON.stringify(body)).not.toContain('private note');
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
    expect(mocks.createCanonicalStudent).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });

  it('rejects a mismatched university identifier before linking a student record', async () => {
    const response = await POST(request({ courseId: 'CRS-1', universityId: 'UNI-OTHER' }) as never);

    expect(response.status).toBe(400);
    expect(mocks.createCanonicalStudent).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });

  it('does not fabricate a profile when the verified account name/email is missing', async () => {
    mocks.auth.mockReturnValue({ userId: 'user-1', email: '', name: '', roles: ['STUDENT'] });
    const response = await POST(request({ courseId: 'CRS-1' }) as never);
    expect(response.status).toBe(422);
    expect(mocks.createCanonicalStudent).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });
});
