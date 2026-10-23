/**
 * ALO Education Unified Communication Engine
 * 10x better than old systems — single source for every message, call, note, task, reminder
 *
 * Channels: WhatsApp, SMS, Email, Website chat, Student portal, Partner portal, Internal notes,
 * Facebook comment/messenger, Instagram comment/DM, LinkedIn/TikTok placeholder, Phone/missed call,
 * Appointment, Task reminder, Document request, Application/visa/marketing updates, System notification, AI draft
 *
 * Global rule: Every communication must connect to one or more linked entities:
 * lead_id, student_id, partner_id, application_id, document_id, visa_file_id, campaign_id, task_id, employee_id, b2b_provider_id
 * Every message saves: who sent, who received, channel, body, visibility, status, created/read/delivery, linked entity, audit
 */

import { db } from '@/lib/db';
import { calculateSlaDueAt } from '@/lib/sla-engine';
import { dayScheduleAt, defaultBusinessHoursConfig, isAfterBusinessHours, nextBusinessOpening } from './business-hours';
import { loadBusinessHoursPolicy } from './business-hours-store';
import crypto from 'crypto';

// Visibility levels per spec (11)
export const VISIBILITY_LEVELS = [
  'public_safe',
  'student_visible',
  'partner_visible',
  'counselor_visible',
  'application_team_visible',
  'visa_team_visible',
  'finance_visible',
  'marketing_visible',
  'b2b_confidential',
  'internal_only',
  'super_admin_only',
] as const;
export type VisibilityLevel = typeof VISIBILITY_LEVELS[number];

// Channel list per spec
export const CHANNELS = [
  'whatsapp',
  'sms',
  'email',
  'website_chat',
  'student_portal_message',
  'partner_portal_message',
  'employee_internal_note',
  'counselor_note',
  'application_team_note',
  'visa_officer_note',
  'finance_note',
  'marketing_note',
  'facebook_comment',
  'facebook_messenger',
  'instagram_comment',
  'instagram_dm',
  'linkedin_message',
  'tiktok_message',
  'phone_call_log',
  'missed_call_log',
  'appointment_note',
  'task_reminder',
  'document_request',
  'application_status_notification',
  'visa_status_notification',
  'marketing_campaign_message',
  'system_notification',
  'ai_draft_message',
] as const;

// Status per spec
export const COMMUNICATION_STATUS = [
  'new','unread','read','replied','waiting_student','waiting_partner','waiting_staff',
  'waiting_application_team','waiting_visa_team','waiting_finance','resolved','archived','spam','escalated','failed'
] as const;

// Priority per spec
export const PRIORITIES = ['low','normal','high','urgent','sla_overdue'] as const;

// Intent per spec
export const INTENTS = [
  'course_inquiry','visa_inquiry','scholarship_inquiry','document_upload','application_status',
  'payment_query','commission_query','complaint','appointment_request','english_test',
  'partner_support','b2b_confidential','general'
] as const;

export function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/course|program|subject|university|college/)) return 'course_inquiry';
  if (t.match(/visa|cas|i-20|coe|pal|loa|brp|biometrics|interview.*visa/)) return 'visa_inquiry';
  if (t.match(/scholarship|bursary|funding|financial aid/)) return 'scholarship_inquiry';
  if (t.match(/document|passport|transcript|certificate|upload/)) return 'document_upload';
  if (t.match(/application|offer|conditional|unconditional|deposit/)) return 'application_status';
  if (t.match(/payment|invoice|receipt|deposit|fee/)) return 'payment_query';
  if (t.match(/commission|payout|wallet/)) return 'commission_query';
  if (t.match(/complaint|refund|issue|problem|bad/)) return 'complaint';
  if (t.match(/appointment|consultation|meeting|book.*slot/)) return 'appointment_request';
  if (t.match(/ielts|pte|toefl|duolingo|english.*test|mock.*test/)) return 'english_test';
  if (t.match(/partner.*support|help.*partner/)) return 'partner_support';
  if (t.match(/b2b.*confidential|provider.*internal/)) return 'b2b_confidential';
  return 'general';
}

// Synchronous policy view for agents; queue consumers load the persisted
// schedule and HRM holidays asynchronously before creating callback tasks.
export function isAfterHours(date = new Date()): boolean {
  return isAfterBusinessHours(date, defaultBusinessHoursConfig());
}

export const AFTER_HOURS_MESSAGE = `Thanks for contacting ALO Education. Our team is outside office hours and a counselor follow-up has been queued for the next opening. For account-specific help, sign in to the secure Student Portal. Do not share passwords, OTPs, bank/card details, or private documents in this chat.`;

// Generate communication code AE-COMM-YYYY000001 style
export function genCommunicationCode(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `COMM-${year}-${rand}`;
}

// Main create communication — validates linked entity, saves timeline, audit, SLA start
export async function createCommunication(params: {
  channel: string;
  threadId?: string;
  direction?: string;
  source?: string;
  senderUserId?: string;
  senderName?: string;
  senderContact?: string;
  recipientUserId?: string;
  recipientName?: string;
  recipientContact?: string;
  leadId?: string;
  studentId?: string;
  partnerId?: string;
  applicationId?: string;
  documentId?: string;
  visaFileId?: string;
  campaignId?: string;
  taskId?: string;
  employeeId?: string;
  b2bProviderId?: string;
  messageSubject?: string;
  messageBody: string;
  messageHtml?: string;
  attachmentPath?: string;
  visibility?: VisibilityLevel;
  intent?: string;
  priority?: string;
  status?: string;
  createdBy?: string;
  assignedTo?: string;
}) {
  if (!(CHANNELS as readonly string[]).includes(params.channel)) throw new Error('Unsupported channel');
  if (params.visibility && !(VISIBILITY_LEVELS as readonly string[]).includes(params.visibility)) throw new Error('Unsupported visibility');
  if (params.priority && !(PRIORITIES as readonly string[]).includes(params.priority)) throw new Error('Unsupported priority');
  if (params.status && !(COMMUNICATION_STATUS as readonly string[]).includes(params.status)) throw new Error('Unsupported status');
  return db.$transaction(async tx => {
  // Validate at least one linked entity
  const linked = [params.leadId, params.studentId, params.partnerId, params.applicationId, params.documentId, params.visaFileId, params.campaignId, params.taskId, params.employeeId, params.b2bProviderId].filter(Boolean);
  if (linked.length === 0) {
    throw new Error('Every communication must connect to one or more of lead_id, student_id, partner_id, application_id, document_id, visa_file_id, campaign_id, task_id, employee_id, b2b_provider_id');
  }
  if (!params.messageBody) throw new Error('message_body required');

  const communicationCode = genCommunicationCode();
  const channel = (params.channel || 'whatsapp').toLowerCase();
  const visibility = (params.visibility || 'public_safe') as VisibilityLevel;
  const intent = params.intent || detectIntent(params.messageBody);
  const priority = params.priority || 'normal';
  const status = params.status || 'new';

  const now = new Date();
  const businessHoursPolicy = await loadBusinessHoursPolicy(tx);
  const businessHours = businessHoursPolicy.config;
  const afterHours = isAfterBusinessHours(now, businessHours);
  const afterHoursAckEnabled = businessHoursPolicy.scheduleReadAvailable && businessHoursPolicy.hasPersistedSchedule && dayScheduleAt(now, businessHours).afterHoursAiAuto;

  // Determine the response deadline using the same persisted schedule as
  // counselor callbacks. Student replies remain accepted at every hour.
  let slaDueAt: Date | null = null;
  // Default SLA rules per spec
  const slaMap: Record<string, number> = {
    whatsapp: 10,
    sms: 30,
    email: 30,
    facebook_comment: 15,
    facebook_messenger: 15,
    instagram_comment: 15,
    instagram_dm: 15,
  };
  const slaMinutes = slaMap[channel] || 30;
  try {
    slaDueAt = calculateSlaDueAt(now, slaMinutes, true, businessHours);
  } catch (error) {
    console.error('[communication] business-hour SLA calculation failed', { error: error instanceof Error ? error.name : 'UnknownError' });
  }

  // Find or create thread
  const threadWhere: any = { channel, visibility, b2bProviderId: params.b2bProviderId || '' };
  if (params.threadId) threadWhere.id = params.threadId;
  for (const key of ['studentId', 'leadId', 'partnerId', 'applicationId', 'documentId', 'visaFileId', 'campaignId', 'taskId'] as const) {
    if (params[key]) threadWhere[key] = params[key];
  }

  let thread: any = null;
  if (Object.keys(threadWhere).length > 0) {
    thread = await tx.communicationThread.findFirst({
      where: { ...threadWhere, status: { not: 'resolved' } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }
  if (!thread && params.threadId) throw new Error('Thread no longer accessible');
  if (!thread) {
    thread = await tx.communicationThread.create({
      data: {
        threadCode: genCommunicationCode().replace('COMM','THREAD'),
        studentId: params.studentId || '',
        leadId: params.leadId || '',
        partnerId: params.partnerId || '',
        applicationId: params.applicationId || '',
        documentId: params.documentId || '',
        visaFileId: params.visaFileId || '',
        campaignId: params.campaignId || '',
        taskId: params.taskId || '',
        b2bProviderId: params.b2bProviderId || '',
        channel: channel as any,
        subject: params.messageSubject || params.messageBody.substring(0, 60),
        visibility,
        intent,
        priority,
        assignedToId: params.assignedTo || '',
        status: 'open',
        lastMessageAt: new Date(),
        lastMessagePreview: params.messageBody.substring(0, 100),
        unreadCount: 1,
        slaDueAt,
        slaStatus: slaDueAt ? 'normal' : 'none',
      }
    });
  } else {
    await tx.communicationThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: params.messageBody.substring(0, 100),
        unreadCount: { increment: 1 },
        slaDueAt: slaDueAt || thread.slaDueAt,
      }
    });
  }

  // Create message
  const msg = await tx.communicationMessage.create({
    data: {
      threadId: thread.id,
      communicationCode,
      channel,
      direction: params.direction || 'inbound',
      source: params.source || 'crm',
      senderUserId: params.senderUserId || '',
      senderName: params.senderName || '',
      senderContact: params.senderContact || '',
      recipientUserId: params.recipientUserId || '',
      recipientName: params.recipientName || '',
      recipientContact: params.recipientContact || '',
      leadId: params.leadId || '',
      studentId: params.studentId || '',
      partnerId: params.partnerId || '',
      applicationId: params.applicationId || '',
      documentId: params.documentId || '',
      visaFileId: params.visaFileId || '',
      campaignId: params.campaignId || '',
      taskId: params.taskId || '',
      b2bProviderId: params.b2bProviderId || '',
      messageSubject: params.messageSubject || '',
      messageBody: params.messageBody,
      messageHtml: params.messageHtml || '',
      attachmentPath: params.attachmentPath || '',
      visibility,
      intent,
      priority,
      status,
      deliveryStatus: params.direction === 'outbound' ? 'queued' : 'received',
      slaDueAt,
      createdBy: params.createdBy || params.senderUserId || '',
      assignedTo: params.assignedTo || '',
      // compatibility fields
      senderType: params.senderUserId ? 'staff' : 'student',
      senderId: params.senderUserId || params.studentId || '',
      content: params.messageBody,
      type: 'text',
      messageType: 'text',
      isRead: false,
      isInternal: visibility === 'internal_only' || visibility === 'b2b_confidential',
    }
  });

  // Audit log
  await tx.communicationLog.create({
    data: {
      communicationId: msg.id,
      eventType: 'created',
      oldStatus: '',
      newStatus: status,
      details: JSON.stringify({ channel, visibility, intent, afterHours, communicationCode }),
      createdBy: params.createdBy || params.senderUserId || 'system',
    }
  });

  // CrmAuditLog for sensitive views
  if (visibility === 'b2b_confidential' || visibility === 'super_admin_only') {
    await tx.crmAuditLog.create({
      data: {
        actorUserId: params.createdBy || params.senderUserId || 'system',
        actorRole: 'communication',
        action: 'COMMUNICATION_CREATED_SENSITIVE',
        targetCollection: 'CommunicationMessage',
        targetId: msg.id,
        afterData: JSON.stringify({ visibility, channel, intent }),
      }
    });
  }

  // Create timeline event for linked student/application
  if (params.studentId && ['public_safe', 'student_visible'].includes(visibility)) {
    await tx.timelineEvent.create({
      data: {
        studentId: params.studentId,
        stage: 'communication',
        title: `${channel} — ${intent}`,
        description: params.messageBody.substring(0, 300),
        actor: params.senderName || 'system',
        actionUrl: `/student/messages`,
      }
    });
  }

  // After-hours automation: create lead if new contact gives phone/email, assign follow-up for next working hour
  let afterHoursReply: string | null = null;
  if (afterHours && params.direction !== 'outbound' && ['whatsapp','sms','facebook_messenger','instagram_dm','website_chat'].includes(channel)) {
    if (afterHoursAckEnabled) afterHoursReply = AFTER_HOURS_MESSAGE;
    // Human callback waits for the actual next opening; an optional immediate
    // acknowledgement is separate and does not defer other inbound handling.
    const nextWorking = nextBusinessOpening(now, businessHours);
    await tx.counselorTask.create({
      data: {
        employeeId: params.assignedTo || '',
        studentId: params.studentId || '',
        leadId: params.leadId || '',
        title: `Follow-up after-hours ${channel} — ${intent}`,
        description: `Auto-created for after-hours message: ${params.messageBody.substring(0,200)}`,
        priority: 'high',
        type: 'follow_up',
        status: 'pending',
        dueDate: nextWorking.toISOString(),
      }
    });
  }

  return { thread, message: msg, afterHours, afterHoursReply, slaDueAt };
  });
}

// Legacy compatibility only: a WhatsApp phone number or typed Student ID does
// not authenticate an account. Keep the old export shape without performing a
// student lookup or returning profile details.
export async function handleWhatsAppStudentIdFlow(params: {
  phone: string;
  message: string;
  senderName?: string;
}): Promise<{ needsStudentId: boolean; prompt: string; studentFound?: boolean; studentId?: string }> {
  const bangla = /[\u0980-\u09FF]/.test(params.message);
  return {
    needsStudentId: false,
    prompt: bangla
      ? 'WhatsApp নম্বর বা Student ID দিয়ে পরিচয় যাচাই করা হয় না। ব্যক্তিগত সহায়তার জন্য নিরাপদ Student Portal-এ সাইন ইন করুন। এই চ্যাটে OTP, পাসওয়ার্ড, ব্যাংক/কার্ড তথ্য বা ব্যক্তিগত নথি পাঠাবেন না। সাধারণ প্রশ্নে পছন্দের দেশ ও পড়াশোনার স্তর জানাতে পারেন।'
      : 'A WhatsApp number or Student ID does not verify identity. Sign in to the secure Student Portal for account-specific help. Do not share an OTP, password, bank/card details, or private documents in this chat. For general guidance, you may share your preferred destination and study level.',
    studentFound: false,
  };
}
