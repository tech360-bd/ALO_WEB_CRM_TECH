/**
 * Contact dashboard — metric definitions (Phase 2 §6).
 *
 * The dashboard is only trustworthy if the sixteen metrics cannot silently become
 * zero, disappear, or leak another branch's data. These tests pin exactly that.
 */

import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_METRICS,
  buildDashboardMetrics,
  dashboardCaveats,
  resolveBranchFilter,
  resolveDateRange,
  type MetricKey,
  type MetricInputs,
} from '@/lib/contacts/dashboard-metrics';

const ALL_KEYS: MetricKey[] = [
  'contacts_total', 'contacts_new_in_range', 'contacts_linked_to_student', 'contacts_lead_only',
  'contacts_unlinked', 'contacts_opted_out', 'contacts_blocked', 'alias_contacts', 'duplicate_groups',
  'match_reviews_pending', 'messages_inbound', 'messages_outbound', 'conversations_active',
  'follow_ups_scheduled', 'follow_ups_overdue', 'student_link_coverage',
];

function fullInputs(overrides: MetricInputs = {}): MetricInputs {
  const inputs: MetricInputs = {};
  for (const key of ALL_KEYS) inputs[key] = { value: 10 };
  return { ...inputs, ...overrides };
}

describe('definitions', () => {
  it('defines exactly sixteen metrics, in a fixed order, with no duplicates', () => {
    expect(DASHBOARD_METRICS).toHaveLength(16);
    expect(DASHBOARD_METRICS.map((metric) => metric.key)).toEqual(ALL_KEYS);
    expect(new Set(DASHBOARD_METRICS.map((metric) => metric.key)).size).toBe(16);
  });

  it('gives every metric a definition and a database source', () => {
    for (const metric of DASHBOARD_METRICS) {
      expect(metric.definition.length).toBeGreaterThan(20);
      expect(metric.source.length).toBeGreaterThan(3);
      expect(metric.label.length).toBeGreaterThan(3);
    }
  });

  it('marks which metrics depend on the date range and which are current state', () => {
    const rangeScoped = DASHBOARD_METRICS.filter((metric) => metric.rangeScoped).map((metric) => metric.key);
    expect(rangeScoped).toEqual(['contacts_new_in_range', 'messages_inbound', 'messages_outbound', 'conversations_active']);
    // Consent state must never be presented as a period count.
    const optedOut = DASHBOARD_METRICS.find((metric) => metric.key === 'contacts_opted_out');
    expect(optedOut?.rangeScoped).toBe(false);
    expect(optedOut?.definition).toMatch(/current state/i);
  });
});

describe('buildDashboardMetrics — no fabricated numbers', () => {
  it('publishes every metric even when a reading is missing, as UNAVAILABLE with a reason', () => {
    const metrics = buildDashboardMetrics({ contacts_total: { value: 5 } });
    expect(metrics).toHaveLength(16);
    const missing = metrics.filter((metric) => metric.status === 'UNAVAILABLE');
    expect(missing.length).toBe(15);
    expect(missing[0].value).toBeNull();
    expect(missing[0].reason).toBeTruthy();
  });

  it('never turns a failed query into zero', () => {
    const metrics = buildDashboardMetrics(fullInputs({
      contacts_blocked: { value: null, reason: 'Blocked contacts could not be read from the database.' },
    }));
    const blocked = metrics.find((metric) => metric.key === 'contacts_blocked');
    expect(blocked?.value).toBeNull();
    expect(blocked?.status).toBe('UNAVAILABLE');
    expect(blocked?.reason).toMatch(/could not be read/i);
  });

  it('passes readings through unchanged when they are available', () => {
    const metrics = buildDashboardMetrics(fullInputs({ contacts_total: { value: 4321 }, messages_inbound: { value: 77 } }));
    expect(metrics.find((metric) => metric.key === 'contacts_total')?.value).toBe(4321);
    expect(metrics.find((metric) => metric.key === 'messages_inbound')?.value).toBe(77);
    expect(metrics.every((metric) => metric.status === 'OK' || metric.key === 'student_link_coverage')).toBe(true);
  });

  it('computes student link coverage from the two readings, rounded to one decimal', () => {
    const metrics = buildDashboardMetrics(fullInputs({
      contacts_total: { value: 300 },
      contacts_linked_to_student: { value: 101 },
    }));
    const coverage = metrics.find((metric) => metric.key === 'student_link_coverage');
    expect(coverage?.value).toBe(33.7);
    expect(coverage?.unit).toBe('percent');
  });

  it('reports coverage as null (not 0%) when there are no contacts', () => {
    const metrics = buildDashboardMetrics(fullInputs({
      contacts_total: { value: 0 },
      contacts_linked_to_student: { value: 0 },
    }));
    const coverage = metrics.find((metric) => metric.key === 'student_link_coverage');
    expect(coverage?.value).toBeNull();
    expect(coverage?.reason).toMatch(/no coverage figure/i);
  });

  it('reports coverage as UNAVAILABLE when either input failed', () => {
    const metrics = buildDashboardMetrics(fullInputs({
      contacts_total: { value: null, reason: 'failed' },
    }));
    const coverage = metrics.find((metric) => metric.key === 'student_link_coverage');
    expect(coverage?.status).toBe('UNAVAILABLE');
    expect(coverage?.value).toBeNull();
  });

  it('rejects a NaN reading rather than publishing it', () => {
    const metrics = buildDashboardMetrics(fullInputs({ contacts_opted_out: { value: Number.NaN } }));
    expect(metrics.find((metric) => metric.key === 'contacts_opted_out')?.status).toBe('UNAVAILABLE');
  });
});

describe('resolveDateRange', () => {
  const now = new Date('2026-11-15T12:00:00.000Z');

  it('defaults to the last 90 days and says so', () => {
    const range = resolveDateRange(null, null, now);
    expect(range.defaulted).toBe(true);
    expect(range.days).toBe(90);
    expect(range.toIso).toBe(now.toISOString());
  });

  it('accepts an explicit range', () => {
    const range = resolveDateRange('2026-01-01', '2026-01-31', now);
    expect(range.defaulted).toBe(false);
    expect(range.days).toBe(30);
    expect(range.fromIso.startsWith('2026-01-01')).toBe(true);
  });

  it('refuses a reversed range instead of returning an empty dashboard', () => {
    expect(() => resolveDateRange('2026-02-01', '2026-01-01', now)).toThrow(/start must be before/i);
  });

  it('clamps an absurd range and states the adjustment', () => {
    const range = resolveDateRange('2020-01-01', '2026-11-15', now);
    expect(range.days).toBe(366);
    expect(range.adjustment).toMatch(/limited to the most recent 366 days/i);
  });

  it('ignores unparseable dates by falling back to the default window', () => {
    const range = resolveDateRange('not-a-date', 'also-not', now);
    expect(range.defaulted).toBe(true);
    expect(range.days).toBe(90);
  });
});

describe('resolveBranchFilter — a parameter must never widen visibility', () => {
  it('pins a branch user to their own branch and ignores a different request', () => {
    const decision = resolveBranchFilter({ requestedBranch: 'Sylhet', callerBranch: 'Dhaka', companyWide: false });
    expect(decision.branch).toBe('Dhaka');
    expect(decision.forced).toBe(true);
    expect(decision.reason).toMatch(/ignored/i);
  });

  it('honours a branch request only for company-wide access', () => {
    const decision = resolveBranchFilter({ requestedBranch: 'Sylhet', callerBranch: null, companyWide: true });
    expect(decision.branch).toBe('Sylhet');
    expect(decision.forced).toBe(false);
  });

  it('reports all branches for company-wide access with no filter', () => {
    const decision = resolveBranchFilter({ requestedBranch: '', callerBranch: 'Dhaka', companyWide: true });
    expect(decision.branch).toBeNull();
    expect(decision.applied).toBe(false);
    expect(decision.reason).toMatch(/all branches/i);
  });

  it('falls back to assignment scope when the caller has no branch', () => {
    const decision = resolveBranchFilter({ requestedBranch: 'Sylhet', callerBranch: null, companyWide: false });
    expect(decision.branch).toBeNull();
    expect(decision.reason).toMatch(/assignment scope/i);
  });
});

describe('caveats', () => {
  it('states the sampling limit and the null rule', () => {
    const caveats = dashboardCaveats({ sampled: true, sampleSize: 1000, unavailable: ['duplicate_groups'] });
    expect(caveats.join(' ')).toMatch(/null means the query could not be completed/i);
    expect(caveats.join(' ')).toMatch(/most recent 1000 contacts/i);
    expect(caveats.join(' ')).toMatch(/duplicate_groups/);
  });

  it('omits the sampling caveat when the whole registry was read', () => {
    const caveats = dashboardCaveats({ sampled: false, sampleSize: 0, unavailable: [] });
    expect(caveats.join(' ')).not.toMatch(/most recent/i);
    expect(caveats.join(' ')).not.toMatch(/Unavailable in this response/i);
  });
});
