/**
 * SLA Engine — ALO Education
 * Office-hour aware, 30/20/10 escalation, global alarm
 * Timezone Asia/Dhaka, Sat-Thu 09:00-18:00, Friday closed
 */

import { db } from '@/lib/db';

export const SLA_DEFAULTS = {
  COUNSELOR_MINUTES: 40,
  MANAGER_MINUTES: 20,
  CEO_MINUTES: 10,
};

export const OFFICE_HOURS = {
  timezone: 'Asia/Dhaka',
  workingDays: [0, 1, 2, 3, 4, 6], // Sun-Thu + Sat (0=Sun,6=Sat), Friday=5 closed
  start: '09:00',
  end: '18:00',
  fridayClosed: true,
};

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

function isWorkingDay(date: Date): boolean {
  const day = date.getDay(); // 0 Sun
  if (day === 5) return false; // Friday closed
  return OFFICE_HOURS.workingDays.includes(day);
}

function isWithinOfficeHours(date: Date, start = OFFICE_HOURS.start, end = OFFICE_HOURS.end): boolean {
  if (!isWorkingDay(date)) return false;
  const { h: sh, m: sm } = parseTime(start);
  const { h: eh, m: em } = parseTime(end);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const curMin = date.getHours() * 60 + date.getMinutes();
  return curMin >= startMin && curMin <= endMin;
}

export function calculateSlaDueAt(receivedAt: Date, slaMinutes: number, officeHoursOnly = true): Date {
  if (!officeHoursOnly) {
    return new Date(receivedAt.getTime() + slaMinutes * 60000);
  }

  // Office-hours aware calculation
  let remaining = slaMinutes;
  let cursor = new Date(receivedAt);

  // If outside office hours, move to next working start
  while (!isWithinOfficeHours(cursor)) {
    cursor = new Date(cursor.getTime() + 15 * 60000); // +15min
    // If after hours, jump to next day 09:00
    if (cursor.getHours() >= 18) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(9, 0, 0, 0);
    }
    if (!isWorkingDay(cursor)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(9, 0, 0, 0);
    }
    // Safety break after 7 days
    if (cursor.getTime() - receivedAt.getTime() > 7 * 24 * 60 * 60 * 1000) break;
  }

  let due = new Date(cursor);
  while (remaining > 0) {
    due = new Date(due.getTime() + 60000);
    if (isWithinOfficeHours(due)) remaining--;
    // Jump if day ends
    if (due.getHours() >= 18) {
      due.setDate(due.getDate() + 1);
      due.setHours(9, 0, 0, 0);
      while (!isWorkingDay(due)) {
        due.setDate(due.getDate() + 1);
      }
    }
  }

  return due;
}

export async function startSlaForThread(threadId: string, params: {
  studentId?: string;
  counselorId?: string;
  channel?: string;
  slaMinutes?: number;
}) {
  const slaMinutes = params.slaMinutes || SLA_DEFAULTS.COUNSELOR_MINUTES;

  const officeHours = await db.uccOfficeHours.findMany();
  const isOfficeOpen = officeHours.length > 0 ? officeHours.some(o => o.isWorkDay) : true;

  const now = new Date();
  const dueAt = calculateSlaDueAt(now, slaMinutes, true);

  // Update thread
  await db.communicationThread.update({
    where: { id: threadId },
    data: {
      slaDueAt: dueAt,
      slaStatus: 'normal',
      slaTriggeredAt: now,
    },
  }).catch(() => {});

  // Create SLA event
  const slaEvent = await db.communicationSlaEvent.create({
    data: {
      threadId,
      counselorId: params.counselorId || '',
      slaMinutes,
      receivedAt: now,
      slaDueAt: dueAt,
      slaStatus: 'normal',
    },
  }).catch(() => null);

  // Also create legacy SlaEvent for compatibility
  await db.slaEvent.create({
    data: {
      threadId,
      studentId: params.studentId || '',
      counselorId: params.counselorId || '',
      channel: params.channel || 'whatsapp',
      firstMessageAt: now,
      eventType: 'warning',
    },
  }).catch(() => {});

  return { dueAt, slaMinutes, slaEvent };
}

export async function checkAndEscalateSla() {
  const now = new Date();
  const overdueThreads = await db.communicationThread.findMany({
    where: {
      slaDueAt: { lt: now },
      status: { not: 'resolved' },
      slaStatus: { notIn: ['resolved', 'overdue_level3'] },
    },
    take: 100,
    orderBy: { slaDueAt: 'asc' },
  });

  const results: any[] = [];

  for (const thread of overdueThreads) {
    const elapsedMinutes = Math.floor((now.getTime() - (thread.slaTriggeredAt?.getTime() || thread.createdAt.getTime())) / 60000);
    let newStatus = thread.slaStatus;
    let escalationLevel = 1;
    let action = '';

    if (thread.slaStatus === 'normal' || !thread.slaStatus) {
      // Level 1: counselor overdue -> branch manager
      newStatus = 'overdue_level1';
      escalationLevel = 1;
      action = 'notify_branch_manager';

      await db.communicationThread.update({
        where: { id: thread.id },
        data: { slaStatus: newStatus, needsHumanTakeover: true },
      }).catch(() => {});

      // Create task for branch manager
      await db.counselorTask.create({
        data: {
          employeeId: thread.assignedToId || '',
          studentId: thread.studentId,
          title: `SLA Overdue Level 1: ${thread.threadCode || thread.id}`,
          description: `Student message pending ${elapsedMinutes} min. Branch manager escalation.`,
          type: 'sla_escalation',
          priority: 'high',
          status: 'pending',
          dueDate: new Date(now.getTime() + 20 * 60000).toISOString(),
        },
      }).catch(() => {});

      // Dashboard alarm
      await db.dashboardAlarm.create({
        data: {
          alarmType: 'SLA_OVERDUE',
          threadId: thread.id,
          conversationId: thread.id,
          studentId: thread.studentId,
          studentName: thread.studentId, // will be enriched later
          branch: '',
          assignedEmployee: thread.assignedToId || '',
          slaElapsedMinutes: elapsedMinutes,
          escalationLevel: 1,
          priority: 'high',
          status: 'active',
        },
      }).catch(() => {});
    } else if (thread.slaStatus === 'overdue_level1') {
      // Level 2: branch manager overdue -> CEO/Super Admin
      if (elapsedMinutes >= SLA_DEFAULTS.COUNSELOR_MINUTES + SLA_DEFAULTS.MANAGER_MINUTES) {
        newStatus = 'overdue_level2';
        escalationLevel = 2;
        action = 'notify_ceo';

        await db.communicationThread.update({
          where: { id: thread.id },
          data: { slaStatus: newStatus, escalatedToId: 'CEO', escalatedToName: 'CEO/Super Admin' },
        }).catch(() => {});

        await db.counselorTask.create({
          data: {
            employeeId: 'CEO',
            studentId: thread.studentId,
            title: `SLA Overdue Level 2: ${thread.threadCode || thread.id}`,
            description: `Branch manager did not respond in 20 min. CEO escalation. Total ${elapsedMinutes} min.`,
            type: 'sla_escalation',
            priority: 'urgent',
            status: 'pending',
            dueDate: new Date(now.getTime() + 10 * 60000).toISOString(),
          },
        }).catch(() => {});

        await db.dashboardAlarm.updateMany({
          where: { threadId: thread.id, status: 'active' },
          data: { escalationLevel: 2, priority: 'urgent', slaElapsedMinutes: elapsedMinutes },
        }).catch(() => {});
      }
    } else if (thread.slaStatus === 'overdue_level2') {
      // Level 3: CEO overdue -> global alarm
      if (elapsedMinutes >= SLA_DEFAULTS.COUNSELOR_MINUTES + SLA_DEFAULTS.MANAGER_MINUTES + SLA_DEFAULTS.CEO_MINUTES) {
        newStatus = 'overdue_level3';
        escalationLevel = 3;
        action = 'global_alarm';

        await db.communicationThread.update({
          where: { id: thread.id },
          data: { slaStatus: newStatus },
        }).catch(() => {});

        await db.dashboardAlarm.create({
          data: {
            alarmType: 'SLA_OVERDUE',
            threadId: thread.id,
            conversationId: thread.id,
            studentId: thread.studentId,
            studentName: 'Urgent: Global Alarm',
            branch: '',
            assignedEmployee: 'ALL',
            slaElapsedMinutes: elapsedMinutes,
            escalationLevel: 3,
            priority: 'critical',
            status: 'active',
          },
        }).catch(() => {});

        // Notify authorized users via notification
        await db.notification.create({
          data: {
            studentId: thread.studentId,
            title: 'Global Alarm: Urgent WhatsApp pending',
            message: `Urgent WhatsApp student message pending. Reply now. Thread ${thread.id}, ${elapsedMinutes} min elapsed.`,
            type: 'critical',
          },
        }).catch(() => {});
      }
    }

    if (action) {
      results.push({ threadId: thread.id, action, escalationLevel, elapsedMinutes, newStatus });
    }
  }

  return results;
}

export async function resolveSlaOnReply(threadId: string, repliedById: string) {
  const now = new Date();

  await db.communicationThread.update({
    where: { id: threadId },
    data: { slaStatus: 'resolved', status: 'open' },
  }).catch(() => {});

  await db.communicationSlaEvent.updateMany({
    where: { threadId, slaStatus: { not: 'resolved' } },
    data: { slaStatus: 'resolved' },
  }).catch(() => {});

  await db.slaEvent.updateMany({
    where: { threadId, resolvedAt: null },
    data: { resolvedAt: now, responseAt: now, resolution: `Replied by ${repliedById}` },
  }).catch(() => {});

  await db.dashboardAlarm.updateMany({
    where: { threadId, status: 'active' },
    data: { status: 'resolved', resolvedBy: repliedById, resolvedAt: now },
  }).catch(() => {});
}
