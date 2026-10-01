import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getAutomationSnapshot, getCollaborationFeed } from '@/lib/automation-analytics';
import { db } from '@/lib/db';
import { getGroqProtectionStats } from '@/lib/groq-protection';

export const GET = withAuth(async req => {
  const periodDays = Number(new URL(req.url).searchParams.get('periodDays') || '30');
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
    return NextResponse.json({ success: false, error: 'periodDays must be 1–365' }, { status: 400 });
  }
  try {
    const [automation, collaboration, employees, approvals, tasks, latency] = await Promise.all([
      getAutomationSnapshot(periodDays), getCollaborationFeed(20),
      db.aiEmployee.groupBy({ by: ['status'], _count: { _all: true } }),
      db.agentApprovalQueue.groupBy({ by: ['status'], _count: { _all: true } }),
      db.agentTask.groupBy({ by: ['status'], _count: { _all: true } }),
      db.automationEvent.aggregate({ where: { success: true, createdAt: { gte: new Date(Date.now() - periodDays * 86400000) } }, _avg: { durationMs: true } }),
    ]);
    const count = (rows: Array<{ status: string; _count: { _all: number } }>, ...statuses: string[]) =>
      rows.filter(row => statuses.includes(row.status.toUpperCase())).reduce((n, row) => n + row._count._all, 0);
    return NextResponse.json({
      success: true,
      workforce: {
        total: employees.reduce((n, row) => n + row._count._all, 0),
        active: count(employees, 'ACTIVE'), idle: count(employees, 'IDLE'), busy: count(employees, 'BUSY'),
        paused: count(employees, 'PAUSED'), failed: count(employees, 'FAILED'),
        waitingApproval: count(approvals, 'PENDING', 'WAITING_APPROVAL'), escalated: count(approvals, 'ESCALATED'),
        queued: count(tasks, 'PENDING', 'QUEUED'), running: count(tasks, 'RUNNING'),
      },
      queue: { queued: count(tasks, 'PENDING', 'QUEUED'), running: count(tasks, 'RUNNING'), success: count(tasks, 'COMPLETED'), failed: count(tasks, 'FAILED') },
      groq: getGroqProtectionStats(), automation, collaboration,
      latency: { avgMs: latency._avg.durationMs },
      caveats: ['Catalog status is not observed worker activity.', 'Historical AutomationEvent success flags have not been reconciled.', 'Groq guard metrics are process-local, not a distributed queue.'],
      generatedAt: new Date().toISOString(),
    });
  } catch {
    console.error('[workforce-metrics] Database measurement unavailable');
    return NextResponse.json({ success: false, error: 'Workforce measurements unavailable' }, { status: 503 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
