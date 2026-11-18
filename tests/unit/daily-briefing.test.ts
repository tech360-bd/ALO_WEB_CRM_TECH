// Daily management briefing engine contracts (spec s109, s91, s93, s85).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    lead: { count: vi.fn(), findMany: vi.fn() },
    application: { count: vi.fn(), findMany: vi.fn() },
    applicationOffer: { count: vi.fn(), findMany: vi.fn() },
    payment: { count: vi.fn(), aggregate: vi.fn() },
    visaCase: { count: vi.fn(), findMany: vi.fn() },
    task: { count: vi.fn() },
    appointment: { count: vi.fn() },
    scholarship: { count: vi.fn() },
    courseIntake: { count: vi.fn() },
    commission: { count: vi.fn(), findMany: vi.fn(), aggregate: vi.fn() },
    partnerProfile: { count: vi.fn(), findMany: vi.fn() },
    cronJobLog: { count: vi.fn(), findMany: vi.fn() },
    webhookDelivery: { count: vi.fn(), findMany: vi.fn() },
    applicationDocument: { count: vi.fn(), findMany: vi.fn() },
    portalStudentProfile: { findMany: vi.fn() },
    applicationRiskAssessment: { findMany: vi.fn() },
    attentionSnapshot: { create: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import { buildDailyBriefing } from '@/lib/intelligence/daily-briefing';

const NOW = new Date('2026-11-16T12:00:00.000Z');

function stubAllZero() {
  const counters = [
    db.lead, db.application, db.applicationOffer, db.payment, db.visaCase, db.task,
    db.appointment, db.scholarship, db.courseIntake, db.commission, db.partnerProfile,
    db.cronJobLog, db.webhookDelivery, db.applicationDocument,
  ] as unknown as Array<Record<string, ReturnType<typeof vi.fn>>>;
  for (const model of counters) {
    for (const key of ['count', 'findMany']) {
      const fn = model[key];
      if (fn) {
        fn.mockResolvedValue(key === 'count' ? 0 : []);
      }
    }
  }
  (db.payment.aggregate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: 0 } });
  (db.commission.aggregate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: 0 } });
  (db.portalStudentProfile.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.applicationRiskAssessment.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (db.attentionSnapshot.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'snap-1' });
}

beforeEach(() => {
  vi.clearAllMocks();
  stubAllZero();
});

describe('Briefing structure (s109)', () => {
  it('returns every section the specification names', async () => {
    const briefing = await buildDailyBriefing({ now: NOW });
    const keys = briefing.sections.map((section) => section.key);
    for (const required of [
      'yesterday', 'today', 'at_risk', 'opportunities', 'revenue_30d',
      'applications', 'visa', 'partners', 'marketing', 'system',
    ]) {
      expect(keys).toContain(required);
    }
  });

  it('uses the requested UTC day and ISO window', async () => {
    const briefing = await buildDailyBriefing({ now: NOW });
    expect(briefing.day).toBe('2026-11-16');
    expect(briefing.generatedAt).toBe(NOW.toISOString());
    expect(Date.parse(briefing.window.yesterdayStart)).toBeLessThan(Date.parse(briefing.window.todayStart));
  });

  it('never invents a section summary and marks every section OK when queries succeed', async () => {
    const briefing = await buildDailyBriefing({ now: NOW });
    for (const section of briefing.sections) {
      expect(section.status).toBe('OK');
      expect(section.summary.length).toBeGreaterThan(10);
    }
  });
});

describe('Live data fidelity (s109, s92)', () => {
  it('renders the database counts verbatim', async () => {
    (db.lead.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(9);
    (db.visaCase.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(4);
    const briefing = await buildDailyBriefing({ now: NOW });

    const yesterday = briefing.sections.find((section) => section.key === 'yesterday');
    expect(yesterday?.stats.find((item) => item.label === 'New leads')?.value).toBe('9');

    const visa = briefing.sections.find((section) => section.key === 'visa');
    expect(visa?.stats.find((item) => item.label === 'Open visa cases')?.value).toBe('4');
  });

  it('renders aggregated payment totals from the database, never a guess', async () => {
    (db.payment.aggregate as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { amount: 12345.5 } })   // yesterday collected
      .mockResolvedValueOnce({ _sum: { amount: 98765 } });    // trailing 30d collected
    const briefing = await buildDailyBriefing({ now: NOW });
    const y = briefing.sections.find((section) => section.key === 'yesterday');
    const r = briefing.sections.find((section) => section.key === 'revenue_30d');
    expect(y?.stats.find((item) => item.label === 'Payments received')?.value).toContain('12,345.5');
    expect(r?.stats.find((item) => item.label === 'Collected (30d)')?.value).toContain('98,765');
  });
});

describe('Failure isolation (s91, s94)', () => {
  it('a failed section reports ERROR with the reason and never renders 0', async () => {
    (db.payment.aggregate as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('connection lost'));
    const briefing = await buildDailyBriefing({ now: NOW });
    const revenue = briefing.sections.find((section) => section.key === 'revenue_30d');
    expect(revenue?.status).toBe('ERROR');
    expect(revenue?.error).toContain('connection lost');
    expect(revenue?.stats).toEqual([]);
    // Independent sections are unaffected.
    const visa = briefing.sections.find((section) => section.key === 'visa');
    expect(visa?.status).toBe('OK');
  });

  it('attention engine failures degrade inside the at_risk section only', async () => {
    (db.application.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    // Make only the attention path explode: its visa bucket uses deadline `lte`.
    (db.visaCase.count as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('visa table locked'))   // attention bucket 2
      .mockResolvedValue(2);                                    // other callers
    const briefing = await buildDailyBriefing({ now: NOW });
    expect(briefing.sections.map((section) => section.key)).toContain('at_risk');
    // Even with an internal bucket error, the at_risk section computes.
    const atRisk = briefing.sections.find((section) => section.key === 'at_risk');
    expect(atRisk?.status).toBe('OK');
  });
});

describe('Honest reporting (s93, s105)', () => {
  it('produces deterministic highlights derived from the same numbers', async () => {
    (db.lead.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(11);
    const briefing = await buildDailyBriefing({ now: NOW });
    expect(briefing.highlights.some((line) => line.includes('11 new leads'))).toBe(true);
  });

  it('omits a highlight when its section failed instead of guessing', async () => {
    (db.lead.count as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('lead table unavailable'));
    const briefing = await buildDailyBriefing({ now: NOW });
    expect(briefing.highlights.some((line) => line.includes('new leads were recorded yesterday'))).toBe(false);
  });

  it('reports empty source attribution as NO LEADS IN WINDOW, never as a fabricated source', async () => {
    (db.lead.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const briefing = await buildDailyBriefing({ now: NOW });
    const marketing = briefing.sections.find((section) => section.key === 'marketing');
    expect(marketing?.stats.some((item) => item.value === 'NO LEADS IN WINDOW')).toBe(true);
  });
});
