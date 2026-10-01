import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CRON_JOBS } from '@/cron/cron-definitions';
vi.mock('@/lib/cron-auth', () => ({ requireCron: vi.fn().mockResolvedValue(null) }));
import { GET } from '@/app/api/cron/weekly-university-scan/route';
describe('incomplete scheduler quarantine', () => {
  it('keeps all unverified worker definitions disabled and honors the flag', () => {
    expect(CRON_JOBS).toHaveLength(15);
    expect(CRON_JOBS.every(job => !job.enabled)).toBe(true);
    expect(readFileSync('src/cron/worker.ts', 'utf8')).toContain('if (!job.enabled) continue;');
  });
  it('does not fabricate a scan, evidence or completed run for authenticated callers', async () => {
    const response = await GET(new Request('https://example.com/api/cron/weekly-university-scan'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, status: 'DISABLED' });
    expect(readFileSync('src/app/api/cron/weekly-university-scan/route.ts', 'utf8')).not.toMatch(/db\.|Math.random/);
  });
});
