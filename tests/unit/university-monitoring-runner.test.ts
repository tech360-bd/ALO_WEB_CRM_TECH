import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ db: {} as any, cycle: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('@/lib/university-monitoring-engine', () => ({ runMonitoringCycle: m.cycle }));
import { startMonitoringRun, MONITORING_JOB_ID } from '@/lib/university-monitoring-runner';
let job: any;
let runs: any[];
const counts = { sourcesChecked: 1, universitiesChecked: 1, coursesChecked: 0, sourcesDeferred: 0, failedSources: 0, changesDetected: 0, criticalChanges: 0, conflicts: 0 };
function apply(data: any) { for (const [key, value] of Object.entries(data)) job[key] = value && typeof value === 'object' && 'increment' in value ? (job[key] || 0) + (value as any).increment : value; }
beforeEach(() => {
  vi.resetAllMocks(); runs = [];
  job = { id: 'job-row', jobId: MONITORING_JOB_ID, enabled: true, nextRunAt: new Date(0), lockedBy: null, lockExpiresAt: null, maxRetries: 3, retryDelayMs: 60000, lastRunStatus: null };
  const updateMany = vi.fn(async ({ where, data }: any) => {
    if (where.lockedBy !== undefined && where.lockedBy !== job.lockedBy) return { count: 0 };
    if (where.OR && job.lockedBy && job.lockExpiresAt > new Date()) return { count: 0 };
    if (where.lockExpiresAt?.gt && (!job.lockExpiresAt || job.lockExpiresAt <= where.lockExpiresAt.gt)) return { count: 0 };
    apply(data); return { count: 1 };
  });
  const jobs = { upsert: vi.fn(async () => ({ ...job })), findUnique: vi.fn(async () => ({ ...job })), updateMany, update: vi.fn(async ({ data }: any) => { apply(data); return { ...job }; }) };
  const verificationRun = { create: vi.fn(async ({ data }: any) => { const run = { id: `run-${runs.length + 1}`, ...data }; runs.push(run); return run; }), update: vi.fn(async ({ where, data }: any) => { Object.assign(runs.find((run) => run.id === where.id), data); return data; }), updateMany: vi.fn(async () => ({ count: 1 })), findUnique: vi.fn(async ({ where }: any) => runs.find((run) => run.id === where.id)) };
  Object.assign(m.db, { monitoringJob: jobs, verificationRun, monitoringLog: { create: vi.fn(async () => ({})) }, auditLog: { create: vi.fn(async () => ({})) }, $transaction: vi.fn(async (fn: any) => fn({ monitoringJob: jobs, verificationRun, monitoringLog: m.db.monitoringLog })) });
  m.cycle.mockResolvedValue({ counts, aiReportSummary: 'Synthetic test counters, not researched facts.' });
});
describe('durable monitoring job runner with mocked persistence', () => {
  it('does no work for disabled or not-due jobs', async () => {
    job.enabled = false; expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('DISABLED');
    job.enabled = true; job.nextRunAt = new Date(Date.now() + 86400000); expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('NOT_DUE'); expect(m.cycle).not.toHaveBeenCalled();
  });
  it('records the run, releases the lease, persists a seven-day schedule and report audit', async () => {
    const before = Date.now();
    expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('COMPLETED');
    expect(job.lockedBy).toBeNull(); expect(job.nextRunAt.getTime()).toBeGreaterThanOrEqual(before + 7 * 86400000);
    expect(runs[0].status).toBe('COMPLETED'); expect(m.db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'UNIVERSITY_MONITORING_REPORT_GENERATED' }) });
  });
  it('does not let a concurrent scheduler enter while another run owns the lease', async () => {
    let finish!: (value: unknown) => void;
    m.cycle.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const first = startMonitoringRun({ trigger: 'SCHEDULER' });
    await vi.waitFor(() => expect(m.cycle).toHaveBeenCalledTimes(1));
    expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('LOCKED');
    finish({ counts, aiReportSummary: 'Synthetic result' }); await first; expect(runs).toHaveLength(1);
  });
  it('schedules a retry for failed work and preserves its error/run record', async () => {
    const before = Date.now(); m.cycle.mockRejectedValue(new Error('Synthetic failure'));
    expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('FAILED');
    expect(runs[0]).toMatchObject({ status: 'FAILED', retryCount: 1, errorMessage: 'Synthetic failure' });
    expect(job.nextRunAt.getTime()).toBeLessThan(before + 120000); expect(job.lockedBy).toBeNull();
  });
  it('retries initialization failure promptly instead of postponing it for seven days', async () => {
    m.db.$transaction.mockRejectedValue(new Error('Synthetic initialization failure'));
    const before = Date.now(); expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('FAILED');
    expect(job.nextRunAt.getTime()).toBeLessThan(before + 120000); expect(job.lockedBy).toBeNull();
  });
  it('labels empty coverage PARTIAL rather than claiming verification', async () => {
    m.cycle.mockResolvedValue({ counts: { ...counts, sourcesChecked: 0 }, aiReportSummary: 'No sources checked.' });
    expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('PARTIAL'); expect(runs[0].status).toBe('PARTIAL');
  });
  it('reclaims an expired lease and marks its abandoned run failed before starting', async () => {
    job.lockedBy = 'crashed-owner'; job.lockExpiresAt = new Date(0); job.lastRunId = 'abandoned'; job.lastRunStatus = 'RUNNING';
    expect((await startMonitoringRun({ trigger: 'SCHEDULER' })).status).toBe('COMPLETED');
    expect(m.db.verificationRun.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'abandoned', status: 'RUNNING' }, data: expect.objectContaining({ status: 'FAILED' }) }));
  });
});
