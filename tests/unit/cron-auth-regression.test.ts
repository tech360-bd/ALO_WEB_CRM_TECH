/**
 * ALO Education — cron endpoint authorization regression tests.
 *
 * 2026-09-18 audit finding: all nine `/api/cron/*` routes were reachable by any
 * anonymous caller. Seven had no check at all; two (`sla-monitor`,
 * `weekly-university-scan`) had a guard whose body was empty, so the condition
 * was evaluated and the request proceeded regardless. Because these are plain
 * GET routes, one unauthenticated request could trigger outbound WhatsApp
 * follow-ups, generate reports, drain retry queues or start scraping jobs.
 *
 * These tests import the REAL handlers and the REAL guard. Only `@/lib/db` and
 * `next-auth` are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { dbCalls, dbMock } = vi.hoisted(() => {
  const calls: string[] = [];
  const record = (name: string) => (..._args: unknown[]) => {
    calls.push(name);
    return Promise.resolve(null);
  };
  const many = (name: string) => (..._args: unknown[]) => {
    calls.push(name);
    return Promise.resolve([]);
  };
  return {
    dbCalls: calls,
    dbMock: {
      cronJobLog: { create: record('cronJobLog.create'), update: record('cronJobLog.update') },
      communicationThread: { count: record('communicationThread.count') },
      lead: { count: record('lead.count') },
      socialInboxMessage: { count: record('socialInboxMessage.count') },
      dashboardAlarm: { count: record('dashboardAlarm.count') },
      whatsAppFollowUpSchedule: { count: record('whatsAppFollowUpSchedule.count'), findMany: many('whatsAppFollowUpSchedule.findMany') },
      whatsAppAnalyticsDaily: { findUnique: record('whatsAppAnalyticsDaily.findUnique'), upsert: record('whatsAppAnalyticsDaily.upsert') },
      studentDocument: { count: record('studentDocument.count') },
      student: { count: record('student.count') },
      employee: { findMany: many('employee.findMany') },
      counselorTask: { count: record('counselorTask.count') },
      weeklyReport: { create: record('weeklyReport.create') },
      portalSession: { findUnique: record('portalSession.findUnique') },
      portalStudentProfile: { findFirst: record('portalStudentProfile.findFirst') },
      user: { findUnique: record('user.findUnique') },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: dbMock }));
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
  NextAuth: vi.fn(),
}));

import { requireCron, verifyCronSecret, isCronSecretConfigured } from '@/lib/cron-auth';
import { GET as analyticsGET } from '@/app/api/cron/analytics/route';
import { GET as followupGET } from '@/app/api/cron/followup/route';
import { GET as slaMonitorGET } from '@/app/api/cron/sla-monitor/route';
import { GET as weeklyReportsGET } from '@/app/api/cron/weekly-reports/route';
import { POST as weeklyAiAgentPOST } from '@/app/api/cron/weekly-ai-agent/route';

const SECRET = 'test-cron-secret-value-32-chars-min';
const req = (init?: RequestInit) => new Request('http://localhost/api/cron/x', init);

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  dbCalls.length = 0;
  process.env.ALO_CRON_SECRET = SECRET;
  process.env.NODE_ENV = 'production';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('cron-auth guard', () => {
  it('reports the secret as configured only when it is long enough', () => {
    expect(isCronSecretConfigured()).toBe(true);
    process.env.ALO_CRON_SECRET = 'short';
    expect(isCronSecretConfigured()).toBe(false);
  });

  it('accepts the correct bearer token and rejects a wrong one', () => {
    expect(verifyCronSecret(req({ headers: { authorization: `Bearer ${SECRET}` } }))).toBe(true);
    expect(verifyCronSecret(req({ headers: { authorization: 'Bearer not-the-secret-value-here' } }))).toBe(false);
  });

  it('accepts the x-cron-secret header', () => {
    expect(verifyCronSecret(req({ headers: { 'x-cron-secret': SECRET } }))).toBe(true);
  });

  it('rejects when no secret is configured at all (fail closed)', async () => {
    delete process.env.ALO_CRON_SECRET;
    delete process.env.CRON_SECRET;
    const result = await requireCron(req());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });
});

describe('cron routes reject anonymous callers before touching the database', () => {
  const cases: Array<[string, () => Promise<Response>]> = [
    ['GET /api/cron/analytics', () => analyticsGET(req())],
    ['GET /api/cron/followup', () => followupGET(req())],
    ['GET /api/cron/sla-monitor', () => slaMonitorGET(req())],
    ['GET /api/cron/weekly-reports', () => weeklyReportsGET(req())],
    ['POST /api/cron/weekly-ai-agent', () => weeklyAiAgentPOST(req({ method: 'POST' }))],
  ];

  for (const [label, call] of cases) {
    it(`${label} → 401 with no database access`, async () => {
      const res = await call();
      expect(res.status).toBe(401);
      expect(dbCalls).toEqual([]);
    });
  }

  it('a wrong secret is rejected too', async () => {
    const res = await analyticsGET(req({ headers: { authorization: 'Bearer wrong-secret-value-aaaaaaaaaa' } }));
    expect(res.status).toBe(401);
    // A session lookup is legitimate auth work; the JOB must not have run.
    expect(dbCalls).not.toContain('cronJobLog.create');
    expect(dbCalls).not.toContain('communicationThread.count');
  });
});

describe('cron routes accept an authorized scheduler', () => {
  it('GET /api/cron/analytics proceeds with the correct secret', async () => {
    const res = await analyticsGET(req({ headers: { authorization: `Bearer ${SECRET}` } }));
    // The job runs (db is mocked to nulls, so a 500 from the handler is fine —
    // the point is that it was NOT rejected at the auth boundary).
    expect(res.status).not.toBe(401);
    expect(dbCalls.length).toBeGreaterThan(0);
  });
});
