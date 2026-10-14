import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CRON_JOBS, REQUIRED_ENABLED_JOB_IDS, verifyCronDefinitions } from '@/cron/cron-definitions';
import { getRegisteredJob, JOB_REGISTRY, REQUIRED_JOB_KEYS, toRuntimeJob } from '@/lib/cron/job-registry';
vi.mock('@/lib/cron-auth', () => ({ requireCron: vi.fn().mockResolvedValue(null) }));
import { GET } from '@/app/api/cron/weekly-university-scan/route';

/**
 * Scheduler certification (2026-10-13).
 *
 * This file previously asserted `CRON_JOBS.every(job => !job.enabled)` — the
 * quarantine that held while 14 of the 15 declared route paths had no file on
 * disk and the worker's lock could not exclude a second runner. The stronger
 * invariant is asserted now: a declaration may be enabled only when the job
 * registry resolves it to real work, and a declaration that is not enabled must
 * state why. The incomplete-scan quarantine below is unchanged.
 */
describe('scheduler certification', () => {
  it('enables only declarations that resolve to real work', () => {
    expect(CRON_JOBS).toHaveLength(21);
    for (const job of CRON_JOBS) {
      const entry = getRegisteredJob(job.id) ?? getRegisteredJob(job.route.replace('/api/cron/', ''));
      expect(entry, `${job.id} must resolve in the job registry`).toBeTruthy();
      if (job.enabled) {
        expect(entry!.disposition, `${job.id} is enabled but is not a real job`).toBe('job');
      } else {
        expect((job.blockedReason ?? '').length, `${job.id} is disabled without a reason`).toBeGreaterThan(20);
      }
    }
    expect(verifyCronDefinitions().ok).toBe(true);
  });

  it('exposes every job the platform requires', () => {
    for (const key of REQUIRED_JOB_KEYS) {
      const entry = getRegisteredJob(key);
      expect(entry, key).toBeTruthy();
      expect(entry!.disposition, key).toBe('job');
      expect(typeof entry!.handler, key).toBe('function');
    }
    for (const key of REQUIRED_ENABLED_JOB_IDS) {
      expect(CRON_JOBS.find((job) => job.id === key)?.enabled, `${key} must be enabled`).toBe(true);
    }
  });

  it('keeps jobs whose work belongs to another implementation quarantined', () => {
    const quarantined = JOB_REGISTRY.filter((job) => job.disposition !== 'job');
    expect(quarantined.length).toBeGreaterThan(0);
    for (const job of quarantined) {
      expect((job.reason ?? '').length, `${job.key} must state why it does not run`).toBeGreaterThan(20);
      // The runtime form must refuse before any handler can be reached.
      const runtime = toRuntimeJob(job);
      expect(
        Boolean(runtime.externalDependency || runtime.supersededBy),
        `${job.key} must be blocked at runtime`,
      ).toBe(true);
      expect(job.handler, `${job.key} must have no real handler`).toBeUndefined();
    }
  });

  it('keeps the worker honouring the enabled flag', () => {
    const worker = readFileSync('src/cron/worker.ts', 'utf8');
    expect(worker).toContain('if (!definition.enabled) continue;');
    expect(worker).toContain('runCronJob');
    expect(worker).not.toContain('deploymentSequence');
  });

  it('serves every path declared to the external scheduler', () => {
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path: string }>;
    };
    const unresolved = (vercel.crons ?? [])
      .map((cron) => cron.path)
      .filter((apiPath) => {
        const segment = apiPath.replace('/api/cron/', '');
        if (getRegisteredJob(segment)) return false;
        try {
          readFileSync(`src/app${apiPath}/route.ts`, 'utf8');
          return false;
        } catch {
          return true;
        }
      });
    expect(unresolved).toEqual([]);
  });

  it('does not fabricate a scan, evidence or completed run for authenticated callers', async () => {
    const response = await GET(new Request('https://example.com/api/cron/weekly-university-scan'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, status: 'DISABLED' });
    expect(readFileSync('src/app/api/cron/weekly-university-scan/route.ts', 'utf8')).not.toMatch(/db\.|Math.random/);
  });
});
