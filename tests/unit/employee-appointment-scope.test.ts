import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), scope: vi.fn(), appointment: vi.fn(), list: vi.fn(), transaction: vi.fn(), create: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/employees/appointment-access', () => ({ appointmentStudentScope: m.scope }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { appointment: { findUnique: m.appointment, findMany: m.list }, $transaction: m.transaction } }));
import { GET, POST } from '@/app/api/employee/appointments/route';
import { GET as detail, PATCH, DELETE } from '@/app/api/employee/appointments/[id]/route';
const req = (method = 'GET', body?: unknown) => new NextRequest('https://alo.test/api/employee/appointments/appt', { method, headers: { origin: 'https://alo.test', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
const context = { params: Promise.resolve({ id: 'appt' }) };
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', authenticationMethod: 'cookie' });
  m.scope.mockResolvedValue(['assigned']); m.list.mockResolvedValue([]);
  m.appointment.mockResolvedValue({ id: 'appt', studentId: 'other', status: 'scheduled' });
  m.transaction.mockImplementation(async callback => callback({ appointment: { create: m.create, update: m.update } }));
  m.update.mockResolvedValue({ id: 'appt', studentId: 'assigned', status: 'cancelled' });
});
describe('employee appointment direct API scope', () => {
  it('filters list at the database boundary', async () => { expect((await GET(req())).status).toBe(200); expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: { in: ['assigned'] } } })); });
  it.each(['GET', 'PATCH', 'DELETE'])('denies foreign appointment %s', async method => {
    const fn = method === 'GET' ? detail : method === 'PATCH' ? PATCH : DELETE;
    expect((await fn(req(method, method === 'PATCH' ? { status: 'completed' } : undefined), context)).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('rejects fake/general student creation', async () => { expect((await POST(req('POST', { title: 'Visit', scheduledAt: '2026-10-25T10:00:00Z' }))).status).toBe(400); expect(m.create).not.toHaveBeenCalled(); });
  it('rejects unassigned student creation', async () => { expect((await POST(req('POST', { studentId: 'other', title: 'Visit', scheduledAt: '2026-10-25T10:00:00Z' }))).status).toBe(403); });
  it('archives an authorized appointment and audits instead of deleting history', async () => {
    m.appointment.mockResolvedValue({ id: 'appt', studentId: 'assigned' });
    expect((await DELETE(req('DELETE'), context)).status).toBe(200);
    expect(m.update).toHaveBeenCalledWith({ where: { id: 'appt' }, data: { status: 'cancelled' } }); expect(m.audit).toHaveBeenCalled();
  });
  it('preserves unauthenticated rejection', async () => { m.auth.mockResolvedValue(NextResponse.json({}, { status: 401 })); expect((await GET(req())).status).toBe(401); });
});
