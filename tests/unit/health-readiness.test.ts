import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: { $queryRaw: vi.fn(), ...Object.fromEntries(['crmUniversity', 'crmCourse', 'student', 'portalUser', 'studentDocument', 'cmsManagedContent'].map(name => [name, { findFirst: vi.fn() }])) } }));
import { db } from '@/lib/db';
import { GET } from '@/app/api/health/route';
import { GET as live } from '@/app/api/health/live/route';

describe('health probes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const model of [db.crmUniversity, db.crmCourse, db.student, db.portalUser, db.studentDocument, db.cmsManagedContent]) vi.mocked(model.findFirst).mockResolvedValue(null);
  });
  it('reports ready only after a successful database query', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ result: 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok', database: { connected: true } });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('returns 503 without leaking private exception details', async () => {
    vi.mocked(db.$queryRaw).mockRejectedValue(new Error('private-database-host-and-password'));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private-database');
  });
  it('rejects readiness when a critical table or column is missing despite connectivity', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ result: 1 }]);
    vi.mocked(db.crmCourse.findFirst).mockRejectedValue(new Error('private missing-column SQL'));
    const response = await GET();
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toMatchObject({ database: { connected: true }, modules: { courses: false, universities: true } });
    expect(JSON.stringify(payload)).not.toContain('missing-column');
  });
  it('liveness never claims database readiness', async () => {
    const response = await live();
    expect(await response.json()).toEqual({ status: 'alive' });
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
});
