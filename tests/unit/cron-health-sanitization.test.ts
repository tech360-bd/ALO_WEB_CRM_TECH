import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  whatsappCount: vi.fn(),
  slaCount: vi.fn(),
  followUpCount: vi.fn(),
  retryCount: vi.fn(),
  webhookCount: vi.fn(),
  cronFindMany: vi.fn(),
  requireCron: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: mocks.queryRaw,
    whatsAppOfficialNumber: { count: mocks.whatsappCount },
    communicationThread: { count: mocks.slaCount },
    whatsAppFollowUpSchedule: { count: mocks.followUpCount },
    whatsAppRetryQueue: { count: mocks.retryCount },
    webhookEvent: { count: mocks.webhookCount },
    cronJobLog: { findMany: mocks.cronFindMany },
  },
}));
vi.mock('@/lib/cron-auth', () => ({ requireCron: mocks.requireCron }));

import { GET } from '@/app/api/cron/health/route';

const request = () => new Request('https://example.invalid/api/cron/health');

describe('cron health database diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCron.mockResolvedValue(null);
    mocks.queryRaw.mockResolvedValue([{ result: 1 }]);
    mocks.whatsappCount.mockResolvedValue(0);
    mocks.slaCount.mockResolvedValue(0);
    mocks.followUpCount.mockResolvedValue(0);
    mocks.retryCount.mockResolvedValue(0);
    mocks.webhookCount.mockResolvedValue(0);
    mocks.cronFindMany.mockResolvedValue([]);
  });

  it('returns 503 and no raw connection details when the database probe fails', async () => {
    mocks.queryRaw.mockRejectedValue(Object.assign(new Error('private host and password'), { code: 'P1000' }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.checks).toMatchObject({ database: 'unavailable', metrics: 'not_checked', whatsappNumbers: null, recentCrons: null });
    expect(JSON.stringify(body)).not.toContain('private host and password');
    expect(log).toHaveBeenCalledWith('[cron-health] Database readiness probe failed.', { code: 'P1000' });
  });

  it('returns ready only when the database and all metrics queries succeed', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toMatchObject({ status: 'healthy', checks: { database: 'healthy', metrics: 'healthy' } });
    expect(mocks.cronFindMany).toHaveBeenCalledWith(expect.objectContaining({
      select: {
        id: true,
        jobName: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
      },
    }));
  });
});
