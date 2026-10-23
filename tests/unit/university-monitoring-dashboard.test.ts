import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ db: {} as any, guard: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('@/lib/university-monitoring-auth', () => ({ requireMonitoringViewer: m.guard }));
import { GET } from '@/app/api/university-monitoring/dashboard/route';
const request = () => new NextRequest('https://alo.test/api/university-monitoring/dashboard');
beforeEach(() => {
  vi.resetAllMocks(); m.guard.mockResolvedValue({ ok: true });
  for (const name of ['monitoringJob', 'verificationRun', 'approvalQueueItem', 'dataChange', 'dataConflict', 'officialSource', 'crmUniversity', 'crmCourse', 'universityFaculty', 'officialDocument']) {
    m.db[name] = { count: vi.fn(async () => 0), findUnique: vi.fn(async () => null), findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) };
  }
});
describe('evidence-aware monitoring dashboard', () => {
  it('never labels a fresh installation with no monitoring evidence healthy', async () => {
    const body = await (await GET(request())).json(); expect(body.health).toBe('NEEDS_REVIEW'); expect(body.evidenceNotice).toContain('not independently completed');
  });
  it('uses canonical CRM record counts rather than a separate page database', async () => {
    await GET(request()); expect(m.db.crmUniversity.count).toHaveBeenCalledTimes(3); expect(m.db.crmCourse.count).toHaveBeenCalledTimes(2);
  });
  it('labels a partial run needs-review even when there are no critical changes', async () => {
    m.db.monitoringJob.findUnique.mockResolvedValue({ lastRunId: 'synthetic-run', lastRunStatus: 'PARTIAL' });
    m.db.verificationRun.findUnique.mockResolvedValue({ status: 'PARTIAL', sourcesChecked: 2 });
    expect((await (await GET(request())).json()).health).toBe('NEEDS_REVIEW');
  });
  it('shows running only for a live lease, and error for an expired lease', async () => {
    m.db.monitoringJob.findUnique.mockResolvedValue({ lastRunId: 'synthetic-run', lastRunStatus: 'RUNNING', lockExpiresAt: new Date(Date.now() + 60000) });
    m.db.verificationRun.findUnique.mockResolvedValue({ status: 'RUNNING' });
    expect((await (await GET(request())).json()).health).toBe('RUNNING');
    m.db.monitoringJob.findUnique.mockResolvedValue({ lastRunId: 'synthetic-run', lastRunStatus: 'RUNNING', lockExpiresAt: new Date(0) });
    expect((await (await GET(request())).json()).health).toBe('ERROR');
  });
});
