import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getAutomationSnapshot, getCollaborationFeed } from '@/lib/automation-analytics';
import { db } from '@/lib/db';
import { getGroqProtectionStats, groqGuard } from '@/lib/groq-protection';

/** Model/provider health summary — configuration presence only, never key material. */
function modelProviderHealth() {
  const providers = [
    { id: 'local', configured: Boolean(process.env.LOCAL_AI_URL), model: process.env.LOCAL_AI_MODEL || null },
    { id: 'groq', configured: Boolean(process.env.GROQ_API_KEY), model: process.env.AI_DEFAULT_MODEL || null },
    { id: 'openrouter', configured: Boolean(process.env.OPENROUTER_API_KEY), model: process.env.OPENROUTER_MODEL || null },
    { id: 'zai', configured: Boolean(process.env.ZAI_API_KEY), model: 'glm-4-flash' },
  ] as const;
  return providers.map((p) => {
    const stats = groqGuard.getStats(p.id);
    const circuitOpen = stats.failures.count >= stats.limits.circuitThreshold;
    return {
      provider: p.id,
      configured: p.configured,
      model: p.model,
      inFlight: stats.inFlight,
      windowCount: stats.windowCount,
      queueDepth: stats.queueLen,
      failures: stats.failures.count,
      circuitOpen,
      limits: stats.limits,
      // availability is process-local observation, not a distributed probe
      availability: circuitOpen ? 'CIRCUIT_OPEN' : stats.failures.count > 0 ? 'DEGRADED' : p.configured ? 'AVAILABLE' : 'NOT_CONFIGURED',
    };
  });
}

export const GET = withAuth(async req => {
  const periodDays = Number(new URL(req.url).searchParams.get('periodDays') || '30');
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
    return NextResponse.json({ success: false, error: 'periodDays must be 1–365' }, { status: 400 });
  }
  try {
    const [automation, collaboration, employees, approvals, tasks, latency, byWorkflowMode] = await Promise.all([
      getAutomationSnapshot(periodDays), getCollaborationFeed(20),
      db.aiEmployee.groupBy({ by: ['status'], _count: { _all: true } }),
      db.agentApprovalQueue.groupBy({ by: ['status'], _count: { _all: true } }),
      db.agentTask.groupBy({ by: ['status'], _count: { _all: true } }),
      db.automationEvent.aggregate({ where: { success: true, createdAt: { gte: new Date(Date.now() - periodDays * 86400000) } }, _avg: { durationMs: true } }),
      db.automationEvent.groupBy({
        by: ['workflow', 'category', 'mode', 'success'],
        where: { createdAt: { gte: new Date(Date.now() - periodDays * 86400000) } },
        _count: { _all: true },
      }),
    ]);
    const count = (rows: Array<{ status: string; _count: { _all: number } }>, ...statuses: string[]) =>
      rows.filter(row => statuses.includes(row.status.toUpperCase())).reduce((n, row) => n + row._count._all, 0);

    // Workflow-specific automation rates (same canonical definition as the
    // top-level rate: successful AUTOMATED / all ELIGIBLE_ROUTINE events).
    const workflowAgg = new Map<string, { eligible: number; automated: number }>();
    for (const row of byWorkflowMode) {
      const entry = workflowAgg.get(row.workflow) || { eligible: 0, automated: 0 };
      if (row.category === 'ELIGIBLE_ROUTINE') {
        entry.eligible += row._count._all;
        if (row.mode === 'AUTOMATED' && row.success) entry.automated += row._count._all;
      }
      workflowAgg.set(row.workflow, entry);
    }
    const byWorkflow = [...workflowAgg.entries()]
      .map(([workflow, v]) => ({ workflow, eligible: v.eligible, automated: v.automated, automationRate: v.eligible ? Math.round((v.automated / v.eligible) * 10000) / 100 : 0 }))
      .sort((a, b) => b.eligible - a.eligible)
      .slice(0, 20);

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
      automationByWorkflow: byWorkflow,
      modelProviders: modelProviderHealth(),
      failoverPolicy: {
        primaryToLocal: true,
        note: 'LOCAL_AI_URL, when set, is primary with no implicit cloud fallback; explicit providers never fall back implicitly; private-data requests are local-only.',
      },
      latency: { avgMs: latency._avg.durationMs },
      caveats: ['Catalog status is not observed worker activity.', 'Historical AutomationEvent success flags have not been reconciled.', 'Groq guard metrics are process-local, not a distributed queue.', 'Automation rate is reported as NO_DATA until eligible work is observed — it is never fabricated.'],
      generatedAt: new Date().toISOString(),
    });
  } catch {
    console.error('[workforce-metrics] Database measurement unavailable');
    return NextResponse.json({ success: false, error: 'Workforce measurements unavailable' }, { status: 503 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
