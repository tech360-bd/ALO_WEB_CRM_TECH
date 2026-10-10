/**
 * ALO Education — mock-test free-entitlement enforcement regression tests.
 *
 * 2026-10-08 production verification findings on
 * POST /api/student-portal/mock-tests:
 *   1. Students with NO MockTestCredit row were allowed unlimited starts
 *      (the limit was only enforced when a row already existed).
 *   2. The read-then-increment deduction was TOCTOU-racy: parallel/replayed
 *      starts could both pass the availability check and overspend credits.
 *   3. The catch block echoed raw driver/Prisma error messages to the client.
 *
 * The fix consumes the credit with a single guarded UPDATE
 * (usedCredits < totalCredits enforced inside MySQL) and grants the default
 * 3-credit free entitlement atomically on first-ever start.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    portalStudentProfile: { findUnique: vi.fn() },
    mockTestCredit: { findFirst: vi.fn(), create: vi.fn() },
    testSession: { create: vi.fn() },
    $executeRaw: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ db: dbMock }));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: any) => (request: Request) =>
    handler(request, { userId: 'user-1', userType: 'STUDENT', roles: [] }),
  logAuditAction: vi.fn(() => Promise.resolve()),
}));

import { POST } from '@/app/api/student-portal/mock-tests/route';
import { logAuditAction } from '@/lib/auth-middleware';

const postReq = () =>
  new Request('http://localhost/api/student-portal/mock-tests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ testId: 'test-1', testType: 'IELTS_MOCK' }),
  });

describe('POST /api/student-portal/mock-tests credit enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.portalStudentProfile.findUnique.mockResolvedValue({ id: 'student-1' });
    dbMock.testSession.create.mockResolvedValue({ id: 'session-1' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('consumes a credit with a guarded atomic UPDATE and starts the session', async () => {
    dbMock.mockTestCredit.findFirst.mockResolvedValue({ id: 'credit-1', totalCredits: 3, usedCredits: 1 });
    dbMock.$executeRaw.mockResolvedValue(1);

    const res = await POST(postReq());
    expect(res.status).toBe(201);
    expect(dbMock.$executeRaw).toHaveBeenCalledTimes(1);
    expect(dbMock.testSession.create).toHaveBeenCalledTimes(1);
    expect(logAuditAction).toHaveBeenCalled();
  });

  it('rejects with 400 and starts NO session when the guarded update affects 0 rows (limit reached or race lost)', async () => {
    dbMock.mockTestCredit.findFirst.mockResolvedValue({ id: 'credit-1', totalCredits: 3, usedCredits: 3 });
    dbMock.$executeRaw.mockResolvedValue(0);

    const res = await POST(postReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No test credits remaining. Please purchase more credits.');
    expect(dbMock.testSession.create).not.toHaveBeenCalled();
  });

  it('grants the default 3-credit free entitlement on first-ever start instead of allowing unlimited tests', async () => {
    dbMock.mockTestCredit.findFirst.mockResolvedValue(null);
    dbMock.mockTestCredit.create.mockResolvedValue({ id: 'credit-new' });

    const res = await POST(postReq());
    expect(res.status).toBe(201);
    expect(dbMock.mockTestCredit.create).toHaveBeenCalledWith({
      data: { studentId: 'student-1', totalCredits: 3, usedCredits: 1, source: 'free' },
    });
    expect(dbMock.$executeRaw).not.toHaveBeenCalled();
    expect(dbMock.testSession.create).toHaveBeenCalledTimes(1);
  });

  it('returns a generic 500 without leaking driver error details', async () => {
    dbMock.portalStudentProfile.findUnique.mockRejectedValue(
      new Error('connect ECONNREFUSED mysql://root:' + 'secretpw' + '@10.0.0.5:3306')
    );

    const res = await POST(postReq());
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('Failed to start test session');
    expect(text).not.toContain('secretpw');
    expect(text).not.toContain('10.0.0.5');
    expect(dbMock.testSession.create).not.toHaveBeenCalled();
  });
});
