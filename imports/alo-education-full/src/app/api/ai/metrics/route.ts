import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/ai/metrics — workforce metrics from AutomationMetric table
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const daysParam = req.nextUrl.searchParams.get('days');
    const days = daysParam ? Math.min(90, Math.max(1, parseInt(daysParam, 10) || 30)) : 30;

    const todayStr = new Date().toISOString().split('T')[0];
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceStr = sinceDate.toISOString().split('T')[0];

    // Get historical metrics
    const metrics = await db.automationMetric.findMany({
      where: {
        date: { gte: sinceStr, lte: todayStr },
      },
      orderBy: { date: 'asc' },
    });

    // Ensure today's metric exists — compute it if not
    let todayMetric = metrics.find((m) => m.date === todayStr);
    if (!todayMetric) {
      // Compute today's metrics from actual task data
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [totalTasks, aiAutomated, aiAssisted, humanRequired, approvalRequired, escalated] =
        await Promise.all([
          db.aiTask.count({ where: { createdAt: { gte: todayStart } } }),
          db.aiTask.count({
            where: { createdAt: { gte: todayStart }, automationClass: 'AI_AUTOMATABLE', status: 'COMPLETED' },
          }),
          db.aiTask.count({
            where: { createdAt: { gte: todayStart }, automationClass: 'AI_ASSISTED', status: 'COMPLETED' },
          }),
          db.aiTask.count({
            where: { createdAt: { gte: todayStart }, automationClass: 'HUMAN_REQUIRED' },
          }),
          db.aiTask.count({
            where: { createdAt: { gte: todayStart }, automationClass: 'HUMAN_APPROVAL_REQUIRED' },
          }),
          db.aiTask.count({
            where: { createdAt: { gte: todayStart }, automationClass: 'ESCALATED' },
          }),
        ]);

      const automationRate = totalTasks > 0 ? (aiAutomated / totalTasks) * 100 : 0;
      const humanRate = totalTasks > 0 ? ((humanRequired + approvalRequired) / totalTasks) * 100 : 0;

      todayMetric = await db.automationMetric.upsert({
        where: { date: todayStr },
        create: {
          date: todayStr,
          totalTasks,
          aiAutomated,
          aiAssisted,
          humanRequired,
          approvalRequired,
          escalated,
          automationRate,
          humanRate,
        },
        update: {
          totalTasks,
          aiAutomated,
          aiAssisted,
          humanRequired,
          approvalRequired,
          escalated,
          automationRate,
          humanRate,
        },
      });

      metrics.push(todayMetric);
    }

    // Aggregate summary across the period
    const summary = metrics.reduce(
      (acc, m) => {
        acc.totalTasks += m.totalTasks;
        acc.aiAutomated += m.aiAutomated;
        acc.aiAssisted += m.aiAssisted;
        acc.humanRequired += m.humanRequired;
        acc.approvalRequired += m.approvalRequired;
        acc.escalated += m.escalated;
        return acc;
      },
      {
        totalTasks: 0,
        aiAutomated: 0,
        aiAssisted: 0,
        humanRequired: 0,
        approvalRequired: 0,
        escalated: 0,
      },
    );

    summary.automationRate =
      summary.totalTasks > 0 ? Math.round((summary.aiAutomated / summary.totalTasks) * 100 * 100) / 100 : 0;
    summary.humanRate =
      summary.totalTasks > 0
        ? Math.round(((summary.humanRequired + summary.approvalRequired) / summary.totalTasks) * 100 * 100) / 100
        : 0;

    // Current workforce snapshot
    const [activeAgents, totalAgents, pendingApprovals] = await Promise.all([
      db.aiAgent.count({ where: { status: { in: ['ACTIVE', 'BUSY', 'IDLE'] } } }),
      db.aiAgent.count(),
      db.approvalItem.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      success: true,
      today: todayMetric,
      history: metrics,
      summary,
      workforce: {
        activeAgents,
        totalAgents,
        pendingApprovals,
      },
      period: { days, from: sinceStr, to: todayStr },
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get workforce metrics.' },
      { status: 500 },
    );
  }
}
