/**
 * Template Engine — 30+ categories, variable substitution, visibility, approval workflow
 */
import { db } from '@/lib/db';

export const TEMPLATE_CATEGORIES = [
  'new_lead_welcome',
  'profile_incomplete',
  'document_missing',
  'document_approved',
  'document_rejected',
  'course_recommendation',
  'application_created',
  'application_submitted',
  'conditional_offer',
  'unconditional_offer',
  'deposit_pending',
  'cas_pending',
  'cas_received',
  'i20_pending',
  'i20_received',
  'coe_pending',
  'coe_received',
  'visa_file_started',
  'financial_docs_pending',
  'interview_pending',
  'visa_file_ready',
  'visa_submitted',
  'biometrics_scheduled',
  'visa_approved',
  'visa_rejected',
  'pre_departure',
  'partner_welcome',
  'partner_student_update',
  'commission_update',
  'marketing_campaign',
  'event_invitation',
  'appointment_reminder',
  'payment_reminder',
  'payment_instruction',
  'success',
  'review_request',
  'after_hours_auto_reply',
  'complaint_acknowledgement',
] as const;

// Default templates per spec — created idempotently
export const DEFAULT_TEMPLATES: Array<{
  /** Spec §174 — the official ALO templates are locked: they may be re-worded by
   *  an authorized admin only, and never deleted through the normal UI. */
  locked?: boolean;
  templateCode: string; templateName: string; channel: string; category: string; language: string; body: string; variables: string[]; visibility: string; requiresApproval: boolean;
}> = [
  { templateCode: 'TPL-NEW-LEAD-WA', templateName: 'New lead welcome (WhatsApp)', channel: 'whatsapp', category: 'new_lead_welcome', language: 'english', body: 'Hi {{name}}, welcome to ALO Education! Your counselor {{counselor}} will contact you shortly. Preferred country: {{country}}, Level: {{level}}, Intake: {{intake}}. Need help? Reply here.', variables: ['name','counselor','country','level','intake'], visibility: 'public_safe', requiresApproval: false },
  { templateCode: 'TPL-PROFILE-INCOMPLETE', templateName: 'Student profile incomplete', channel: 'portal', category: 'profile_incomplete', language: 'english', body: 'Hi {{name}}, your ALO Student Portal profile is {{completion}}% complete. Missing: {{missingFields}}. Complete now: {{portalLink}}', variables: ['name','completion','missingFields','portalLink'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-DOC-MISSING', templateName: 'Document missing', channel: 'portal', category: 'document_missing', language: 'english', body: 'Hi {{name}}, we need your {{documentName}} for application {{applicationId}}. Please upload via {{uploadLink}}. Deadline: {{deadline}}.', variables: ['name','documentName','applicationId','uploadLink','deadline'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-DOC-APPROVED', templateName: 'Document approved', channel: 'portal', category: 'document_approved', language: 'english', body: 'Great news {{name}}! Your {{documentName}} has been approved. Next step: {{nextStep}}.', variables: ['name','documentName','nextStep'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-DOC-REJECTED', templateName: 'Document rejected — request again', channel: 'portal', category: 'document_rejected', language: 'english', body: 'Hi {{name}}, your {{documentName}} was rejected: {{reason}}. Please re-upload a clear scan via {{uploadLink}}.', variables: ['name','documentName','reason','uploadLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-COURSE-RECO', templateName: 'Course recommendation', channel: 'email', category: 'course_recommendation', language: 'english', body: 'Hi {{name}}, based on your profile ({{level}}, {{country}}, {{intake}}), we recommend: {{courseList}}. Compare & shortlist: {{courseFinderLink}}', variables: ['name','level','country','intake','courseList','courseFinderLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-APP-SUBMITTED', templateName: 'Application submitted', channel: 'portal', category: 'application_submitted', language: 'english', body: 'Hi {{name}}, your application to {{university}} — {{course}} ({{intake}}) has been submitted. Application ID: {{applicationId}}. Track: {{trackLink}}', variables: ['name','university','course','intake','applicationId','trackLink'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-COND-OFFER', templateName: 'Conditional offer received', channel: 'portal', category: 'conditional_offer', language: 'english', body: 'Congratulations {{name}}! Conditional offer from {{university}} — {{course}}. Conditions: {{conditions}}. Deadline: {{deadline}}.', variables: ['name','university','course','conditions','deadline'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-UNCOND-OFFER', templateName: 'Unconditional offer received', channel: 'portal', category: 'unconditional_offer', language: 'english', body: 'Congratulations {{name}}! Unconditional offer from {{university}} — {{course}}. Next: deposit {{depositAmount}} by {{depositDeadline}}.', variables: ['name','university','course','depositAmount','depositDeadline'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-DEPOSIT-REMINDER', templateName: 'Deposit reminder', channel: 'portal', category: 'deposit_pending', language: 'english', body: 'Hi {{name}}, reminder: deposit {{depositAmount}} for {{university}} due {{depositDeadline}}. Pay via {{payLink}}.', variables: ['name','depositAmount','university','depositDeadline','payLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-CAS-PENDING', templateName: 'CAS/I-20/COE pending', channel: 'portal', category: 'cas_pending', language: 'english', body: 'Hi {{name}}, your {{docType}} for {{university}} is pending. We will notify once received. Ref: {{reference}}.', variables: ['name','docType','university','reference'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-CAS-RECEIVED', templateName: 'CAS/I-20/COE received', channel: 'portal', category: 'cas_received', language: 'english', body: 'Great news {{name}}! Your {{docType}} for {{university}} is received. Ref: {{reference}}. Next: visa filing.', variables: ['name','docType','university','reference'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-VISA-FILE-STARTED', templateName: 'Visa file started', channel: 'portal', category: 'visa_file_started', language: 'english', body: 'Hi {{name}}, your visa file for {{country}} is started. Checklist: {{checklistLink}}. Officer: {{officerName}}.', variables: ['name','country','checklistLink','officerName'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-FINANCIAL-DOCS', templateName: 'Financial proof reminder', channel: 'portal', category: 'financial_docs_pending', language: 'english', body: 'Hi {{name}}, please provide financial proof: {{docList}}. Bank statement must cover {{amount}} for {{duration}}. Upload: {{uploadLink}}', variables: ['name','docList','amount','duration','uploadLink'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-INTERVIEW-PRACTICE', templateName: 'Interview practice reminder', channel: 'portal', category: 'interview_pending', language: 'english', body: 'Hi {{name}}, your visa interview practice is scheduled {{dateTime}}. Join: {{meetLink}}. Prepare with prep pack: {{prepLink}}.', variables: ['name','dateTime','meetLink','prepLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-VISA-SUBMITTED', templateName: 'Visa submitted', channel: 'portal', category: 'visa_submitted', language: 'english', body: 'Hi {{name}}, your visa application for {{country}} has been submitted. Biometrics: {{biometricsDate}}. Track via VFS/portal.', variables: ['name','country','biometricsDate'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-VISA-APPROVED', templateName: 'Visa approved', channel: 'portal', category: 'visa_approved', language: 'english', body: 'Congratulations {{name}}! Your visa for {{country}} is approved. Pre-departure session: {{sessionLink}}.', variables: ['name','country','sessionLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-VISA-REJECTED', templateName: 'Visa rejected', channel: 'portal', category: 'visa_rejected', language: 'english', body: 'Hi {{name}}, your visa for {{country}} was unfortunately not approved. Our team will review refusal & next steps. Book review: {{bookLink}}', variables: ['name','country','bookLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-PRE-DEPARTURE', templateName: 'Pre-departure checklist', channel: 'portal', category: 'pre_departure', language: 'english', body: 'Hi {{name}}, pre-departure checklist for {{country}}: {{checklist}}. Session {{dateTime}}: {{meetLink}}.', variables: ['name','country','checklist','dateTime','meetLink'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-PARTNER-SUPPORT', templateName: 'Partner support reply', channel: 'portal', category: 'partner_welcome', language: 'english', body: 'Hi {{partnerName}}, thank you for contacting ALO Support. About student {{studentName}} ({{studentId}}): {{reply}}. Regards, ALO Team.', variables: ['partnerName','studentName','studentId','reply'], visibility: 'partner_visible', requiresApproval: false },
  { templateCode: 'TPL-COMMISSION-UPDATE', templateName: 'Commission status update', channel: 'portal', category: 'commission_update', language: 'english', body: 'Hi {{partnerName}}, commission for application {{applicationId}} — {{university}} is now {{status}}: {{amount}}. Wallet: {{walletLink}}.', variables: ['partnerName','applicationId','university','status','amount','walletLink'], visibility: 'partner_visible', requiresApproval: false },
  { templateCode: 'TPL-APPOINTMENT-CONFIRM', templateName: 'Appointment confirmation', channel: 'sms', category: 'appointment_reminder', language: 'english', body: 'Your appointment with {{counselor}} on {{dateTime}} at {{location}} is confirmed. Reply YES to confirm or RESCHEDULE.', variables: ['counselor','dateTime','location'], visibility: 'public_safe', requiresApproval: false },
  { templateCode: 'TPL-MISSED-CALL', templateName: 'Missed call follow-up', channel: 'sms', category: 'appointment_reminder', language: 'english', body: 'Hi {{name}}, we missed your call. Our team will call back within 2 hours. Or book a slot: {{bookLink}}.', variables: ['name','bookLink'], visibility: 'public_safe', requiresApproval: false },
  { templateCode: 'TPL-AFTER-HOURS', templateName: 'After-hours reply', channel: 'whatsapp', category: 'after_hours_auto_reply', language: 'english', body: 'Thanks for contacting ALO Education. Our team is currently outside office hours. Please share your name, phone number, preferred country, study level, and intake. Our counselor will contact you as soon as possible.', variables: [], visibility: 'public_safe', requiresApproval: false },
  // ── Spec §174 — locked official templates that were missing ────────────────
  { locked: true, templateCode: 'TPL-PAYMENT-INSTRUCTION', templateName: 'Payment instruction (official)', channel: 'portal', category: 'payment_instruction', language: 'english', body: 'Dear {{name}}, payment instructions for {{university}} — {{course}}: amount {{amount}} {{currency}}, due {{deadline}}, payable by {{method}} to {{beneficiary}}. Reference: {{reference}}. Only pay to the account printed on the university\'s official letter. If any detail looks different, stop and call your counselor on {{counselorPhone}} before sending money.', variables: ['name','university','course','amount','currency','deadline','method','beneficiary','reference','counselorPhone'], visibility: 'student_visible', requiresApproval: true },
  { locked: true, templateCode: 'TPL-SUCCESS', templateName: 'Success (offer/visa achieved)', channel: 'portal', category: 'success', language: 'english', body: 'Congratulations {{name}}! {{milestone}} for {{university}} — {{course}} ({{intake}}). Your ALO counselor {{counselor}} will guide you through the next steps. Ref: {{reference}}.', variables: ['name','milestone','university','course','intake','counselor','reference'], visibility: 'student_visible', requiresApproval: false },
  { locked: true, templateCode: 'TPL-REVIEW-REQUEST', templateName: 'Review request (feedback)', channel: 'portal', category: 'review_request', language: 'english', body: 'Hi {{name}}, thank you for choosing ALO Education for your {{country}} journey. If we helped you, would you share a short review here: {{reviewLink}}? Your feedback helps other students in Bangladesh. — {{counselor}}', variables: ['name','country','reviewLink','counselor'], visibility: 'student_visible', requiresApproval: false },
  { templateCode: 'TPL-COMPLAINT-ACK', templateName: 'Complaint acknowledgement', channel: 'portal', category: 'complaint_acknowledgement', language: 'english', body: 'Hi {{name}}, thank you for reporting: {{issue}}. Ticket {{ticketId}} created. Our manager will update within 24 hours.', variables: ['name','issue','ticketId'], visibility: 'public_safe', requiresApproval: false },
];

export function renderTemplate(body: string, vars: Record<string,string>): string {
  let out = body;
  for (const [k,v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v ?? '');
    out = out.split(`{{ ${k} }}`).join(v ?? '');
  }
  // Remove any unreplaced variables
  out = out.replace(/\{\{[^}]+\}\}/g, '');
  return out;
}

export async function ensureDefaultTemplates() {
  for (const t of DEFAULT_TEMPLATES) {
    const exists = await db.communicationTemplate.findFirst({ where: { templateCode: t.templateCode } }).catch(()=>null);
    if (!exists) {
      await db.communicationTemplate.create({
        data: {
          templateCode: t.templateCode,
          templateName: t.templateName,
          channel: t.channel,
          category: t.category,
          language: t.language,
          body: t.body,
          variables: JSON.stringify(t.variables),
          visibility: t.visibility,
          requiresApproval: t.requiresApproval,
          isLocked: !!t.locked,
          status: 'active',
          createdBy: 'system-seed',
        }
      }).catch(()=>{});
    }
  }
}

/**
 * Spec §174 — the official templates ALO must send. Each entry lists the template
 * code that satisfies it, so this mapping doubles as the review checklist.
 */
export const OFFICIAL_TEMPLATE_MAP: Record<string, string[]> = {
  'Document Request': ['TPL-DOC-MISSING'],
  'Offer Notification': ['TPL-COND-OFFER', 'TPL-UNCOND-OFFER'],
  'Payment Instruction': ['TPL-PAYMENT-INSTRUCTION'],
  'Payment Reminder': ['TPL-DEPOSIT-REMINDER'],
  'Interview Reminder': ['TPL-INTERVIEW-PRACTICE'],
  'Visa Reminder': ['TPL-VISA-FILE-STARTED'],
  'Success': ['TPL-SUCCESS'],
  'Review Request': ['TPL-REVIEW-REQUEST'],
};

/** Codes that are locked: re-wordable by an authorized admin, never deletable. */
export const LOCKED_TEMPLATE_CODES: string[] = Object.values(OFFICIAL_TEMPLATE_MAP)
  .flat()
  .filter((code, index, all) => all.indexOf(code) === index);

export function isLockedTemplate(templateCode: string): boolean {
  return LOCKED_TEMPLATE_CODES.includes(templateCode);
}

/**
 * Guard for template edits. A locked official template is never deleted and may
 * only be changed by a super admin who states a reason — the wording students
 * receive about payments, visas and offers must not drift silently.
 */
export function validateTemplateEdit(input: {
  templateCode: string;
  actorRoles: string[];
  action: 'edit' | 'delete' | 'deactivate';
  reason?: string;
}): { allowed: boolean; code: string; message: string } {
  if (!isLockedTemplate(input.templateCode)) return { allowed: true, code: 'NOT_LOCKED', message: 'Template is not locked.' };
  if (input.action === 'delete') {
    return {
      allowed: false,
      code: 'LOCKED_TEMPLATE_DELETE_FORBIDDEN',
      message: 'Official templates cannot be deleted. Create a new version instead so the wording sent to past students stays auditable.',
    };
  }
  const isSuperAdmin = (input.actorRoles || []).map((role) => role.toLowerCase()).includes('super_admin');
  if (!isSuperAdmin) {
    return { allowed: false, code: 'LOCKED_TEMPLATE_ROLE_REQUIRED', message: 'Only a super admin may change an official template.' };
  }
  if (!input.reason || input.reason.trim().length < 10) {
    return { allowed: false, code: 'LOCKED_TEMPLATE_REASON_REQUIRED', message: 'A reason of at least 10 characters is required to change an official template.' };
  }
  return { allowed: true, code: 'SUPER_ADMIN_EDIT', message: 'Official template changed by super admin; the previous version remains in the audit log.' };
}

export async function useTemplate(templateCode: string, variables: Record<string,string>, overrides?: { language?: string; channel?: string }) {
  const tpl = await db.communicationTemplate.findFirst({ where: { templateCode } }).catch(()=>null);
  if (!tpl) throw new Error(`Template ${templateCode} not found`);
  if (tpl.status !== 'active' && tpl.status !== 'approved' && tpl.status !== 'APPROVED') throw new Error(`Template ${templateCode} not active`);
  const rendered = renderTemplate(tpl.body, variables);
  return { template: tpl, rendered, variables };
}
