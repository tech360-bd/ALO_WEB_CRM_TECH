/** SLA engine using the persisted Dhaka business schedule and HRM holidays. */

import { db } from '@/lib/db';
import { addBusinessMinutes, businessMinutesBetween, defaultBusinessHoursConfig, isWithinBusinessHours, type BusinessHoursConfig } from '@/lib/communication/business-hours';
import { loadBusinessHoursConfig } from '@/lib/communication/business-hours-store';

export const SLA_DEFAULTS = {
  COUNSELOR_MINUTES: 40,
  MANAGER_MINUTES: 20,
  CEO_MINUTES: 10,
};

// Compatibility export for older callers. Runtime decisions use the stored schedule.
export const OFFICE_HOURS = {
  timezone: 'Asia/Dhaka',
  workingDays: [0, 1, 2, 3, 4, 6],
  start: '09:00',
  end: '18:00',
  fridayClosed: true,
};

export function calculateSlaDueAt(
  receivedAt: Date,
  slaMinutes: number,
  officeHoursOnly = true,
  config: BusinessHoursConfig = defaultBusinessHoursConfig(),
): Date {
  if (!officeHoursOnly) return new Date(receivedAt.getTime() + slaMinutes * 60_000);
  return addBusinessMinutes(receivedAt, slaMinutes, config);
}

export async function startSlaForThread(threadId: string, params: {
  studentId?: string;
  counselorId?: string;
  channel?: string;
  slaMinutes?: number;
}) {
  const slaMinutes = params.slaMinutes ?? SLA_DEFAULTS.COUNSELOR_MINUTES;
  const now = new Date();
  const businessHours = await loadBusinessHoursConfig();
  const dueAt = calculateSlaDueAt(now, slaMinutes, true, businessHours);

  const result = await db.$transaction(async (tx) => {
    const claimed = await tx.communicationThread.updateMany({
      where: { id: threadId, slaStatus: { in: ['', 'none', 'resolved'] } },
      data: { slaDueAt: dueAt, slaStatus: 'normal', slaTriggeredAt: now, status: 'open' },
    });
    if (claimed.count !== 1) {
      const existing = await tx.communicationSlaEvent.findFirst({
        where: { threadId, slaStatus: { not: 'resolved' } },
        orderBy: { createdAt: 'desc' },
      });
      if (!existing) throw new Error('An active SLA already exists for this thread, but its event record is missing. Reconcile before retrying.');
      return { event: existing, dueAt: existing.slaDueAt || dueAt, created: false };
    }

    const communicationEvent = await tx.communicationSlaEvent.create({
      data: {
        threadId,
        counselorId: params.counselorId || '',
        channel: params.channel || 'whatsapp',
        slaMinutes,
        receivedAt: now,
        assignedAt: params.counselorId ? now : null,
        slaDueAt: dueAt,
        slaStatus: 'normal',
      },
    });
    await tx.slaEvent.create({
      data: {
        threadId,
        studentId: params.studentId || '',
        counselorId: params.counselorId || '',
        channel: params.channel || 'whatsapp',
        firstMessageAt: now,
        eventType: 'warning',
      },
    });
    return { event: communicationEvent, dueAt, created: true };
  });
  return { dueAt: result.dueAt, slaMinutes, slaEvent: result.event, created: result.created };
}

export async function checkAndEscalateSla() {
  const now = new Date();
  const businessHours = await loadBusinessHoursConfig();
  // Human escalations are held until the next configured opening.
  if (!isWithinBusinessHours(now, businessHours)) return [];

  const overdueThreads = await db.communicationThread.findMany({
    where: {
      slaDueAt: { lt: now },
      status: { not: 'resolved' },
      slaStatus: { notIn: ['resolved', 'overdue_level3'] },
    },
    take: 100,
    orderBy: { slaDueAt: 'asc' },
  });

  const results: Array<{ threadId: string; action: string; escalationLevel: number; elapsedMinutes: number; newStatus: string }> = [];
  for (const thread of overdueThreads) {
    const elapsedMinutes = Math.floor(businessMinutesBetween(thread.slaTriggeredAt || thread.createdAt, now, businessHours));
    const currentStatus = thread.slaStatus || 'normal';
    let newStatus: string | null = null;
    let escalationLevel = 1;
    let action = '';

    if (currentStatus === 'normal') {
      newStatus = 'overdue_level1';
      escalationLevel = 1;
      action = 'notify_branch_manager';
    } else if (currentStatus === 'overdue_level1' && elapsedMinutes >= SLA_DEFAULTS.COUNSELOR_MINUTES + SLA_DEFAULTS.MANAGER_MINUTES) {
      newStatus = 'overdue_level2';
      escalationLevel = 2;
      action = 'notify_ceo';
    } else if (currentStatus === 'overdue_level2' && elapsedMinutes >= SLA_DEFAULTS.COUNSELOR_MINUTES + SLA_DEFAULTS.MANAGER_MINUTES + SLA_DEFAULTS.CEO_MINUTES) {
      newStatus = 'overdue_level3';
      escalationLevel = 3;
      action = 'global_alarm';
    }
    if (!newStatus) continue;

    const committed = await db.$transaction(async (tx) => {
      // Compare-and-set makes retries safe: only one worker can advance this
      // thread from the observed status and create the matching side effects.
      const claimed = await tx.communicationThread.updateMany({
        where: { id: thread.id, slaStatus: currentStatus, status: { not: 'resolved' } },
        data: {
          slaStatus: newStatus!,
          ...(escalationLevel === 1 ? { needsHumanTakeover: true } : {}),
          ...(escalationLevel === 2 ? { escalatedToId: 'CEO', escalatedToName: 'CEO/Super Admin' } : {}),
        },
      });
      if (claimed.count !== 1) return false;

      const taskDue = escalationLevel === 1
        ? addBusinessMinutes(now, SLA_DEFAULTS.MANAGER_MINUTES, businessHours)
        : escalationLevel === 2
          ? addBusinessMinutes(now, SLA_DEFAULTS.CEO_MINUTES, businessHours)
          : null;
      if (escalationLevel < 3) {
        await tx.counselorTask.create({
          data: {
            employeeId: escalationLevel === 1 ? thread.assignedToId || '' : 'CEO',
            studentId: thread.studentId,
            title: `SLA Overdue Level ${escalationLevel}: ${thread.threadCode || thread.id}`,
            description: escalationLevel === 1
              ? `Student message is overdue by ${elapsedMinutes} business minutes. Branch manager follow-up required.`
              : `Manager response SLA is overdue. CEO/Super Admin escalation required (${elapsedMinutes} business minutes total).`,
            type: 'sla_escalation',
            priority: escalationLevel === 1 ? 'high' : 'urgent',
            status: 'pending',
            dueDate: taskDue!.toISOString(),
          },
        });
      }

      const existingAlarm = await tx.dashboardAlarm.findFirst({ where: { threadId: thread.id, status: 'active' }, orderBy: { createdAt: 'desc' } });
      if (existingAlarm) {
        await tx.dashboardAlarm.update({
          where: { id: existingAlarm.id },
          data: { escalationLevel, priority: escalationLevel === 3 ? 'critical' : escalationLevel === 2 ? 'urgent' : 'high', slaElapsedMinutes: elapsedMinutes },
        });
      } else {
        await tx.dashboardAlarm.create({
          data: {
            alarmType: 'SLA_OVERDUE',
            threadId: thread.id,
            conversationId: thread.id,
            studentId: thread.studentId,
            studentName: escalationLevel === 3 ? 'Urgent: Global Alarm' : thread.studentId,
            branch: '',
            assignedEmployee: escalationLevel === 3 ? 'ALL' : thread.assignedToId || '',
            slaElapsedMinutes: elapsedMinutes,
            escalationLevel,
            priority: escalationLevel === 3 ? 'critical' : escalationLevel === 2 ? 'urgent' : 'high',
            status: 'active',
          },
        });
      }
      if (escalationLevel === 3) {
        await tx.notification.create({
          data: {
            studentId: thread.studentId,
            title: 'Global Alarm: Urgent student message pending',
            message: `Urgent student message pending. Thread ${thread.id}, ${elapsedMinutes} business minutes elapsed.`,
            type: 'critical',
          },
        });
      }
      await tx.communicationSlaEvent.updateMany({
        where: { threadId: thread.id, slaStatus: { not: 'resolved' } },
        data: { slaStatus: newStatus, ...(escalationLevel === 3 ? { escalatedAt: now } : {}) },
      });
      await tx.slaEvent.updateMany({
        where: { threadId: thread.id, resolvedAt: null },
        data: { eventType: newStatus, ...(escalationLevel > 1 ? { escalatedAt: now } : {}) },
      });
      return true;
    });

    if (committed) results.push({ threadId: thread.id, action, escalationLevel, elapsedMinutes, newStatus });
  }
  return results;
}

export async function resolveSlaOnReply(threadId: string, repliedById: string) {
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.communicationThread.update({ where: { id: threadId }, data: { slaStatus: 'resolved', status: 'open' } });
    // First staff response is immutable; later replies must not overwrite it.
    await tx.communicationSlaEvent.updateMany({
      where: { threadId, firstResponseAt: null },
      data: { firstResponseAt: now },
    });
    await tx.communicationSlaEvent.updateMany({
      where: { threadId, slaStatus: { not: 'resolved' } },
      data: { slaStatus: 'resolved', resolvedAt: now },
    });
    await tx.slaEvent.updateMany({
      where: { threadId, resolvedAt: null },
      data: { resolvedAt: now, responseAt: now, resolution: `Replied by ${repliedById}` },
    });
    await tx.dashboardAlarm.updateMany({
      where: { threadId, status: 'active' },
      data: { status: 'resolved', resolvedBy: repliedById, resolvedAt: now },
    });
  });
}
