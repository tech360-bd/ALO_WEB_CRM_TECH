/** After-hours communications policy, shared with UCC office hours and SLA. */
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { AFTER_HOURS_MESSAGE } from './unified-engine';
import { dayScheduleAt, isAfterBusinessHours, nextBusinessOpening } from './business-hours';
import { loadBusinessHoursPolicy } from './business-hours-store';

export async function handleAfterHoursMessage(params: {
  channel: string;
  senderPhone?: string;
  senderEmail?: string;
  message: string;
  leadId?: string;
  studentId?: string;
  assignedTo?: string;
}): Promise<{
  isAfterHours: boolean;
  autoReply: string | null;
  leadCreated: false;
  leadId?: string;
  taskCreated: boolean;
  taskId?: string;
  followUpQueued: boolean;
}> {
  const now = new Date();
  const policy = await loadBusinessHoursPolicy();
  const hours = policy.config;
  const after = isAfterBusinessHours(now, hours);
  if (!after) return { isAfterHours: false, autoReply: null, leadCreated: false, taskCreated: false, followUpQueued: false };
  const afterHoursReplyEnabled = policy.scheduleReadAvailable && policy.hasPersistedSchedule && dayScheduleAt(now, hours).afterHoursAiAuto;

  // This handler is deliberately not an inquiry-ingestion path. Verified
  // provider webhooks must deduplicate and resolve/create the inquiry first;
  // otherwise repeated after-hours messages could create duplicate leads.
  const entityId = params.leadId || params.studentId;
  if (!entityId) {
    return { isAfterHours: true, autoReply: null, leadCreated: false, taskCreated: false, followUpQueued: false };
  }

  const nextOpen = nextBusinessOpening(now, hours);
  const idempotencyKey = createHash('sha256')
    .update(`${params.leadId ? `lead:${params.leadId}` : `student:${params.studentId}`}|${nextOpen.toISOString()}`)
    .digest('hex')
    .slice(0, 40);
  const taskId = `afterhours_${idempotencyKey}`;
  const existing = await db.counselorTask.findUnique({ where: { id: taskId }, select: { id: true } });
  if (existing) {
    return { isAfterHours: true, autoReply: afterHoursReplyEnabled ? AFTER_HOURS_MESSAGE : null, leadCreated: false, leadId: params.leadId, taskCreated: false, taskId: existing.id, followUpQueued: true };
  }

  try {
    const task = await db.counselorTask.create({
      data: {
        id: taskId,
        employeeId: params.assignedTo || '',
        studentId: params.studentId || '',
        leadId: params.leadId || '',
        title: `After-hours ${params.channel} follow-up`,
        description: `Follow up after the next business opening. Contact details and message are retained in the linked communication thread.`,
        priority: 'high',
        type: 'follow_up',
        status: 'pending',
        dueDate: nextOpen.toISOString(),
      },
    });
    return { isAfterHours: true, autoReply: afterHoursReplyEnabled ? AFTER_HOURS_MESSAGE : null, leadCreated: false, leadId: params.leadId, taskCreated: true, taskId: task.id, followUpQueued: true };
  } catch (error) {
    // A concurrent replay may win the deterministic task id. Report it as an
    // existing task only after confirming that row actually persisted.
    const persisted = await db.counselorTask.findUnique({ where: { id: taskId }, select: { id: true } }).catch(() => null);
    if (persisted) {
      return { isAfterHours: true, autoReply: afterHoursReplyEnabled ? AFTER_HOURS_MESSAGE : null, leadCreated: false, leadId: params.leadId, taskCreated: false, taskId: persisted.id, followUpQueued: true };
    }
    throw error;
  }
}

export async function getOfficeHoursStatus(): Promise<{ isAfterHours: boolean; message: string; nextOpen: string; timezone: string }> {
  const now = new Date();
  const policy = await loadBusinessHoursPolicy();
  const hours = policy.config;
  const after = isAfterBusinessHours(now, hours);
  const nextOpen = nextBusinessOpening(now, hours);
  const day = dayScheduleAt(now, hours);
  const autoAcknowledgementEnabled = policy.scheduleReadAvailable && policy.hasPersistedSchedule && day.afterHoursAiAuto;
  const message = after
    ? (autoAcknowledgementEnabled ? 'A static after-hours acknowledgement is enabled; an associated follow-up must be queued before any reply is sent.' : 'Our team is outside office hours. For account-specific help, sign in to the secure Student Portal or contact an authorized ALO counselor.')
    : `Office is open (${day.startTime}–${day.endTime} ${hours.timeZone})`;
  return { isAfterHours: after, message, nextOpen: nextOpen.toISOString(), timezone: hours.timeZone };
}
