// "What needs attention?" engine contracts (spec s108, s85, s91, s94).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    application: { count: vi.fn(), findMany: vi.fn() },
    visaCase: { count: vi.fn(), findMany: vi.fn() },
    applicationDocument: { count: vi.fn(), findMany: vi.fn() },
    portalStudentProfile: { findMany: vi.fn() },
    commission: { count: vi.fn(), findMany: vi.fn() },
    lead: { count: vi.fn(), findMany: vi.fn() },
    partnerProfile: { count: vi.fn(), findMany: vi.fn() },
    cronJobLog: { count: vi.fn(), findMany: vi.fn() },
    webhookDelivery: { count: vi.fn(), findMany: vi.fn() },
    applicationRiskAssessment: { findMany: vi.fn() },
    attentionSnapshot: { create: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import { buildAttentionReport } from '@/lib/intelligence/attention-engine';

const NOW = new Date('2026-10-18T00:00:00.000Z');

/** Every count returns n, every findMany returns n id rows. */
function stubCounts(value: number) {
  const models = [
    db.application,
    db.visaCase,
    db.applicationDocument,
    db.commission,
    db.lead,
    db.partnerProfile,
    db.cronJobLog,
    db.webhookDelivery,
  ] as unknown as Array<Record<string, ReturnType<typeof vi.fn>>>;
  const allRows = Array.from({ length: value }, (_, index) => ({ id: `row-${index}`, partnerId: `p-${index}` }));
  for (const model of models) {
    (model.count as ReturnType<typeof vi.fn>).mockResolvedValue(value);
    // Honour `take` the way Prisma does, so sample bounds are actually asserted.
    (model.findMany as ReturnType<typeof vi.fn>).mockImplementation(
      async (args: { take?: number }) => allRows.slice(0, args?.take ?? allRows.length),
    );
  }
  (db.portalStudentProfile.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.applicationRiskAssessment.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.attentionSnapshot.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'snap-1' });
}

beforeEach(() => {
  vi.clearAllMocks();
  stubCounts(0);
});

describe('Report shape (s108)', () => {
  it('returns every operational bucket the specification names', async () => {
    const report = await buildAttentionReport({ now: NOW });
    const keys = report.buckets.map((bucket) => bucket.key);
    for (const required of [
      'urgent_applications',
      'visa_deadlines',
      'missing_documents',
      'partner_issues',
      'unpaid_commissions',
      'untouched_leads',
      'expiring_documents',
      'failed_automations',
    ]) {
      expect(keys).toContain(required);
    }
  });

  it('gives every bucket a link, a severity, a description and a status', async () => {
    stubCounts(3);
    const report = await buildAttentionReport({ now: NOW });
    for (const bucket of report.buckets) {
      expect(bucket.linkTo).toMatch(/^\//);
      expect(['INFO', 'WARNING', 'URGENT', 'CRITICAL']).toContain(bucket.severity);
      expect(bucket.description.length).toBeGreaterThan(10);
      expect(['OK', 'ERROR']).toContain(bucket.status);
      expect(typeof bucket.count).toBe('number');
      expect(Array.isArray(bucket.sample)).toBe(true);
    }
  });

  it('uses the severity vocabulary from s85 with visa deadlines above INFO', async () => {
    const report = await buildAttentionReport({ now: NOW });
    const byKey = Object.fromEntries(report.buckets.map((bucket) => [bucket.key, bucket.severity]));
    expect(byKey.visa_deadlines).toBe('URGENT');
    expect(byKey.urgent_applications).toBe('CRITICAL');
    expect(byKey.failed_automations).toBe('CRITICAL');
    expect(byKey.missing_documents).toBe('WARNING');
  });

  it('sorts the most severe non-empty buckets first', async () => {
    stubCounts(2);
    const report = await buildAttentionReport({ now: NOW });
    const rank: Record<string, number> = { CRITICAL: 0, URGENT: 1, WARNING: 2, INFO: 3 };
    const ranks = report.buckets.map((bucket) => rank[bucket.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('totals the counts by severity', async () => {
    stubCounts(4);
    const report = await buildAttentionReport({ now: NOW });
    const manualTotal = report.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(report.totals.total).toBe(manualTotal);
    expect(
      report.totals.critical + report.totals.urgent + report.totals.warning + report.totals.info,
    ).toBe(manualTotal);
  });
});

describe('Honesty — a failed bucket never reads as zero (s91, s94)', () => {
  it('marks a bucket ERROR with the reason when its query throws', async () => {
    (db.lead.count as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('lead table locked'));
    const report = await buildAttentionReport({ now: NOW });
    const leads = report.buckets.find((bucket) => bucket.key === 'untouched_leads')!;
    expect(leads.status).toBe('ERROR');
    expect(leads.error).toMatch(/lead table locked/);
    expect(leads.count).toBe(0);
    expect(report.totals.errored).toBe(1);
  });

  it('still returns the other buckets when one fails', async () => {
    (db.commission.count as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const report = await buildAttentionReport({ now: NOW });
    expect(report.buckets.filter((bucket) => bucket.status === 'OK').length).toBeGreaterThan(5);
    expect(report.buckets.find((bucket) => bucket.key === 'unpaid_commissions')!.status).toBe('ERROR');
  });

  it('reports a real zero as OK, not as an error', async () => {
    const report = await buildAttentionReport({ now: NOW });
    for (const bucket of report.buckets) {
      if (bucket.count === 0) expect(bucket.status).toBe('OK');
    }
    expect(report.totals.errored).toBe(0);
  });
});

describe('Queries are real and bounded', () => {
  it('asks for a bounded sample of real record ids', async () => {
    stubCounts(50);
    const report = await buildAttentionReport({ now: NOW, sampleSize: 3 });
    for (const bucket of report.buckets) {
      expect(bucket.sample.length).toBeLessThanOrEqual(3);
    }
  });

  it('clamps an absurd sample size', async () => {
    stubCounts(5);
    await buildAttentionReport({ now: NOW, sampleSize: 100000 });
    const take = (db.lead.findMany as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].take;
    expect(take).toBeLessThanOrEqual(50);
  });

  it('counts only NEW leads older than the untouched threshold', async () => {
    await buildAttentionReport({ now: NOW, untouchedLeadHours: 48 });
    const where = (db.lead.count as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].where;
    expect(where.status).toBe('NEW');
    expect(where.createdAt.lt.toISOString()).toBe('2026-10-16T00:00:00.000Z');
  });

  it('looks for visa deadlines inside the next seven days only', async () => {
    await buildAttentionReport({ now: NOW });
    const where = (db.visaCase.count as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].where;
    expect(where.deadline.gte.toISOString()).toBe(NOW.toISOString());
    expect(where.deadline.lte.toISOString()).toBe('2026-10-25T00:00:00.000Z');
    expect(where.currentStage.notIn).toContain('granted');
  });

  it('excludes closed applications from the urgent queue', async () => {
    await buildAttentionReport({ now: NOW });
    const where = (db.application.count as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].where;
    expect(where.stage.notIn).toEqual(
      expect.arrayContaining(['REJECTED', 'WITHDRAWN', 'DEFERRED', 'CLOSED']),
    );
  });

  it('counts unsettled commissions, not settled ones', async () => {
    await buildAttentionReport({ now: NOW });
    const where = (db.commission.count as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].where;
    expect(where.status.in).toEqual(
      expect.arrayContaining(['DUE', 'VERIFIED', 'REQUESTED', 'INVOICED', 'APPROVED', 'SENT']),
    );
    expect(where.status.in).not.toContain('RECEIVED');
    expect(where.status.in).not.toContain('RECONCILED');
    expect(where.status.in).not.toContain('CLOSED');
  });

  it('counts only failed jobs from the last 24 hours', async () => {
    await buildAttentionReport({ now: NOW });
    const where = (db.cronJobLog.count as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].where;
    expect(where.status).toBe('failed');
    expect(where.startedAt.gte.toISOString()).toBe('2026-10-17T00:00:00.000Z');
  });
});

describe('Expiring documents combine two real sources', () => {
  it('adds passports expiring inside 60 days to expired documents', async () => {
    (db.portalStudentProfile.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', passportExpiry: '2026-11-01' }, // inside 60 days
      { id: 'p2', passportExpiry: '2027-06-01' }, // outside
      { id: 'p3', passportExpiry: '2026-01-01' }, // already expired
      { id: 'p4', passportExpiry: 'not-a-date' }, // unparseable
      { id: 'p5', passportExpiry: '' }, // empty
    ]);
    (db.applicationDocument.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    const report = await buildAttentionReport({ now: NOW });
    const bucket = report.buckets.find((b) => b.key === 'expiring_documents')!;
    // 2 expired application documents + 1 passport expiring in-window.
    expect(bucket.count).toBe(3);
  });

  it('ignores an unparseable expiry rather than treating it as urgent', async () => {
    (db.portalStudentProfile.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'p1', passportExpiry: 'garbage' },
    ]);
    const report = await buildAttentionReport({ now: NOW });
    const bucket = report.buckets.find((b) => b.key === 'expiring_documents')!;
    expect(bucket.sample.some((id) => id.includes('p1'))).toBe(false);
  });
});

describe('Red-risk applications use only the LATEST assessment', () => {
  it('ignores a RED assessment that a newer non-RED one supersedes', async () => {
    (db.applicationRiskAssessment.findMany as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([
        { applicationId: 'app-1', createdAt: new Date('2026-10-01') },
        { applicationId: 'app-2', createdAt: new Date('2026-10-01') },
      ])
      .mockResolvedValueOnce([
        { applicationId: 'app-1', createdAt: new Date('2026-10-10') }, // newer, not RED
      ]);

    const report = await buildAttentionReport({ now: NOW });
    const bucket = report.buckets.find((b) => b.key === 'red_risk_applications')!;
    expect(bucket.count).toBe(1);
    expect(bucket.sample).toEqual(['app-2']);
  });

  it('reports zero when nothing has been assessed', async () => {
    const report = await buildAttentionReport({ now: NOW });
    const bucket = report.buckets.find((b) => b.key === 'red_risk_applications')!;
    expect(bucket.count).toBe(0);
    expect(bucket.status).toBe('OK');
  });
});

describe('Snapshot persistence is optional and non-fatal', () => {
  it('does not persist unless asked', async () => {
    await buildAttentionReport({ now: NOW });
    expect(db.attentionSnapshot.create).not.toHaveBeenCalled();
  });

  it('persists a snapshot when requested', async () => {
    await buildAttentionReport({ now: NOW, persist: true, scope: 'BRANCH', scopeId: 'DHK' });
    expect(db.attentionSnapshot.create).toHaveBeenCalledTimes(1);
    const data = (db.attentionSnapshot.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data.scope).toBe('BRANCH');
    expect(data.scopeId).toBe('DHK');
    expect(JSON.parse(data.buckets).length).toBeGreaterThan(0);
  });

  it('still returns the report when persistence fails', async () => {
    (db.attentionSnapshot.create as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('disk full'));
    const report = await buildAttentionReport({ now: NOW, persist: true });
    expect(report.buckets.length).toBeGreaterThan(0);
  });
});
