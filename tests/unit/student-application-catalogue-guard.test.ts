import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), readiness: vi.fn(), course: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { crmCourse: { findFirst: mocks.course }, $transaction: mocks.transaction } }));
vi.mock('@/lib/unified-auth', () => ({ authenticateUnified: mocks.authenticate }));
vi.mock('@/lib/application-readiness', () => ({ getFormBReadiness: mocks.readiness }));
vi.mock('@/lib/auth-middleware', () => ({ logAuditAction: vi.fn() }));
vi.mock('@/lib/student-auth', () => ({ logStudentEvent: vi.fn() }));
vi.mock('@/lib/analytics/server-conversions', () => ({ reportServerEvent: vi.fn() }));
import { POST } from '@/app/api/applications/route';

const request = (extra: Record<string, unknown> = {}) => new Request('https://alo.test/api/applications', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ courseId: 'course-1', courseName: 'Course', universityName: 'University', intake: 'Jan 2027', ...extra }),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue({ type: 'student', data: { studentId: 'student-1' } });
  mocks.readiness.mockResolvedValue({ complete: true, percent: 100, missing: [] });
  mocks.course.mockResolvedValue({ courseId: 'course-1', courseTitle: 'Course', universityId: 'uni-1', university: { name: 'University' }, intakeFees: [{ intakeName: 'Jan 2027', intakeMonth: 'Jan', intakeYear: 2027 }] });
});

describe('student application server gate', () => {
  it('rejects incomplete Form B before attempting catalogue lookup or creating an application', async () => {
    mocks.readiness.mockResolvedValue({ complete: false, percent: 0, missing: [{ key: 'personal', label: 'Personal Information', href: '/student/profile' }] });
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ success: false, code: 'FORM_B_INCOMPLETE' });
    expect(mocks.course).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects unavailable courses and unrecorded intakes', async () => {
    mocks.course.mockResolvedValueOnce(null);
    expect((await POST(request())).status).toBe(404);
    expect((await POST(request({ intake: 'Feb 2027' }))).status).toBe(422);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('fails closed when catalogue validation is unavailable', async () => {
    mocks.course.mockRejectedValueOnce(new Error('database offline'));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
