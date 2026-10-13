import { db } from '@/lib/db';

/**
 * Update or create today's AiWorkforceSnapshot with real DB counts.
 */
export async function updateWorkforceSnapshot(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const [
    totalAgents, activeAgents, idleAgents, busyAgents, failedAgents,
    queuedTasks, runningTasks, completedToday, failedToday,
  ] = await Promise.all([
    db.aiAgent.count(),
    db.aiAgent.count({ where: { status: 'ACTIVE' } }),
    db.aiAgent.count({ where: { status: 'IDLE' } }),
    db.aiAgent.count({ where: { status: 'BUSY' } }),
    db.aiAgent.count({ where: { status: 'FAILED' } }),
    db.aiTask.count({ where: { status: 'QUEUED' } }),
    db.aiTask.count({ where: { status: 'RUNNING' } }),
    db.aiTask.count({ where: { status: 'COMPLETED', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.aiTask.count({ where: { status: 'FAILED', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  const queueDepth = queuedTasks + runningTasks;
  const totalTasksToday = completedToday + failedToday;

  // Calculate real automation rate from today's tasks
  const automatableCompleted = await db.aiTask.count({
    where: {
      status: 'COMPLETED',
      automationClass: 'AI_AUTOMATABLE',
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });
  const assistedCompleted = await db.aiTask.count({
    where: {
      status: 'COMPLETED',
      automationClass: 'AI_ASSISTED',
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0)) },
    },
  });
  const humanRequiredCompleted = await db.aiTask.count({
    where: {
      status: 'COMPLETED',
      automationClass: 'HUMAN_REQUIRED',
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0)) },
    },
  });
  const approvalReqCompleted = await db.aiTask.count({
    where: {
      status: 'COMPLETED',
      automationClass: 'HUMAN_APPROVAL_REQUIRED',
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0)) },
    },
  });
  const escalatedCompleted = await db.aiTask.count({
    where: {
      status: 'COMPLETED',
      automationClass: 'ESCALATED',
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0)) },
    },
  });

  const totalEligible = automatableCompleted + assistedCompleted + humanRequiredCompleted + approvalReqCompleted + escalatedCompleted;
  const automationRate = totalEligible > 0 ? Math.round((automatableCompleted / totalEligible) * 10000) / 100 : 0;
  const humanRate = totalEligible > 0 ? Math.round(((humanRequiredCompleted + approvalReqCompleted) / totalEligible) * 10000) / 100 : 0;
  const successRate = totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 10000) / 100 : 0;
  const failureRate = totalTasksToday > 0 ? Math.round((failedToday / totalTasksToday) * 10000) / 100 : 0;

  const totalGroqRequests = await db.aiTaskLog.count({
    where: {
      provider: 'groq',
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  await db.aiWorkforceSnapshot.upsert({
    where: { date: today },
    update: {
      totalAgents, activeAgents, idleAgents, busyAgents, failedAgents,
      totalTasks: totalTasksToday, aiAutomated: automatableCompleted, aiAssisted: assistedCompleted,
      humanRequired: humanRequiredCompleted, approvalReq: approvalReqCompleted, escalated: escalatedCompleted,
      automationRate, humanRate, groqRequests: totalGroqRequests, queueDepth, successRate, failureRate,
    },
    create: {
      date: today, totalAgents, activeAgents, idleAgents, busyAgents, failedAgents,
      totalTasks: totalTasksToday, aiAutomated: automatableCompleted, aiAssisted: assistedCompleted,
      humanRequired: humanRequiredCompleted, approvalReq: approvalReqCompleted, escalated: escalatedCompleted,
      automationRate, humanRate, groqRequests: totalGroqRequests, queueDepth, successRate, failureRate,
    },
  });
}
