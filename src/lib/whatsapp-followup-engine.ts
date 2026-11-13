/**
 * WhatsApp Follow-Up Engine — ALO Education
 * Default schedule: Day 3,7,14,21,25,30 sender 01805020100
 * Respects STOP/START, consent, application status, partner-only mode
 */

import { db } from '@/lib/db';
import { determineSenderNumber, MAIN_NUMBER } from './whatsapp-number-pool';
import { normalizePhone, phoneVariants } from '@/lib/phone-normalization';
import { isEligibleForMarketing, recordConsent, withdrawConsent } from '@/lib/communications/consent-management';
import { sendWhatsAppMessage } from './whatsapp-cloud-api';
import { hasActiveAloApplication } from './partner/entitlement-policy';

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
      approvalStatus: 'pending',
      activeStatus: 'inactive',
    },
    {
      templateName: 'followup_day7',
      day: 7,
      language: 'mixed',
      purpose: 'follow_up',
      messageBody: 'Hello {{name}}, ALO Education here! Your counselor {{counselor_name}} from {{branch_name}} branch is ready to assist for {{country}} {{intake}}. Documents upload korchen? Portal: {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day7',
      approvalStatus: 'pending',
      activeStatus: 'inactive',
    },
    {
      templateName: 'followup_day14',
      day: 14,
      language: 'english',
      purpose: 'follow_up',
      messageBody: 'Hi {{name}}, quick check-in from ALO Education. Your student code {{student_code}} for {{country}} is active. Need help with offer letter or CAS? Reply here or visit {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day14',
      approvalStatus: 'pending',
      activeStatus: 'inactive',
    },
    {
      templateName: 'followup_day21',
      day: 21,
      language: 'bangla',
      purpose: 'follow_up',
      messageBody: '{{name}}, ALO Education theke reminder. {{country}} er {{intake}} intake er deadline kache. Document gulo upload korechen? Help lagle {{counselor_name}} ke knock korun. {{portal_link}}',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day21',
      approvalStatus: 'pending',
      activeStatus: 'inactive',
    },
    {
      templateName: 'followup_day25',
      day: 25,
      language: 'mixed',
      purpose: 'follow_up',
      messageBody: '{{name}}, last follow-up from ALO! {{country}} application still pending? Amra apnake full support dibo. Counselor: {{counselor_name}} ({{branch_name}}). Portal: {{portal_link}}. STOP likhe opt-out korte paren.',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day25',
      approvalStatus: 'pending',
      activeStatus: 'inactive',
    },
    {
      templateName: 'followup_day30',
      day: 30,
      language: 'english',
      purpose: 'follow_up',
      messageBody: 'Final reminder {{name}} — ALO Education. Your profile {{student_code}} for {{country}} {{intake}} is still open. If you wish to continue, reply START. Portal: {{portal_link}}. To stop messages, reply STOP.',
      variables: JSON.stringify(['{{name}}','{{student_code}}','{{portal_link}}','{{counselor_name}}','{{branch_name}}','{{country}}','{{intake}}']),
      metaTemplateName: 'alo_followup_day30',
      approvalStatus: 'pending',
      activeStatus: 'inactive',
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
  const normalized = normalizePhone(params.contactPhone);
  if (!normalized) return [];

  const student = await db.student.findFirst({
    where: { OR: [{ id: params.studentId }, { studentId: params.studentId }] },
    select: { id: true, studentId: true, phone: true },
  });
  if (!student || normalizePhone(student.phone || '') !== normalized) return [];

  const contact = await db.whatsAppContact.findUnique({ where: { normalizedPhone: normalized } });
  if (contact?.isBlocked || contact?.isOptedOut) return [];
  const consent = await isEligibleForMarketing({
    contactId: contact?.id,
    phone: normalized,
    studentId: student.id,
    leadId: params.leadId,
    channel: 'WHATSAPP',
    purpose: 'PROMOTIONAL_MARKETING',
  }).catch(() => ({ eligible: false as const, reason: 'missing_consent' as const }));
  if (!consent.eligible) return [];

  const applications = await db.aloApplication.findMany({
    where: { studentId: student.id },
    select: { stage: true, appliedAt: true },
    take: 25,
  });
  if (hasActiveAloApplication(applications.map((application) => ({ stage: application.stage, submittedAt: application.appliedAt })))) return [];

  const templates = await db.whatsAppFollowUpTemplate.findMany({
    where: {
      day: { in: DEFAULT_FOLLOWUP_DAYS },
      activeStatus: 'active',
      approvalStatus: 'approved',
      metaTemplateStatus: 'APPROVED',
      metaTemplateName: { not: '' },
    },
    orderBy: { day: 'asc' },
  });
  const templateByDay = new Map(templates.map((template) => [template.day, template]));
  if (templateByDay.size === 0) return [];

  const officialNumber = await db.whatsAppOfficialNumber.findUnique({ where: { normalizedPhone: normalizePhone(MAIN_NUMBER) } });
  const created: any[] = [];
  const now = new Date();
  for (const day of DEFAULT_FOLLOWUP_DAYS) {
    const template = templateByDay.get(day);
    if (!template) continue;
    const idempotencyKey = `wa-followup:${student.id}:${day}:${normalized}`;
    const scheduledAt = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    try {
      const schedule = await db.whatsAppFollowUpSchedule.create({
        data: {
          studentId: student.id,
          leadId: params.leadId || '',
          contactId: contact?.id || '',
          contactPhone: normalized,
          senderNumberId: officialNumber?.id || '',
          templateId: template.id,
          scheduledDay: day,
          scheduledAt,
          status: 'scheduled',
          idempotencyKey,
        },
      });
      created.push(schedule);
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
    }
  }
  return created;
}

export async function handleStopStartCommand(phone: string, message: string, providerMessageId?: string) {
  const normalized = normalizePhone(phone);
  const lower = message.toLocaleLowerCase('bn').trim().replace(/[.!?։؟،,;:]+$/g, '');
  if (!normalized || !lower) return { action: 'NONE' as const };

  const stopCommands = new Set(['stop', 'unsubscribe', 'quit', 'cancel', 'stop messages', 'stop messaging', 'বন্ধ', 'বন্ধ করুন', 'মেসেজ বন্ধ', 'বার্তা বন্ধ']);
  const isStop = stopCommands.has(lower)
    || /(?:আর\s*)?(?:মেসেজ|বার্তা)(?:\s*পাঠাবেন)?\s*(?:না|বন্ধ)(?:\s*করুন)?/.test(lower)
    || lower.includes('do not message')
    || lower.includes('stop messages');

  if (isStop) {
    const evidenceReference = providerMessageId || `inbound-stop:${normalized}:${Date.now()}`;
    try {
      await withdrawConsent({
        phone,
        normalizedPhone: normalized,
        channel: 'WHATSAPP',
        purpose: 'PROMOTIONAL_MARKETING',
        source: 'WHATSAPP_INBOUND_COMMAND',
        method: 'EXPLICIT_STOP_KEYWORD',
        policyVersion: 'alo-whatsapp-marketing-v1',
        evidenceReference,
        text: message,
        reason: 'Recipient requested no promotional WhatsApp messages.',
        recordedById: 'system',
      });
    } catch (error) {
      console.error('[whatsapp-followup] Could not append consent withdrawal evidence; retaining fail-closed suppression', error);
    }

    const now = new Date();
    const phoneMatches = [...new Set([...phoneVariants(phone), normalized])];
    await db.whatsAppContact.upsert({
      where: { normalizedPhone: normalized },
      update: { isOptedOut: true, optedOutAt: now, optOutReason: 'STOP command' },
      create: {
        phone,
        normalizedPhone: normalized,
        displayName: 'WhatsApp contact',
        source: 'WHATSAPP',
        isOptedOut: true,
        optedOutAt: now,
        optOutReason: 'STOP command',
      },
    });
    await db.whatsAppFollowUpSchedule.updateMany({
      where: { contactPhone: { in: phoneMatches }, status: { in: ['scheduled', 'pending', 'processing', 'retrying'] } },
      data: { status: 'cancelled', isOptedOut: true, isPaused: false, pauseReason: 'STOP command' },
    }).catch(() => {});
    await db.whatsAppRetryQueue.updateMany({
      where: { recipientPhone: { in: phoneMatches }, purpose: 'promotional_marketing', status: { in: ['pending', 'retrying'] } },
      data: { status: 'cancelled', lastError: 'Cancelled after consent withdrawal', nextRetryAt: null },
    }).catch(() => {});
    await db.communicationConsent.upsert({
      where: { id: `consent-${normalized}` },
      update: { consentGiven: false, optedOutAt: now, optOutReason: 'STOP' },
      create: { id: `consent-${normalized}`, contactId: normalized, contactType: 'contact', channel: 'whatsapp', consentGiven: false, optedOutAt: now, optOutReason: 'STOP' },
    }).catch(() => {});
    return { action: 'STOP' as const, optedOut: true };
  }

  const startCommands = new Set(['start', 'subscribe', 'start messages', 'start messaging', 'শুরু', 'আবার শুরু', 'চালু করুন', 'আবার চালু']);
  const isStart = startCommands.has(lower) || lower.includes('start messages') || lower.includes('আবার চালু করুন');
  if (isStart) {
    const evidenceReference = providerMessageId || `inbound-start:${normalized}:${Date.now()}`;
    try {
      await recordConsent({
        phone,
        normalizedPhone: normalized,
        channel: 'WHATSAPP',
        purpose: 'PROMOTIONAL_MARKETING',
        status: 'OPTED_IN',
        evidence: {
          source: 'WHATSAPP_INBOUND_COMMAND',
          method: 'EXPLICIT_RENEWAL_KEYWORD',
          policyVersion: 'alo-whatsapp-marketing-v1',
          evidenceReference,
          text: message,
          recordedById: 'system',
        },
      });
      return { action: 'START' as const, optedIn: true, historicalOptOutPreserved: true };
    } catch (error) {
      // Do not clear old suppression if the append-only renewed grant could not
      // be recorded with evidence and policy version.
      console.error('[whatsapp-followup] START did not replace the previous opt-out because evidence could not be persisted', error);
      return { action: 'START' as const, optedIn: false, historicalOptOutPreserved: true };
    }
  }

  return { action: 'NONE' as const };
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
    const claim = await db.whatsAppFollowUpSchedule.updateMany({
      where: { id: item.id, status: 'scheduled', attemptCount: item.attemptCount, isOptedOut: false, isPaused: false },
      data: { status: 'processing', attemptCount: { increment: 1 }, lastConsentCheckAt: now },
    });
    if (claim.count !== 1) continue;
    const attemptsAfter = item.attemptCount + 1;

    try {
      const student = await db.student.findUnique({ where: { id: item.studentId } }).catch(() => null);
      if (!student || normalizePhone(student.phone || '') !== normalizePhone(item.contactPhone)) {
        await db.whatsAppFollowUpSchedule.update({ where: { id: item.id }, data: { status: 'cancelled', pauseReason: 'Student identity or phone no longer matches this schedule.' } });
        results.push({ id: item.id, success: false, reason: 'student_identity_or_phone_mismatch' });
        continue;
      }

      const contact = await db.whatsAppContact.findUnique({ where: { normalizedPhone: normalizePhone(item.contactPhone) } });
      if (contact?.isBlocked || contact?.isOptedOut) {
        await db.whatsAppFollowUpSchedule.update({ where: { id: item.id }, data: { status: 'cancelled', isOptedOut: Boolean(contact?.isOptedOut), pauseReason: contact?.isBlocked ? 'Contact is blocked.' : 'Promotional consent withdrawn.' } });
        results.push({ id: item.id, success: false, reason: 'suppressed' });
        continue;
      }

      const eligibility = await isEligibleForMarketing({
        contactId: item.contactId || contact?.id,
        phone: item.contactPhone,
        studentId: item.studentId,
        leadId: item.leadId || undefined,
        channel: 'WHATSAPP',
        purpose: 'PROMOTIONAL_MARKETING',
      }).catch(() => ({ eligible: false as const, reason: 'missing_consent' as const }));
      if (!eligibility.eligible) {
        await db.whatsAppFollowUpSchedule.update({ where: { id: item.id }, data: { status: 'cancelled', pauseReason: `Promotional send blocked: ${eligibility.reason}` } });
        results.push({ id: item.id, success: false, reason: eligibility.reason });
        continue;
      }

      const applications = await db.aloApplication.findMany({ where: { studentId: student.id }, select: { stage: true, appliedAt: true }, take: 25 });
      if (hasActiveAloApplication(applications.map((application) => ({ stage: application.stage, submittedAt: application.appliedAt })))) {
        await db.whatsAppFollowUpSchedule.update({ where: { id: item.id }, data: { status: 'paused', isPaused: true, pauseReason: 'Active application is in progress.' } });
        results.push({ id: item.id, success: false, reason: 'active_application' });
        continue;
      }

      const template = item.templateId
        ? await db.whatsAppFollowUpTemplate.findUnique({ where: { id: item.templateId } })
        : null;
      const recentlyVerified = Boolean(template?.metaTemplateCheckedAt && now.getTime() - template.metaTemplateCheckedAt.getTime() <= 24 * 60 * 60 * 1000);
      if (!template || template.activeStatus !== 'active' || template.approvalStatus !== 'approved' || template.metaTemplateStatus !== 'APPROVED' || !recentlyVerified || !template.metaTemplateName) {
        await db.whatsAppFollowUpSchedule.update({ where: { id: item.id }, data: { status: 'paused', isPaused: true, pauseReason: 'Template is not currently approved by ALO and verified by Meta.' } });
        results.push({ id: item.id, success: false, reason: 'template_not_approved_and_verified' });
        continue;
      }
      const approval = await db.marketingApproval.findFirst({
        where: { itemType: 'WhatsAppFollowUpTemplate', itemId: template.id, status: 'approved' },
        select: { id: true },
      });
      if (!approval) {
        await db.whatsAppFollowUpSchedule.update({ where: { id: item.id }, data: { status: 'paused', isPaused: true, pauseReason: 'Approved follow-up template approval record is missing.' } });
        results.push({ id: item.id, success: false, reason: 'approval_record_missing' });
        continue;
      }

      const name = (student as any).name || (student as any).fullName || 'Student';
      const code = (student as any).studentId || student.id;
      const values: Record<string, string> = {
        '{{name}}': name,
        '{{student_code}}': code,
        '{{portal_link}}': `${process.env.NEXT_PUBLIC_APP_URL || 'https://aloeducation.com'}/student/login`,
        '{{counselor_name}}': (student as any).counselorName || 'ALO Counselor',
        '{{branch_name}}': 'ALO Education',
        '{{country}}': (student as any).preferredCountry || (student as any).currentCountry || '',
        '{{intake}}': (student as any).preferredIntake || '',
      };
      let variables: string[] = [];
      try {
        const parsed = JSON.parse(template.variables || '[]');
        if (Array.isArray(parsed)) variables = parsed.filter((value): value is string => typeof value === 'string');
      } catch {}
      const templateParams = variables.map((variable) => values[variable] || '');
      const renderedText = Object.entries(values).reduce((text, [variable, value]) => text.replaceAll(variable, value), template.messageBody);

      const senderRoute = await determineSenderNumber({ counselorId: (student as any).counselorId || undefined, isFollowUp: true });
      const sendResult = await sendWhatsAppMessage({
        to: item.contactPhone,
        text: renderedText,
        purpose: 'PROMOTIONAL_MARKETING',
        templateName: template.metaTemplateName,
        templateLanguage: template.metaLanguage,
        templateParams,
        contactId: item.contactId || contact?.id,
        studentId: item.studentId,
        leadId: item.leadId || undefined,
        campaignId: template.id,
        approvalId: approval.id,
        actorId: 'system',
        senderNumber: senderRoute.number || MAIN_NUMBER,
      });

      const sentAt = sendResult.success ? new Date() : undefined;
      // Only a definitive provider 429 rejection is safe to retry. A timeout,
      // network error, or ambiguous 5xx may have been accepted by Meta and must
      // not cause a duplicate promotional send.
      const retry = !sendResult.success
        && Boolean(sendResult.error?.includes('HTTP_429'))
        && attemptsAfter < Math.max(1, Math.min(item.maxAttempts || 3, 3));
      await db.whatsAppFollowUpSchedule.update({
        where: { id: item.id },
        data: {
          status: sendResult.success ? 'sent' : retry ? 'scheduled' : 'failed',
          isPaused: false,
          ...(sentAt ? { sentAt } : {}),
          messageId: sendResult.messageId || '',
          lastError: sendResult.error || '',
          ...(retry ? { scheduledAt: new Date(now.getTime() + attemptsAfter * 60 * 60 * 1000) } : {}),
        },
      });

      await db.aloAuditLog.create({
        data: {
          studentId: item.studentId,
          actorType: 'system',
          actorName: 'followup-engine',
          action: sendResult.success ? 'FOLLOWUP_SENT' : 'FOLLOWUP_SEND_FAILED',
          resource: 'WhatsAppFollowUpSchedule',
          resourceId: item.id,
          details: JSON.stringify({ day: item.scheduledDay, recipientLast4: normalizePhone(item.contactPhone).slice(-4), messageId: sendResult.messageId, error: sendResult.error, consentRecordId: eligibility.consentRecordId }),
        },
      }).catch(() => {});
      results.push({ id: item.id, success: sendResult.success, day: item.scheduledDay });
    } catch (error: any) {
      const errorCode = error instanceof Error ? error.message.slice(0, 191) : 'FOLLOWUP_PROCESSING_ERROR';
      await db.whatsAppFollowUpSchedule.update({
        where: { id: item.id },
        data: {
          attemptCount: attemptsAfter,
          lastError: errorCode,
          status: attemptsAfter >= Math.max(1, Math.min(item.maxAttempts || 3, 3)) ? 'failed' : 'scheduled',
          scheduledAt: new Date(now.getTime() + attemptsAfter * 60 * 60 * 1000),
        },
      }).catch(() => {});
      results.push({ id: item.id, success: false, error: errorCode });
    }
  }
  return results;
}
