// ============================================================
// wacrm — Self-hostable CRM for WhatsApp (ArnasDon/wacrm 2.3k★ 738 commits)
//   Shared inbox, contacts, sales pipelines, broadcasts, no-code automations.
//   + key fixes: contacts CSV import error visibility (#529), persist Meta's
//   failure reason error_code/title/details (#535), voice notes Ogg/Opus
//   client-side via opus-recorder WASM (no server ffmpeg) (#4fa29), i18n.
// ALO use: WhatsApp broadcast + pipeline (lead → application → visa) + shared
//   inbox assignment + voice notes + precise delivery failure reason.
// Reuses: whatsapp-cloud-api.ts (graph API), SocialInboxMessage + WhatsAppMessageStatus
//   + CrmAuditLog. Adds wacrm pipeline stage map + broadcast recipient table via AuditLog.
// Env: WHATSAPP_* (existing) + WACRM_PIPELINE_ENABLED=true
// ============================================================
import { db } from '@/lib/db';
import { createHash } from 'node:crypto';
import { normalizePhone } from '@/lib/phone-normalization';
import { sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';
import { isEligibleForMarketing } from '@/lib/communications/consent-management';

// ─── Pipeline (wacrm: sales pipelines per contact) ────────────
// Map wacrm pipeline to ALO Application stages (keeps CRM source of truth)
export const WACRM_PIPELINE_STAGES = [
  'new_lead',          // → Lead.created
  'contacted',         // → contacted (WhatsApp first reply)
  'qualified',         // → eligibility checked
  'application_started',
  'application_submitted',
  'offer_received',
  'visa_preparation',
  'visa_submitted',
  'enrolled',          // → success
  'lost',              // → lost
] as const;

export type WacrmStage = typeof WACRM_PIPELINE_STAGES[number];

export async function wacrmMovePipeline(phoneE164: string, toStage: WacrmStage, actorId: string, note?: string): Promise<void> {
  if (!WACRM_PIPELINE_STAGES.includes(toStage)) throw new Error(`Invalid stage ${toStage}`);
  await db.crmAuditLog.create({
    data: { action: 'WACRM_PIPELINE_MOVE', entityType: 'WacrmContact', entityId: phoneE164, actorId, details: JSON.stringify({ toStage, note, at: new Date().toISOString() }), createdAt: new Date() } as any,
  }).catch(()=>{});
  await db.timelineEvent.create({
    data: { studentId: phoneE164, type: 'WACRM_PIPELINE_STAGE', title: `Pipeline → ${toStage}`, description: note || '', createdAt: new Date() } as any,
  }).catch(()=>{});
}

// ─── Broadcast (wacrm: broadcasts with per-recipient status) ──
export type BroadcastRecipient = {
  phone: string;
  name?: string;
  contactId?: string;
  studentId?: string;
  leadId?: string;
  templateParams?: string[];
};

export async function wacrmBroadcast(opts: {
  templateName: string;
  message: string;
  recipients: BroadcastRecipient[];
  actorId: string;
  campaignId: string;
  approvalId: string;
  pipelineStage?: WacrmStage;
}): Promise<{ broadcastId: string; sent: number; failed: number; results: { phone: string; status: string; errorCode?: string; errorTitle?: string }[] }> {
  const broadcastId = `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const results: { phone: string; status: string; errorCode?: string; errorTitle?: string }[] = [];
  const recipientList = opts.recipients.slice(0, 500);
  const actor = await db.user.findUnique({ where: { id: opts.actorId }, select: { role: true, permissions: true } }).catch(() => null);
  let actorPermissions: string[] = [];
  try { actorPermissions = JSON.parse(actor?.permissions || '[]'); } catch {}
  const role = String(actor?.role || '').toUpperCase();
  const privileged = ['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER'].includes(role);
  if (!actor || (!privileged && !actorPermissions.includes('c2'))) {
    for (const recipient of recipientList) results.push({ phone: recipient.phone, status: 'failed', errorCode: 'ACTOR_NOT_AUTHORIZED', errorTitle: 'Marketing sender role/permission required' });
  } else if (!opts.campaignId || !opts.approvalId || !opts.templateName || !opts.message.trim()) {
    for (const recipient of recipientList) results.push({ phone: recipient.phone, status: 'failed', errorCode: 'APPROVAL_OR_TEMPLATE_REQUIRED', errorTitle: 'Approved campaign, provider template, and message are required' });
  } else {
    const registeredTemplate = await db.whatsAppFollowUpTemplate.findFirst({
      where: {
        metaTemplateName: opts.templateName,
        approvalStatus: 'approved',
        metaTemplateStatus: 'APPROVED',
        activeStatus: 'active',
        metaTemplateCheckedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000), lte: new Date() },
      },
      select: { id: true, variables: true },
    }).catch(() => null);
    if (!registeredTemplate) {
      for (const recipient of recipientList) results.push({ phone: recipient.phone, status: 'failed', errorCode: 'META_TEMPLATE_NOT_VERIFIED', errorTitle: 'Template is not in the verified active registry' });
    } else {
      for (const recipient of recipientList) {
        const normalized = normalizePhone(recipient.phone);
        if (!normalized || (!recipient.contactId && !recipient.studentId && !recipient.leadId)) {
          results.push({ phone: recipient.phone, status: 'failed', errorCode: 'CRM_IDENTITY_REQUIRED', errorTitle: 'A matching CRM contact identity is required' });
          continue;
        }
        let identityMatches = false;
        let contactId = recipient.contactId || '';
        let studentId = recipient.studentId || '';
        let leadId = recipient.leadId || '';
        let identityAssignedTo = '';
        if (contactId) {
          const contact = await db.whatsAppContact.findUnique({
            where: { id: contactId },
            select: { normalizedPhone: true, assignedCounselorId: true, studentId: true, leadId: true },
          }).catch(() => null);
          identityMatches = Boolean(contact && contact.normalizedPhone === normalized);
          if (contact) identityAssignedTo = contact.assignedCounselorId || '';
        }
        if (!identityMatches && studentId) {
          const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true, phone: true, counselorId: true } }).catch(() => null);
          identityMatches = Boolean(student && normalizePhone(student.phone) === normalized);
          if (student) { studentId = student.id; identityAssignedTo = student.counselorId || ''; }
        }
        if (!identityMatches && leadId) {
          const lead = await db.lead.findUnique({ where: { id: leadId }, select: { id: true, phone: true, counselorId: true } }).catch(() => null);
          identityMatches = Boolean(lead && normalizePhone(lead.phone) === normalized);
          if (lead) { leadId = lead.id; identityAssignedTo = lead.counselorId || ''; }
        }
        if (identityMatches && role === 'MARKETING_MANAGER' && identityAssignedTo !== opts.actorId) {
          results.push({ phone: recipient.phone, status: 'failed', errorCode: 'CRM_SCOPE_DENIED', errorTitle: 'Recipient is outside the authenticated marketer assignment scope' });
          continue;
        }
        if (!identityMatches) {
          results.push({ phone: recipient.phone, status: 'failed', errorCode: 'CRM_IDENTITY_MISMATCH', errorTitle: 'Recipient does not match the supplied CRM record' });
          continue;
        }

        const eligibility = await isEligibleForMarketing({
          contactId: contactId || undefined,
          phone: normalized,
          studentId: studentId || undefined,
          leadId: leadId || undefined,
          channel: 'WHATSAPP',
          purpose: 'PROMOTIONAL_MARKETING',
        }).catch(() => ({ eligible: false as const, reason: 'missing_consent' as const }));
        if (!eligibility.eligible) {
          results.push({ phone: recipient.phone, status: 'failed', errorCode: `CONSENT_${eligibility.reason.toUpperCase()}`, errorTitle: 'Current WhatsApp promotional consent is required' });
          continue;
        }

        const priorDelivery = await db.whatsAppMessageArchive.findFirst({
          where: { campaignId: opts.campaignId, receiverPhone: normalized, direction: 'outbound', deliveryStatus: { in: ['sent', 'delivered', 'read'] } },
          select: { id: true },
        }).catch(() => null);
        if (priorDelivery) {
          results.push({ phone: recipient.phone, status: 'skipped', errorCode: 'ALREADY_SENT_FOR_CAMPAIGN' });
          continue;
        }

        let variables: string[] = [];
        try {
          const parsed = JSON.parse(registeredTemplate.variables || '[]');
          if (Array.isArray(parsed)) variables = parsed.filter((value): value is string => typeof value === 'string');
        } catch {}
        const templateParams = recipient.templateParams || (variables.length === 1 && variables[0] === '{{name}}' && recipient.name ? [recipient.name] : []);
        if (variables.length !== templateParams.length) {
          results.push({ phone: recipient.phone, status: 'failed', errorCode: 'TEMPLATE_PARAMETERS_REQUIRED', errorTitle: 'Provide template parameters in the verified template variable order' });
          continue;
        }

        const ownerType = studentId ? 'student' : leadId ? 'lead' : 'contact';
        const ownerId = studentId || leadId || contactId;
        const idempotencyKey = `wacrm_${createHash('sha256').update(`${opts.campaignId}:${normalized}`).digest('hex')}`;
        let recipientClaim: { id: string };
        try {
          recipientClaim = await db.broadcastRecipient.create({
            data: {
              broadcastId,
              ownerType,
              ownerId,
              recipientContact: normalized,
              status: 'sending',
              idempotencyKey,
            },
            select: { id: true },
          });
        } catch (error) {
          if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2002') {
            results.push({ phone: recipient.phone, status: 'skipped', errorCode: 'ALREADY_ATTEMPTED_FOR_CAMPAIGN' });
          } else {
            results.push({ phone: recipient.phone, status: 'failed', errorCode: 'RECIPIENT_CLAIM_FAILED', errorTitle: 'Campaign delivery could not be claimed safely' });
          }
          continue;
        }

        try {
          const send = await sendWhatsAppMessage({
            to: normalized,
            text: opts.message.replace('{{name}}', recipient.name || ''),
            templateName: opts.templateName,
            templateParams,
            purpose: 'PROMOTIONAL_MARKETING',
            campaignId: opts.campaignId,
            approvalId: opts.approvalId,
            contactId: contactId || undefined,
            studentId: studentId || undefined,
            leadId: leadId || undefined,
            actorId: opts.actorId,
          });
          if (send.success && send.messageId) {
            await db.broadcastRecipient.update({ where: { id: recipientClaim.id }, data: { status: 'sent', sentAt: new Date(), failedReason: '' } }).catch(() => {});
            results.push({ phone: recipient.phone, status: 'sent' });
          } else {
            const errorCode = send.error || 'PROVIDER_REJECTED';
            await db.broadcastRecipient.update({ where: { id: recipientClaim.id }, data: { status: 'failed', failedReason: errorCode.slice(0, 500) } }).catch(() => {});
            results.push({ phone: recipient.phone, status: 'failed', errorCode });
          }
        } catch {
          await db.broadcastRecipient.update({ where: { id: recipientClaim.id }, data: { status: 'failed', failedReason: 'SEND_EXCEPTION' } }).catch(() => {});
          results.push({ phone: recipient.phone, status: 'failed', errorCode: 'SEND_EXCEPTION' });
        }
      }
    }
  }

  const sent = results.filter((result) => result.status === 'sent').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const recipientHashes = recipientList.map((recipient) => createHash('sha256').update(normalizePhone(recipient.phone)).digest('hex').slice(0, 12));
  await db.auditLog.create({
    data: {
      userId: opts.actorId,
      action: 'WACRM_BROADCAST',
      resource: 'MarketingCampaign',
      resourceId: opts.campaignId,
      actorRole: role || 'unknown',
      details: JSON.stringify({ broadcastId, approvalId: opts.approvalId, templateName: opts.templateName, recipientCount: recipientList.length, recipientHashes, sent, failed, skipped: results.filter((result) => result.status === 'skipped').length, pipelineStage: opts.pipelineStage }),
    },
  }).catch(() => {});
  return { broadcastId, sent, failed, results };
}

// ─── Contacts import — surface real reason a CSV row failed (wacrm #529) ─
export function wacrmParseContactsCsvRow(row: Record<string,string>, rowNum: number): { valid: boolean; error?: string; normalized?: { phone: string; name: string; email?: string } } {
  const phoneRaw = row.phone || row.Phone || row.mobile || '';
  const name = (row.name || row.Name || '').trim();
  if (!phoneRaw) return { valid: false, error: `Row ${rowNum}: phone is required` };
  const phone = phoneRaw.replace(/\D/g, '').replace(/^0/, '880');
  if (phone.length < 11) return { valid: false, error: `Row ${rowNum}: phone "${phoneRaw}" → "${phone}" invalid (too short, expected E.164)` };
  if (!name) return { valid: false, error: `Row ${rowNum}: name is required` };
  const email = (row.email || row.Email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: `Row ${rowNum}: email "${email}" invalid` };
  return { valid: true, normalized: { phone: `+${phone}`, name, email: email || undefined } };
}

// ─── Voice note — client-side Ogg/Opus (wacrm opus-recorder WASM, no ffmpeg) ─
// Server just stores .ogg like any attachment; WhatsApp renders as voice note.
export async function wacrmStoreVoiceNote(opts: { fromPhone: string; oggBase64: string; durationMs: number; actorId?: string }): Promise<{ fileId: string }> {
  const fileId = `voice_${Date.now()}_${Math.random().toString(36).slice(2,6)}.ogg`;
  // Persist metadata via SocialInboxMessage / FileMetadata pattern (reuse whatsapp engine)
  await db.crmAuditLog.create({
    data: { action: 'WACRM_VOICE_NOTE_STORED', entityType: 'WacrmVoiceNote', entityId: fileId, actorId: opts.actorId || 'system', details: JSON.stringify({ fromPhone: opts.fromPhone, durationMs: opts.durationMs, size: opts.oggBase64.length }), createdAt: new Date() } as any,
  }).catch(()=>{});
  // Note: actual bytes should be uploaded via storage-service; this stub validates size caps per wacrm chat_media beta flag
  const sizeBytes = Math.ceil(opts.oggBase64.length * 0.75);
  const MAX_VOICE_BYTES = 2 * 1024 * 1024; // 2MB cap (matches wacrm per-kind cap)
  if (sizeBytes > MAX_VOICE_BYTES) throw new Error(`Voice note ${sizeBytes} bytes exceeds ${MAX_VOICE_BYTES} cap`);
  return { fileId };
}
