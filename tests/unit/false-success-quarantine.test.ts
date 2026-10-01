import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const { db, getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  db: { user: { findUnique: vi.fn() }, fileMetadata: { create: vi.fn() }, crmCourse: { findMany: vi.fn() }, universityUpdateRequest: { create: vi.fn() } },
}));
vi.mock('@/lib/db', () => ({ db }));
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
import { POST as upload } from '@/app/api/storage/upload/route';
import { POST as scan } from '@/app/api/cron/weekly-ai-agent/route';
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('ALO_CRON_SECRET', 'isolated-unit-test-cron-secret');
  getServerSession.mockResolvedValue({ user: { id: 'staff-1' } });
  db.user.findUnique.mockResolvedValue({ id: 'staff-1', role: 'SUPER_ADMIN', status: 'ACTIVE', permissions: '[]' });
  db.crmCourse.findMany.mockResolvedValue([{ universityId: 'unit-university', courseId: 'unit-course', courseTitle: 'Unit course', officialUrl: 'https://example.com', university: { country: 'UK' } }]);
  db.fileMetadata.create.mockRejectedValue(new Error('offline'));
});
afterEach(() => vi.unstubAllEnvs());
describe('production incomplete-path quarantine; real authorization, isolated database doubles', () => {
  it('does not manufacture official-source updates', async () => {
    const res = await scan(new Request('https://example.com/api/cron/weekly-ai-agent', { method: 'POST', headers: { 'x-cron-secret': 'isolated-unit-test-cron-secret' } }));
    expect(res.status).toBe(503); expect(await res.json()).toMatchObject({ success: false, status: 'DISABLED' });
    expect(db.universityUpdateRequest.create).not.toHaveBeenCalled(); expect(db.crmCourse.findMany).not.toHaveBeenCalled();
  });
  it('does not report a file upload without persisted bytes', async () => {
    const data = new FormData(); data.set('file', new File(['unit fixture'], 'unit.txt', { type: 'text/plain' }));
    const res = await upload(new Request('https://example.com/api/storage/upload', { method: 'POST', body: data }));
    expect(res.status).toBe(503); expect(await res.json()).toMatchObject({ success: false, status: 'DISABLED' });
    expect(db.fileMetadata.create).not.toHaveBeenCalled();
  });
  it('preserves unauthorized rejection on both paths', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await upload(new Request('https://example.com/api/storage/upload', { method: 'POST' }))).status).toBe(401);
    expect((await scan(new Request('https://example.com/api/cron/weekly-ai-agent', { method: 'POST' }))).status).toBe(401);
  });
});
