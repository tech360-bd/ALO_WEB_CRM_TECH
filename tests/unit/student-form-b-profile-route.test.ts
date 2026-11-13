import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), remove: vi.fn(), create: vi.fn(), update: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/student-auth', () => ({ authenticateStudentRequest: m.auth }));
vi.mock('@/lib/db', () => ({ db: {
  studentProfileSection: { findMany: m.find }, $transaction: m.transaction,
} }));
import { GET, PUT } from '@/app/api/student-portal/profile/route';
const request = (body: unknown) => new Request('https://alo.test/api/student-portal/profile', { method: 'PUT', body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ studentId: 'own-student', studentCode: 'AE-2026000001', name: 'Synthetic Student', email: 'synthetic@example.test', phone: '+8801800000000' });
  m.find.mockResolvedValue([]);
  m.transaction.mockImplementation(async (fn) => fn({ studentProfileSection: { deleteMany: m.remove, create: m.create }, student: { update: m.update } }));
});
describe('Form B profile persistence', () => {
  it('loads only the authenticated student and supplies no sample qualification', async () => {
    const response = await GET(new Request('https://alo.test/api/student-portal/profile?studentId=other'));
    expect(m.find).toHaveBeenCalledWith({ where: { studentId: 'own-student' } });
    expect(await response.json()).toMatchObject({ success: true, data: { studentId: 'AE-2026000001', givenName: 'Synthetic', profileCompletion: 0 } });
  });
  it('rejects unauthenticated writes before accessing the DB', async () => {
    m.auth.mockResolvedValue(NextResponse.json({ success: false }, { status: 401 }));
    expect((await PUT(request({}))).status).toBe(401);
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it('persists partial work as incomplete and ignores forged ownership/completion', async () => {
    const response = await PUT(request({ givenName: 'Synthetic', studentId: 'other', status: 'verified', profileCompletion: 100 }));
    expect(await response.json()).toMatchObject({ success: true, data: { profileCompletion: 0 } });
    for (const [call] of m.create.mock.calls) {
      expect(call.data.studentId).toBe('own-student');
      if (!['notes'].includes(call.data.section)) {
        expect(call.data.status).toBe('incomplete');
        expect(call.data.completedAt).toBeNull();
      }
      expect(call.data.data).not.toContain('verified');
    }
    expect(m.update).toHaveBeenCalledWith({ where: { id: 'own-student' }, data: { profileComplete: 0 } });
  });
  it('preserves saved arrays and false values on reload', async () => {
    m.find.mockResolvedValue([{ section: 'form_b_ui', data: JSON.stringify({ educations: [], sameAsPresent: false, hasPassport: 'no' }) }]);
    expect(await (await GET(new Request('https://alo.test/api/student-portal/profile'))).json()).toMatchObject({ data: { educations: [], sameAsPresent: false, hasPassport: 'no' } });
  });
  it('returns failure rather than success if the transaction fails', async () => {
    m.transaction.mockRejectedValue(new Error('synthetic failure'));
    expect((await PUT(request({ givenName: 'Synthetic' }))).status).toBe(503);
  });
  it('rejects invalid and oversized payloads', async () => {
    expect((await PUT(request([]))).status).toBe(400);
    expect((await PUT(request({ remarks: 'x'.repeat(1000001) }))).status).toBe(413);
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
