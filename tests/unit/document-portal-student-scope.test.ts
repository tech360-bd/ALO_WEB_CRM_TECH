import { beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { db, getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  db: { user: { findUnique: vi.fn() }, student: { findFirst: vi.fn(), findUnique: vi.fn() }, studentSession: { findUnique: vi.fn(), update: vi.fn() }, document: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, timelineEvent: { create: vi.fn() }, auditLog: { create: vi.fn() }, $transaction: vi.fn() },
}));
vi.mock('@/lib/db', () => ({ db }));
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
import { GET, POST, PATCH } from '@/app/api/documents/route';
const request = (method = 'GET', query = '', body?: unknown) => new NextRequest(`https://example.com/api/documents${query}`, { method, headers: { 'x-portal-request': 'true', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
beforeEach(() => {
  vi.resetAllMocks(); getServerSession.mockResolvedValue({ user: { identityDomain: 'user', id: 'unit-owner' } });
  db.$transaction.mockImplementation(async (callback: (tx: typeof db) => unknown) => callback(db));
  db.user.findUnique.mockResolvedValue({ id: 'unit-owner', role: 'STUDENT', status: 'ACTIVE', emailVerified: true, permissions: '[]' });
  db.student.findFirst.mockResolvedValue({ id: 'own-student' });
  db.document.findMany.mockResolvedValue([]);
  db.document.create.mockImplementation(async ({ data }) => ({ id: 'unit-document', ...data }));
  db.document.findUnique.mockResolvedValue({ id: 'other-document', studentId: 'other-student', name: 'Document', status: 'UPLOADED' });
});
describe('document ownership applies to canonical NextAuth students, not just StudentSession auth', () => {
  it('scopes canonical-student list to canonical own Student.id when no target supplied', async () => {
    expect((await GET(request())).status).toBe(200);
    expect(db.document.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'own-student' } }));
  });
  it('denies another student ID before reading documents', async () => {
    expect((await GET(request('GET', '?studentId=other-student'))).status).toBe(403);
    expect(db.document.findMany).not.toHaveBeenCalled();
  });
  it('derives own target for metadata requests, never caller-selected ID', async () => {
    const res = await POST(request('POST', '', { studentId: 'other-student', category: 'PASSPORT' }));
    expect(res.status).toBe(403); expect(db.document.create).not.toHaveBeenCalled();
  });
  it('portal student cannot review any document, including own', async () => {
    const res = await PATCH(request('PATCH', '', { id: 'other-document', status: 'APPROVED' }));
    expect(res.status).toBe(403); expect(db.document.findUnique).not.toHaveBeenCalled(); expect(db.document.update).not.toHaveBeenCalled();
  });
  it('returns an empty private list if the canonical student link is missing', async () => {
    db.student.findFirst.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ documents: [] });
    expect(db.document.findMany).not.toHaveBeenCalled();
  });
  it('retains authorized admin listing instead of forcing a student profile', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'unit-admin', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true, permissions: '[]' });
    expect((await GET(request())).status).toBe(200); expect(db.student.findFirst).not.toHaveBeenCalled();
  });
  it('dedicated StudentSession bearer retains the same own-record boundary', async () => {
    db.studentSession.findUnique.mockResolvedValue({ id: 'unit-session', studentId: 'own-student', expiresAt: new Date(Date.now() + 60000), revokedAt: null });
    db.student.findUnique.mockResolvedValue({ id: 'own-student', studentId: 'unit-code', suspended: false, status:'active' });
    const req = new NextRequest('https://example.com/api/documents', { headers: { Authorization: 'Bearer isolated-test-session' } });
    expect((await GET(req)).status).toBe(200);
    expect(db.document.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'own-student' } }));
    const other = new NextRequest('https://example.com/api/documents?studentId=other-student', { headers: { Authorization: 'Bearer isolated-test-session' } });
    expect((await GET(other)).status).toBe(403);
  });
  it('allows admin approval of an uploaded document', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'unit-admin', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true, permissions: '[]' });
    db.student.findUnique.mockResolvedValue({ id: 'other-student', userId: null, counselorId: null });
    db.document.update.mockResolvedValue({ id: 'other-document', status: 'APPROVED' });
    expect((await PATCH(request('PATCH', '', { id: 'other-document', status: 'APPROVED' }))).status).toBe(200);
    expect(db.document.update).toHaveBeenCalledOnce();
  });
  it.each(['REJECTED', 'PENDING_UPLOAD'])('does not let an admin approve a document in %s state', async (status) => {
    db.user.findUnique.mockResolvedValue({ id: 'unit-admin', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true, permissions: '[]' });
    db.student.findUnique.mockResolvedValue({ id: 'other-student', userId: null, counselorId: null });
    db.document.findUnique.mockResolvedValue({ id: 'other-document', studentId: 'other-student', name: 'Document', status });
    const res = await PATCH(request('PATCH', '', { id: 'other-document', status: 'APPROVED' }));
    expect(res.status).toBe(409);
    expect(db.document.update).not.toHaveBeenCalled();
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it('rejects anonymous requests', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401); expect(db.document.findMany).not.toHaveBeenCalled();
  });
});
