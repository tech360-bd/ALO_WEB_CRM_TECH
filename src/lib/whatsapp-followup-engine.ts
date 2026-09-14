/**
 * WhatsApp Follow-Up Engine — ALO Education
 * Default schedule: Day 3,7,14,21,25,30 sender 01805020100
 * Respects STOP/START, consent, application status, partner-only mode
 */

import { db } from '@/lib/db';
import { MAIN_NUMBER, normalizeBdPhone } from './whatsapp-number-pool';
import { sendWhatsAppMessage } from './whatsapp-cloud-api';

export const DEFAULT_FOLLOWUP_DAYS = [3, 7, 14, 21, 25, 30];

export async function seedFollowUpTemplates() {
  const existing = await db.whatsAppFollowUpTemplate.count();
  if (existing > 0) return { seeded: false, count: existing };

  const templates = [
    {
      templateName: 'followup_day3',
      day: 3,
      language: 'mixed',
      purpose: 'follow_up',
      messageBody: 'Assalamualaikum {{name}}! ALO Education theke bolchi. Apni {{country}} te {{intake}} intake niye interested chilen. Apnar application process e kono help lagle janaben. Portal: {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day3',
      approvalStatus: 'approved',
      activeStatus: 'active',
    },
    {
      templateName: 'followup_day7',
      day: 7,
      language: 'mixed',
      purpose: 'follow_up',
      messageBody: 'Hello {{name}}, ALO Education here! Your counselor {{counselor_name}} from {{branch_name}} branch is ready to assist for {{country}} {{intake}}. Documents upload korchen? Portal: {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day7',
      approvalStatus: 'approved',
      activeStatus: 'active',
    },
    {
      templateName: 'followup_day14',
      day: 14,
      language: 'english',
      purpose: 'follow_up',
      messageBody: 'Hi {{name}}, quick check-in from ALO Education. Your student code {{student_code}} for {{country}} is active. Need help with offer letter or CAS? Reply here or visit {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day14',
      approvalStatus: 'approved',
      activeStatus: 'active',
    },
    {
      templateName: 'followup_day21',
      day: 21,
      language: 'bangla',
      purpose: 'follow_up',
      messageBody: '{{name}}, ALO Education theke reminder. {{country}} er {{intake}} intake er deadline kache. Document gulo upload korechen? Help lagle {{counselor_name}} ke knock korun. {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day21',
      approvalStatus: 'approved',
      activeStatus: 'active',
    },
    {
      templateName: 'followup_day25',
      day: 25,
      language: 'mixed',
      purpose: 'follow_up',
      messageBody: '{{name}}, last follow-up from ALO! {{country}} application still pending? Amra apnake full support dibo. Counselor: {{counselor_name}} ({{branch_name}}). Portal: {{portal_link}}. STOP likhe opt-out korte paren.',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day25',
      approvalStatus: 'approved',
      activeStatus: 'active',
    },
    {
      templateName: 'followup_day30',
      day: 30,
      language: 'english',
      purpose: 'follow_up',
      messageBody: 'Final reminder {{name}} — ALO Education. Your profile {{student_code}} for {{country}} {{intake}} is still open. If you wish to continue, reply START. Portal: {{portal_link}}. To stop messages, reply STOP.',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day30',
      approvalStatus: 'approved',
      activeStatus: 'active',
    },
  ];

  for (const t of templates) {
    await db.whatsAppFollowUpTemplate.upsert({
      where: { templateName: t.templateName },
      update: t,
      create: t,
    });
  }

  return { seeded: true, count: templates.length };
}

export async function createFollowUpScheduleForStudent(params: {
  studentId: string;
  leadId?: string;
  contactPhone: string;
  country?: string;
  intake?: string;
}) {
  const normalized = normalizeBdPhone(params.contactPhone);
  if (!normalized) return [];

  // Check consent / opt-out
  const contact = await db.whatsAppContact.findUnique({
    where: { normalizedPhone: normalized },
  });
  if (contact?.isOptedOut) return [];

  // Check if application active — if active, pause generic follow-up
  const activeApp = await db.aloApplication.findFirst({
    where: { studentId: params.studentId, status: { notIn: ['cancelled','closed','rejected'] } },
  });
  if (activeApp) {
    // Pause generic follow-up when application active
    return [];
  }

  const created: any[] = [];
  const now = new Date();

  for (const day of DEFAULT_FOLLOWUP_DAYS) {
    const scheduledAt = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);

    // Idempotency: don't create duplicate for same student+day
    const existing = await db.whatsAppFollowUpSchedule.findFirst({
      where: { studentId: params.studentId, scheduledDay: day, status: { in: ['scheduled','sent'] } },
    });
    if (existing) continue;

    const template = await db.whatsAppFollowUpTemplate.findFirst({
      where: { day, activeStatus: 'active' },
    });

    const schedule = await db.whatsAppFollowUpSchedule.create({
      data: {
        studentId: params.studentId,
        leadId: params.leadId || '',
        contactPhone: normalized,
        templateId: template?.id || '',
        scheduledDay: day,
        scheduledAt,
        status: 'scheduled',
      },
    });
    created.push(schedule);
  }

  return created;
}

export async function handleStopStartCommand(phone: string, message: string) {
  const normalized = normalizeBdPhone(phone);
  const lower = message.toLowerCase().trim();

  if (lower === 'stop' || lower.includes('stop messages') || lower === 'unsubscribe') {
    await db.whatsAppContact.upsert({
      where: { normalizedPhone: normalized },
      update: { isOptedOut: true, optedOutAt: new Date(), optOutReason: 'STOP command' },
      create: {
        phone,
        normalizedPhone: normalized,
        displayName: phone,
        isOptedOut: true,
        optedOutAt: new Date(),
        optOutReason: 'STOP command',
      },
    });

    // Cancel scheduled follow-ups
    await db.whatsAppFollowUpSchedule.updateMany({
      where: { contactPhone: normalized, status: 'scheduled' },
      data: { status: 'cancelled', isOptedOut: true, pauseReason: 'STOP command' },
    });

    await db.communicationConsent.upsert({
      where: { id: `consent-${normalized}` },
      update: { consentGiven: false, optedOutAt: new Date(), optOutReason: 'STOP' },
      create: {
        id: `consent-${normalized}`,
        contactId: normalized,
        contactType: 'student',
        channel: 'whatsapp',
        consentGiven: false,
        optedOutAt: new Date(),
        optOutReason: 'STOP',
      },
    }).catch(() => {});

    return { action: 'STOP', optedOut: true };
  }

  if (lower === 'start' || lower.includes('start messages') || lower === 'subscribe') {
    await db.whatsAppContact.update({
      where: { normalizedPhone: normalized },
      data: { isOptedOut: false, optedOutAt: null },
    }).catch(() => {});

    // Reactivate follow-up according to policy (only if no active app)
    return { action: 'START', optedIn: true };
  }

  return { action: 'NONE' };
}

export async function processDueFollowUps() {
  const now = new Date();
  const due = await db.whatsAppFollowUpSchedule.findMany({
    where: {
      scheduledAt: { lte: now },
      status: 'scheduled',
      isOptedOut: false,
      isPaused: false,
      attemptCount: { lt: 3 },
    },
    take: 50,
    orderBy: { scheduledAt: 'asc' },
  });

  const results: any[] = [];

  for (const item of due) {
    try {
      // Fetch student and template
      const student = await db.student.findUnique({ where: { id: item.studentId } }).catch(() => null) ||
                      await db.portalStudentProfile.findFirst({ where: { studentId: item.studentId } }).catch(() => null);

      const template = item.templateId ? await db.whatsAppFollowUpTemplate.findUnique({ where: { id: item.templateId } }) : null;

      let messageBody = template?.messageBody || 'Hello from ALO Education! How can we help with your study abroad journey?';

      // Replace variables
      if (student) {
        const name = (student as any).fullName || (student as any).name || 'Student';
        const code = (student as any).studentId || item.studentId;
        messageBody = messageBody
          .replace(/\{\{name\}\}/g, name)
          .replace(/\{\{student_code\}\}/g, code)
          .replace(/\{\{portal_link\}\}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://aloeducation.com'}/student/login`)
          .replace(/\{\{counselor_name\}\}/g, (student as any).counselorName || 'ALO Counselor')
          .replace(/\{\{branch_name\}\}/g, 'Dhaka Main')
          .replace(/\{\{country\}\}/g, (student as any).preferredCountry || (student as any).currentCountry || 'UK')
          .replace(/\{\{intake\}\}/g, (student as any).preferredIntake || 'Sep 2025');
      }

      // Idempotency: check if already sent same day
      const alreadySent = await db.whatsAppFollowUpSchedule.findFirst({
        where: {
          studentId: item.studentId,
          scheduledDay: item.scheduledDay,
          status: 'sent',
          sentAt: { gte: new Date(now.getTime() - 24*60*60*1000) },
        },
      });
      if (alreadySent) {
        await db.whatsAppFollowUpSchedule.update({
          where: { id: item.id },
          data: { status: 'cancelled', pauseReason: 'duplicate prevented' },
        });
        continue;
      }

      // Send via WhatsApp Cloud API (graceful if not configured)
      const sendResult = await sendWhatsAppMessage({
        to: item.contactPhone,
        text: messageBody,
        templateName: template?.metaTemplateName || undefined,
      });

      await db.whatsAppFollowUpSchedule.update({
        where: { id: item.id },
        data: {
          status: sendResult.success ? 'sent' : 'failed',
          sentAt: sendResult.success ? new Date() : undefined,
          messageId: sendResult.messageId || '',
          attemptCount: { increment: 1 },
          lastError: sendResult.error || '',
        },
      });

      // Audit
      await db.aloAuditLog.create({
        data: {
          studentId: item.studentId,
          actorType: 'system',
          actorName: 'followup-engine',
          action: 'FOLLOWUP_SENT',
          resource: 'WhatsAppFollowUpSchedule',
          resourceId: item.id,
          details: JSON.stringify({ day: item.scheduledDay, phone: item.contactPhone, messageId: sendResult.messageId }),
        },
      }).catch(() => {});

      results.push({ id: item.id, success: sendResult.success, day: item.scheduledDay });
    } catch (err: any) {
      await db.whatsAppFollowUpSchedule.update({
        where: { id: item.id },
        data: {
          attemptCount: { increment: 1 },
          lastError: err.message,
          status: item.attemptCount + 1 >= 3 ? 'failed' : 'scheduled',
          scheduledAt: new Date(now.getTime() + 60*60*1000), // retry in 1h
        },
      });
      results.push({ id: item.id, success: false, error: err.message });
    }
  }

  return results;
}
