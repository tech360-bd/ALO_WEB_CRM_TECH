import { describe, it, expect, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { runCoverageMonitoringCycle, COVERAGE_STALE_AFTER_DAYS } from '@/lib/verified-catalogue/monitoring';

interface FakeCoverageRow {
  coverageKey: string;
  courseId: string;
  universityId: string;
  year: number;
  month: number;
  status: string;
  approvalStatus: string;
  published: boolean;
  lastVerifiedAt: Date | null;
  startDate: string;
  feeAmount: number;
  feeCurrency: string;
  evidenceId: string | null;
}

function buildFakePrisma(rows: FakeCoverageRow[], options: { existingRecheck?: boolean } = {}) {
  const created: Array<Record<string, unknown>> = [];
  const courses = [
    {
      courseId: 'ALO-C-demo-course',
      slug: 'demo-course',
      courseTitle: 'Demo Course',
      officialUrl: 'https://www.example.ac.uk/course',
      university: { name: 'Example University', slug: 'example-university', country: 'United Kingdom', website: 'https://www.example.ac.uk/', officialUrl: 'https://www.example.ac.uk/' },
      monthlyCoverage: rows,
    },
  ];
  const prisma = {
    crmCourse: { findMany: vi.fn().mockResolvedValue(courses) },
    crmResearchQueueItem: {
      findUnique: vi.fn().mockResolvedValue(options.existingRecheck ? { id: 'existing' } : null),
      create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: `queue-${created.length}`, ...data };
      }),
      findMany: vi.fn().mockResolvedValue([{ status: 'QUEUED', countrySlug: 'uk' }]),
    },
    approvalQueueItem: { count: vi.fn().mockResolvedValue(2) },
    officialSource: { count: vi.fn().mockResolvedValue(1) },
    crmOfficialEvidence: { count: vi.fn().mockResolvedValue(18) },
    crmAuditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
  };
  return { prisma: prisma as unknown as PrismaClient, created, raw: prisma };
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-29T09:00:00Z');

function row(overrides: Partial<FakeCoverageRow> = {}): FakeCoverageRow {
  return {
    coverageKey: 'demo-course:2027-01',
    courseId: 'ALO-C-demo-course',
    universityId: 'ALO-U-example-university',
    year: 2027,
    month: 1,
    status: 'VERIFIED_AVAILABLE',
    approvalStatus: 'APPROVED',
    published: true,
    lastVerifiedAt: new Date(NOW.getTime() - DAY),
    startDate: '',
    feeAmount: 0,
    feeCurrency: '',
    evidenceId: 'evidence-1',
    ...overrides,
  };
}

describe('7-day coverage monitoring', () => {
  it('flags a course-month that has not been re-verified within the SLA', async () => {
    const { prisma, created } = buildFakePrisma([
      row({ lastVerifiedAt: new Date(NOW.getTime() - (COVERAGE_STALE_AFTER_DAYS + 1) * DAY) }),
      row({ coverageKey: 'demo-course:2027-02', month: 2, lastVerifiedAt: new Date(NOW.getTime() - DAY) }),
    ]);
    const report = await runCoverageMonitoringCycle(prisma, { now: NOW, apply: true });
    expect(report.staleCourseMonths).toHaveLength(1);
    expect(report.staleCourseMonths[0].coverageKey).toBe('demo-course:2027-01');
    expect(created).toHaveLength(1);
    expect(created[0].queueKey).toBe('recheck:demo-course:2027-01');
    expect(report.actionsTaken.recheckItemsCreated).toBe(1);
  });

  it('never duplicates a recheck work item on retry or restart', async () => {
    const { prisma, created } = buildFakePrisma(
      [row({ lastVerifiedAt: new Date(NOW.getTime() - 30 * DAY) })],
      { existingRecheck: true },
    );
    const report = await runCoverageMonitoringCycle(prisma, { now: NOW, apply: true });
    expect(created).toHaveLength(0);
    expect(report.actionsTaken.recheckItemsExisting).toBe(1);
  });

  it('writes nothing in dry-run mode', async () => {
    const { prisma, created, raw } = buildFakePrisma([row({ lastVerifiedAt: null })]);
    const report = await runCoverageMonitoringCycle(prisma, { now: NOW, apply: false });
    expect(report.staleCourseMonths).toHaveLength(1);
    expect(created).toHaveLength(0);
    expect(raw.crmAuditLog.create).not.toHaveBeenCalled();
  });

  it('reports coverage totals and never invents missing months', async () => {
    const { prisma } = buildFakePrisma([row(), row({ coverageKey: 'demo-course:2027-02', month: 2, status: 'VERIFIED_NOT_OFFERED' })]);
    const report = await runCoverageMonitoringCycle(prisma, { now: NOW, apply: false });
    expect(report.window).toHaveLength(13);
    expect(report.totals.VERIFIED_AVAILABLE).toBe(1);
    expect(report.totals.VERIFIED_NOT_OFFERED).toBe(1);
    expect(report.missingCourseMonths).toHaveLength(11);
    expect(report.missingCourseMonths[0].month).toBe('2027-03');
  });

  it('records an audit entry for every applied cycle', async () => {
    const { prisma, raw } = buildFakePrisma([row()]);
    await runCoverageMonitoringCycle(prisma, { now: NOW, apply: true });
    expect(raw.crmAuditLog.create).toHaveBeenCalledTimes(1);
    const arg = raw.crmAuditLog.create.mock.calls[0][0] as { data: { action: string; afterData: string } };
    expect(arg.data.action).toBe('COVERAGE_MONITOR_CYCLE');
    expect(JSON.parse(arg.data.afterData).courses).toBe(1);
  });
});
