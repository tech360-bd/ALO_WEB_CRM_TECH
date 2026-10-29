/**
 * WhatsApp Cloud API integration
 *
 *   - verifyWhatsAppSignature  : HMAC-SHA-256 with WHATSAPP_APP_SECRET,
 *                                 timingSafeEqual. If secret not set → log
 *                                 warning + return true (dev-friendly).
 *   - sendWhatsAppMessage      : routes only through a recently verified official number
 *                                 and the configured Graph API version; purpose and promotional
 *                                 consent are checked before provider submission.
 *   - parseWhatsAppInbound     : map webhook payload → fields.
 *   - parseWhatsAppStatus      : map webhook payload → status fields.
 *   - persistWhatsAppStatus    : upsert WhatsAppMessageStatus by messageId.
 *
 * Models touched: SocialInboxMessage, WhatsAppMessageStatus, WebhookEvent.
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone-normalization";
import { isEligibleForMarketing } from "@/lib/communications/consent-management";
import { getWhatsAppAccessToken, getWhatsAppGraphUrl } from "@/lib/whatsapp-config";
import { resolveAuthorizedWhatsAppSender } from "@/lib/whatsapp-sender";
import { mapProviderStatus, shouldApplyStatus } from '@/lib/communications/webhook-idempotency';

// ─── Env access (graceful when missing) ─────────────────────────

const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// ─── Signature verification ─────────────────────────────────────

/**
 * Verify X-Hub-Signature-256 header sent by WhatsApp webhooks.
 *
 * If `WHATSAPP_APP_SECRET` is not configured we log a warning and
 * return `true` so local development keeps working — production
 * deployments MUST set the secret.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  if (!WHATSAPP_APP_SECRET) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[whatsapp-cloud-api] WHATSAPP_APP_SECRET not set — signature verification skipped (dev mode)."
      );
    } else {
      console.error(
        "[whatsapp-cloud-api] WHATSAPP_APP_SECRET is required in production — rejecting webhook."
      );
      return false;
    }
    // Development may explicitly opt into unsigned local webhook testing; a
    // production process must never accept an unverifiable provider request.
    return (process.env.NODE_ENV as string) !== "production";
  }
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expected = signature.slice("sha256=".length);
  const computed = crypto
    .createHmac("sha256", WHATSAPP_APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Send message ───────────────────────────────────────────────

export type WhatsAppMessagePurpose = 'SERVICE' | 'TRANSACTIONAL' | 'PROMOTIONAL_MARKETING';

const TEMPLATE_PURPOSES: Record<WhatsAppMessagePurpose, ReadonlySet<string>> = {
  SERVICE: new Set(['SERVICE', 'CUSTOMER_SERVICE', 'CUSTOMER_SUPPORT', 'SUPPORT', 'SERVICE_UPDATE']),
  TRANSACTIONAL: new Set(['TRANSACTIONAL', 'TRANSACTIONAL_NOTIFICATION', 'STUDENT_TRANSACTIONAL', 'PORTAL_INVITATION', 'ACCOUNT_SECURITY', 'APPLICATION_STATUS', 'DOCUMENT_STATUS']),
  PROMOTIONAL_MARKETING: new Set(['PROMOTIONAL_MARKETING', 'MARKETING', 'PROMOTIONAL', 'OUTREACH', 'CAMPAIGN', 'FOLLOW_UP', 'FOLLOWUP']),
};

export function isWhatsAppTemplatePurposeCompatible(templatePurpose: string, messagePurpose: WhatsAppMessagePurpose): boolean {
  const normalized = templatePurpose.trim().toUpperCase().replace(/[\\s-]+/g, '_');
  return TEMPLATE_PURPOSES[messagePurpose].has(normalized);
}

export interface SendWhatsAppParams {
  /** Any format; normalized through the shared Bangladesh/international phone helper. */
  to: string;
  purpose: WhatsAppMessagePurpose;
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParams?: string[];
  contactId?: string;
  conversationId?: string;
  studentId?: string;
  leadId?: string;
  campaignId?: string;
  approvalId?: string;
  actorId?: string;
  employeeSenderId?: string;
  senderNumber?: string;
}

export interface SendWhatsAppResult {
  messageId: string | null;
  success: boolean;
  error?: string;
  socialMessageId?: string;
  statusRecorded?: boolean;
  senderNumber?: string;
  fallbackUsed?: boolean;
}

/**
 * Purpose-gated Cloud API send. Promotional sends require an approved marketing
 * item plus current purpose/channel-specific consent. Every send requires a
 * number pool record whose Meta connectivity was recently verified.
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResult> {
  const purpose = String(params.purpose || '').toUpperCase() as WhatsAppMessagePurpose;
  if (!['SERVICE', 'TRANSACTIONAL', 'PROMOTIONAL_MARKETING'].includes(purpose)) {
    return { messageId: null, success: false, error: 'MESSAGE_PURPOSE_REQUIRED' };
  }
  if (!params.templateName && (!params.text || !params.text.trim())) {
    return { messageId: null, success: false, error: 'Message text or an approved template is required' };
  }
  if (params.text && params.text.length > 4096) {
    return { messageId: null, success: false, error: 'Message text exceeds the provider limit of 4096 characters' };
  }
  if (params.templateName && !/^[a-z0-9_]{1,512}$/.test(params.templateName)) {
    return { messageId: null, success: false, error: 'INVALID_TEMPLATE_NAME' };
  }

  const verifiedTemplate = params.templateName
    ? await db.whatsAppFollowUpTemplate.findFirst({
        where: {
          metaTemplateName: params.templateName,
          approvalStatus: 'approved',
          metaTemplateStatus: 'APPROVED',
          activeStatus: 'active',
          metaTemplateCheckedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            lte: new Date(),
          },
        },
        select: { id: true, metaLanguage: true, purpose: true },
      }).catch(() => null)
    : null;
  if (params.templateName && !verifiedTemplate) {
    return { messageId: null, success: false, error: 'WHATSAPP_META_TEMPLATE_NOT_APPROVED_AND_RECENTLY_VERIFIED' };
  }
  if (params.templateName && verifiedTemplate && !isWhatsAppTemplatePurposeCompatible(verifiedTemplate.purpose, purpose)) {
    return { messageId: null, success: false, error: 'WHATSAPP_TEMPLATE_PURPOSE_MISMATCH' };
  }
  if (params.templateName && verifiedTemplate && params.templateLanguage && params.templateLanguage !== verifiedTemplate.metaLanguage) {
    return { messageId: null, success: false, error: 'WHATSAPP_META_TEMPLATE_LANGUAGE_MISMATCH' };
  }

  const accessToken = getWhatsAppAccessToken();
  if (!accessToken) return { messageId: null, success: false, error: 'WHATSAPP_CLOUD_API_NOT_CONFIGURED' };
  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) return { messageId: null, success: false, error: 'INVALID_RECIPIENT_PHONE' };

  let consentRecordId: string | undefined;
  if (purpose === 'SERVICE' && !params.templateName) {
    const conversationId = params.conversationId?.trim() || '';
    if (!conversationId) return { messageId: null, success: false, error: 'SERVICE_CONVERSATION_REQUIRED' };
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let contextVerified = false;
    const uccConversation = await db.uccConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, channel: true, participantPhone: true, assignedToUserId: true },
    }).catch(() => null);
    if (uccConversation) {
      const assignmentValid = !uccConversation.assignedToUserId
        || params.actorId === 'system'
        || uccConversation.assignedToUserId === params.actorId;
      const recentInbound = await db.uccMessage.findFirst({
        where: { conversationId, direction: 'inbound', createdAt: { gte: cutoff } },
        select: { id: true },
      }).catch(() => null);
      contextVerified = uccConversation.channel.toLowerCase() === 'whatsapp'
        && normalizePhone(uccConversation.participantPhone || '') === toNormalized
        && assignmentValid
        && Boolean(recentInbound);
    } else {
      const legacyThread = await db.communicationThread.findUnique({
        where: { id: conversationId },
        select: { id: true, channel: true, studentId: true, leadId: true, assignedToId: true },
      }).catch(() => null);
      if (legacyThread) {
        const linkedStudent = legacyThread.studentId
          ? await db.student.findUnique({ where: { id: legacyThread.studentId }, select: { phone: true } }).catch(() => null)
          : null;
        const linkedLead = legacyThread.leadId
          ? await db.lead.findUnique({ where: { id: legacyThread.leadId }, select: { phone: true } }).catch(() => null)
          : null;
        const assignmentValid = !legacyThread.assignedToId
          || params.actorId === 'system'
          || legacyThread.assignedToId === params.actorId;
        const recentInbound = await db.communicationMessage.findFirst({
          where: { threadId: conversationId, direction: 'inbound', createdAt: { gte: cutoff } },
          select: { id: true },
        }).catch(() => null);
        contextVerified = legacyThread.channel.toLowerCase() === 'whatsapp'
          && normalizePhone(linkedStudent?.phone || linkedLead?.phone || '') === toNormalized
          && assignmentValid
          && Boolean(recentInbound);
      }
    }
    if (!contextVerified) return { messageId: null, success: false, error: 'WHATSAPP_SERVICE_WINDOW_CLOSED_OR_CONTEXT_MISMATCH' };
  }

  if (purpose === 'PROMOTIONAL_MARKETING') {
    if (!params.campaignId || !params.approvalId) {
      return { messageId: null, success: false, error: 'PROMOTIONAL_APPROVAL_REQUIRED' };
    }
    if (!params.templateName) return { messageId: null, success: false, error: 'PROMOTIONAL_SEND_REQUIRES_APPROVED_META_TEMPLATE' };
    const approval = await db.marketingApproval.findFirst({
      where: { id: params.approvalId, itemId: params.campaignId, status: 'approved' },
      select: { id: true, itemType: true },
    }).catch(() => null);
    if (!approval || !['MarketingCampaign', 'WhatsAppFollowUpTemplate'].includes(approval.itemType)) {
      return { messageId: null, success: false, error: 'PROMOTIONAL_APPROVAL_NOT_FOUND' };
    }
    if (!verifiedTemplate) return { messageId: null, success: false, error: 'PROMOTIONAL_META_TEMPLATE_NOT_VERIFIED' };
    const eligibility = await isEligibleForMarketing({
      contactId: params.contactId,
      phone: toNormalized,
      studentId: params.studentId,
      leadId: params.leadId,
      channel: 'WHATSAPP',
      purpose: 'PROMOTIONAL_MARKETING',
    }).catch(() => ({ eligible: false as const, reason: 'missing_consent' as const }));
    if (!eligibility.eligible) {
      return { messageId: null, success: false, error: `PROMOTIONAL_SEND_BLOCKED_${eligibility.reason.toUpperCase()}` };
    }
    consentRecordId = eligibility.consentRecordId;
  }

  const { sender, error: senderError } = await resolveAuthorizedWhatsAppSender(params.senderNumber, params.actorId || params.employeeSenderId);
  if (!sender) return { messageId: null, success: false, error: senderError || 'NO_RECENTLY_VERIFIED_OFFICIAL_NUMBER' };
  const messagesUrl = getWhatsAppGraphUrl(`${sender.metaPhoneNumberId}/messages`);
  if (!messagesUrl) return { messageId: null, success: false, error: 'INVALID_WHATSAPP_GRAPH_API_CONFIGURATION' };

  // Recheck immediately before the provider request. This narrows the window in
  // which a concurrent STOP could otherwise race a previously eligible send.
  if (purpose === 'PROMOTIONAL_MARKETING') {
    const latestEligibility = await isEligibleForMarketing({
      contactId: params.contactId,
      phone: toNormalized,
      studentId: params.studentId,
      leadId: params.leadId,
      channel: 'WHATSAPP',
      purpose: 'PROMOTIONAL_MARKETING',
    }).catch(() => ({ eligible: false as const, reason: 'missing_consent' as const }));
    if (!latestEligibility.eligible) {
      return { messageId: null, success: false, error: `PROMOTIONAL_SEND_BLOCKED_${latestEligibility.reason.toUpperCase()}` };
    }
    consentRecordId = latestEligibility.consentRecordId;
  }

  const body: Record<string, unknown> = params.templateName
    ? {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNormalized,
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: params.templateLanguage || 'en_US' },
          components: params.templateParams?.length
            ? [{ type: 'body', parameters: params.templateParams.map((value) => ({ type: 'text', text: value })) }]
            : [],
        },
      }
    : {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNormalized,
        type: 'text',
        text: { preview_url: false, body: params.text ?? '' },
      };

  let providerMessageId: string | null = null;
  let errorMessage: string | undefined;
  try {
    const response = await fetch(messagesUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json: any = await response.json().catch(() => ({}));
    providerMessageId = typeof json?.messages?.[0]?.id === 'string' ? json.messages[0].id : null;
    if (!response.ok || !providerMessageId) {
      const providerCode = Number(json?.error?.code);
      providerMessageId = null;
      errorMessage = `WHATSAPP_PROVIDER_REJECTED_HTTP_${response.status}${Number.isFinite(providerCode) ? `_CODE_${providerCode}` : ''}`;
      console.warn('[whatsapp-cloud-api] Provider rejected outbound send', { status: response.status, providerCode: Number.isFinite(providerCode) ? providerCode : undefined });
    }
  } catch {
    errorMessage = 'WHATSAPP_PROVIDER_NETWORK_ERROR';
  }

  if (!providerMessageId) return { messageId: null, success: false, error: errorMessage || 'WHATSAPP_PROVIDER_REJECTED' };

  let socialMessageId: string | undefined;
  let recordsPersisted = false;
  const conversationId = `wa:${toNormalized}`;
  const messageText = params.text ?? `[WhatsApp template: ${params.templateName}]`;
  const employeeId = params.employeeSenderId || params.actorId || null;
  try {
    const socialMsg = await db.socialInboxMessage.create({
      data: {
        platform: 'WHATSAPP',
        direction: 'OUTBOUND',
        recipientId: toNormalized,
        senderId: sender.normalizedPhone,
        senderName: 'ALO Education',
        messageText,
        conversationId,
        leadId: params.leadId || null,
        studentId: params.studentId || null,
        employeeId,
        externalId: providerMessageId,
        sentAt: new Date(),
      },
    });
    socialMessageId = socialMsg.id;
    await db.whatsAppMessageArchive.create({
      data: {
        whatsappMessageId: providerMessageId,
        conversationId,
        threadId: conversationId,
        studentId: params.studentId || '',
        leadId: params.leadId || '',
        senderPhone: sender.normalizedPhone,
        receiverPhone: toNormalized,
        senderNumber: sender.phoneNumber,
        messageType: params.templateName ? 'template' : 'text',
        messageBody: messageText.slice(0, 10000),
        campaignId: params.campaignId || '',
        timestamp: new Date(),
        direction: 'outbound',
        deliveryStatus: 'sent',
        employeeSenderId: employeeId || '',
      },
    });
    recordsPersisted = true;
  } catch (error) {
    console.error('[whatsapp-cloud-api] Provider accepted a message but CRM archive persistence failed', error);
  }

  let statusRecorded = false;
  try {
    statusRecorded = await persistWhatsAppStatus(providerMessageId, 'sent', toNormalized, {
      socialMessageId,
      templateName: params.templateName ?? null,
      purpose,
    });
  } catch (error) {
    console.error('[whatsapp-cloud-api] Provider accepted a message but status persistence failed', error);
  }

  try {
    const recipientHash = crypto.createHash('sha256').update(toNormalized).digest('hex').slice(0, 16);
    await db.auditLog.create({
      data: {
        userId: params.actorId && params.actorId !== 'system' ? params.actorId : null,
        action: 'WHATSAPP_OUTBOUND_PROVIDER_ACCEPTED',
        resource: 'WhatsAppMessageArchive',
        resourceId: providerMessageId,
        actorRole: params.actorId && params.actorId !== 'system' ? 'authenticated_actor' : 'system',
        details: JSON.stringify({
          purpose,
          recipientHash,
          senderPhone: sender.phoneNumber,
          fallbackUsed: sender.fallbackUsed,
          campaignId: purpose === 'PROMOTIONAL_MARKETING' ? params.campaignId : undefined,
          consentRecordId,
          crmArchivePersisted: recordsPersisted,
          statusRecorded,
        }),
      },
    });
  } catch (error) {
    console.error('[whatsapp-cloud-api] Failed to write outbound send audit record', error);
  }

  return {
    messageId: providerMessageId,
    success: true,
    socialMessageId,
    statusRecorded: statusRecorded && recordsPersisted,
    senderNumber: sender.phoneNumber,
    fallbackUsed: sender.fallbackUsed,
  };
}

// ─── Parse inbound webhook ──────────────────────────────────────

export interface ParsedWhatsAppInbound {
  messageId?: string;
  fromPhone?: string;
  fromName?: string;
  text?: string;
  type?: string;
  timestamp?: string;
  receivedAt?: Date;
  raw: Record<string, unknown>;
}

/**
 * Parse an inbound WhatsApp webhook payload.
 *
 * Returns an empty object (with raw=body) if no message entry found.
 */
export function parseWhatsAppInbound(
  body: Record<string, unknown> | string
): ParsedWhatsAppInbound[] {
  const parsed: ParsedWhatsAppInbound[] = [];
  const root: any = typeof body === "string" ? safeJson(body) : body;
  if (!root || !root.entry) return parsed;

  for (const entry of root.entry as any[]) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value;
      if (!value || !Array.isArray(value.messages)) continue;
      for (const msg of value.messages) {
        const contact = (value.contacts ?? []).find(
          (c: any) => c.wa_id === msg.from
        );
        parsed.push({
          messageId: msg.id,
          fromPhone: msg.from ? normalizePhone(msg.from) : undefined,
          fromName: contact?.profile?.name,
          text:
            msg.type === "text" ? msg.text?.body :
            msg.type === "button" ? msg.button?.text :
            msg.type === "interactive" ? msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title :
            undefined,
          type: msg.type,
          timestamp: msg.timestamp,
          receivedAt: msg.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000) : new Date(),
          raw: msg,
        });
      }
    }
  }
  return parsed;
}

// ─── Parse status webhook ───────────────────────────────────────

export interface ParsedWhatsAppStatus {
  messageId: string;
  status: string;
  recipientPhone?: string;
  timestamp?: string;
  conversationId?: string;
  pricing?: Record<string, unknown>;
  error?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export function parseWhatsAppStatus(
  body: Record<string, unknown> | string
): ParsedWhatsAppStatus[] {
  const parsed: ParsedWhatsAppStatus[] = [];
  const root: any = typeof body === "string" ? safeJson(body) : body;
  if (!root || !root.entry) return parsed;

  for (const entry of root.entry as any[]) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value;
      if (!value || !Array.isArray(value.statuses)) continue;
      for (const st of value.statuses) {
        parsed.push({
          messageId: st.id,
          status: st.status,
          recipientPhone: st.recipient_id ? normalizePhone(st.recipient_id) : undefined,
          timestamp: st.timestamp,
          conversationId: st.conversation?.id,
          pricing: st.pricing,
          error: st.errors,
          raw: st,
        });
      }
    }
  }
  return parsed;
}

// ─── Persist status ─────────────────────────────────────────────

/**
 * Upsert a WhatsAppMessageStatus row by messageId (@unique).
 * Optionally link to an existing SocialInboxMessage.
 */
export async function persistWhatsAppStatus(
  messageId: string,
  status: string,
  recipientPhone: string,
  payload?: Record<string, unknown> | null
): Promise<boolean> {
  if (!messageId) return false;
  const socialMessageId = (payload as any)?.socialMessageId ?? null;
  const providerPayload = payload ? JSON.stringify(payload) : null;
  const providerTimestamp = Number((payload as any)?.providerTimestamp);
  const statusTimestamp = Number.isFinite(providerTimestamp) && providerTimestamp > 0
    ? new Date(providerTimestamp * 1000)
    : new Date();
  const normalizedStatus = mapProviderStatus(status);
  if (!normalizedStatus) return false;

  try {
    const existing = await db.whatsAppMessageStatus.findUnique({
      where: { messageId },
      select: { status: true, statusTimestamp: true },
    });
    if (existing) {
      const previousStatus = mapProviderStatus(existing.status);
      if (!shouldApplyStatus(previousStatus, normalizedStatus)) return true;
      if (previousStatus === normalizedStatus && statusTimestamp < existing.statusTimestamp) return true;
    }
    await db.whatsAppMessageStatus.upsert({
      where: { messageId },
      update: {
        status: normalizedStatus,
        recipientPhone,
        socialMessageId: socialMessageId ?? undefined,
        providerPayload,
        statusTimestamp,
        errorMessage: typeof (payload as any)?.providerError === 'string' ? (payload as any).providerError.slice(0, 500) : undefined,
      },
      create: {
        messageId,
        status: normalizedStatus,
        recipientPhone,
        socialMessageId: socialMessageId ?? undefined,
        providerPayload,
        statusTimestamp,
        errorMessage: typeof (payload as any)?.providerError === 'string' ? (payload as any).providerError.slice(0, 500) : undefined,
      },
    });
    return true;
  } catch (err) {
    console.error("[whatsapp-cloud-api] persistWhatsAppStatus failed:", err);
    return false;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function safeJson(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// §131 — outbound attachment send (PDF / image / audio / video) via the
// official WhatsApp Cloud API media-by-link. Transport only: persistence
// (UccMessage + CommunicationAttachment) is the caller's job. Pure payload /
// validation logic lives in ./whatsapp-media (fully unit-testable).
// ============================================================================

import {
  WHATSAPP_MEDIA_TYPES,
  buildWhatsAppMediaPayload,
  buildWhatsAppUploadedMediaPayload,
  validateWhatsAppMediaRequest,
  whatsappCloudConfigError,
  type SendWhatsAppMediaParams,
  type SendWhatsAppUploadedMediaParams,
  type WhatsAppMediaType,
} from "@/lib/whatsapp-media";

export { WHATSAPP_MEDIA_TYPES, buildWhatsAppMediaPayload, buildWhatsAppUploadedMediaPayload, validateWhatsAppMediaRequest };
export type { SendWhatsAppMediaParams, SendWhatsAppUploadedMediaParams, WhatsAppMediaType };

export interface SendWhatsAppPrivateMediaParams {
  to: string;
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  caption?: string;
  actorId: string;
  senderNumber?: string;
  studentId?: string;
  leadId?: string;
  conversationId?: string;
}

/** Upload a protected CRM document to Meta only after the user-authorized UCC
 * route has validated the conversation, actor, service window, and permissions. */
export async function sendWhatsAppPrivateMedia(params: SendWhatsAppPrivateMediaParams): Promise<{
  messageId: string | null;
  providerMediaId?: string;
  success: boolean;
  error?: string;
  senderNumber?: string;
}> {
  if (!params.bytes.byteLength || params.bytes.byteLength > 20 * 1024 * 1024) {
    return { messageId: null, success: false, error: 'Document must be non-empty and no larger than 20 MB.' };
  }
  const mimeType = params.mimeType.toLowerCase();
  const mediaType = mimeType === 'application/pdf'
    ? 'document'
    : ['image/jpeg', 'image/png'].includes(mimeType) ? 'image' : null;
  if (!mediaType) {
    return { messageId: null, success: false, error: 'Only PDF, JPEG, and PNG private documents can be sent through this action.' };
  }
  const configError = whatsappCloudConfigError();
  if (configError) return { messageId: null, success: false, error: configError };
  const accessToken = getWhatsAppAccessToken();
  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) return { messageId: null, success: false, error: 'INVALID_RECIPIENT_PHONE' };
  const { sender, error: senderError } = await resolveAuthorizedWhatsAppSender(params.senderNumber, params.actorId);
  if (!sender) return { messageId: null, success: false, error: senderError || 'NO_RECENTLY_VERIFIED_OFFICIAL_NUMBER' };
  const mediaUrl = getWhatsAppGraphUrl(`${sender.metaPhoneNumberId}/media`);
  const messageUrl = getWhatsAppGraphUrl(`${sender.metaPhoneNumberId}/messages`);
  if (!accessToken || !mediaUrl || !messageUrl) {
    return { messageId: null, success: false, error: 'WHATSAPP_CLOUD_API_NOT_CONFIGURED' };
  }

  try {
    const form = new FormData();
    form.set('messaging_product', 'whatsapp');
    form.set('type', mimeType);
    form.set('file', new Blob([Uint8Array.from(params.bytes)], { type: mimeType }), params.fileName);
    const uploadResponse = await fetch(mediaUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const uploadData: any = await uploadResponse.json().catch(() => ({}));
    const providerMediaId = typeof uploadData?.id === 'string' ? uploadData.id : '';
    if (!uploadResponse.ok || !providerMediaId) {
      return { messageId: null, success: false, error: `WHATSAPP_MEDIA_UPLOAD_REJECTED_HTTP_${uploadResponse.status}` };
    }

    const messagePayload = buildWhatsAppUploadedMediaPayload(toNormalized, {
      mediaType,
      mediaId: providerMediaId,
      fileName: params.fileName,
      caption: params.caption,
    });
    const messageResponse = await fetch(messageUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload),
    });
    const messageData: any = await messageResponse.json().catch(() => ({}));
    const messageId = typeof messageData?.messages?.[0]?.id === 'string' ? messageData.messages[0].id : null;
    if (!messageResponse.ok || !messageId) {
      return { messageId: null, providerMediaId, success: false, error: `WHATSAPP_MEDIA_SEND_REJECTED_HTTP_${messageResponse.status}` };
    }

    const conversationId = params.conversationId || `wa:${toNormalized}`;
    await db.whatsAppMessageArchive.create({
      data: {
        whatsappMessageId: messageId,
        conversationId,
        threadId: conversationId,
        studentId: params.studentId || '',
        leadId: params.leadId || '',
        senderPhone: sender.normalizedPhone,
        receiverPhone: toNormalized,
        senderNumber: sender.phoneNumber,
        messageType: mediaType,
        messageBody: (params.caption || '').slice(0, 10000),
        mediaId: providerMediaId,
        campaignId: '',
        timestamp: new Date(),
        direction: 'outbound',
        deliveryStatus: 'sent',
        employeeSenderId: params.actorId,
      },
    });
    await persistWhatsAppStatus(messageId, 'sent', toNormalized, { uccPrivateMedia: true, providerMediaId });
    await db.auditLog.create({
      data: {
        userId: params.actorId,
        action: 'WHATSAPP_PRIVATE_MEDIA_PROVIDER_ACCEPTED',
        resource: 'WhatsAppMessageArchive',
        resourceId: messageId,
        actorRole: 'authenticated_actor',
        details: JSON.stringify({ senderPhone: sender.phoneNumber, conversationId, mediaType, fileName: params.fileName.slice(0, 128) }),
      },
    }).catch((error) => console.error('[whatsapp-cloud-api] Private media audit write failed', error));
    return { messageId, providerMediaId, success: true, senderNumber: sender.phoneNumber };
  } catch {
    return { messageId: null, success: false, error: 'WHATSAPP_PRIVATE_MEDIA_NETWORK_OR_PERSISTENCE_ERROR' };
  }
}

export type PurposeGatedWhatsAppMediaParams = SendWhatsAppMediaParams & {
  purpose: WhatsAppMessagePurpose;
  actorId?: string;
  senderNumber?: string;
};

/** Send public media only for explicit service/transactional requests. Promotional
 * media must use a campaign approval flow that carries contact-level consent. */
export async function sendWhatsAppMedia(params: PurposeGatedWhatsAppMediaParams): Promise<{ messageId: string | null; success: boolean; error?: string }> {
  const invalid = validateWhatsAppMediaRequest(params);
  if (!invalid.ok) return { messageId: null, success: false, error: invalid.error };
  if (!['SERVICE', 'TRANSACTIONAL'].includes(String(params.purpose).toUpperCase())) {
    return { messageId: null, success: false, error: 'PROMOTIONAL_MEDIA_REQUIRES_APPROVED_CONSENT_AWARE_CAMPAIGN_FLOW' };
  }
  const configError = whatsappCloudConfigError();
  if (configError) return { messageId: null, success: false, error: configError };
  const accessToken = getWhatsAppAccessToken();
  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) return { messageId: null, success: false, error: 'INVALID_RECIPIENT_PHONE' };
  const { sender, error: senderError } = await resolveAuthorizedWhatsAppSender(params.senderNumber, params.actorId);
  if (!sender) return { messageId: null, success: false, error: senderError || 'NO_RECENTLY_VERIFIED_OFFICIAL_NUMBER' };
  const url = getWhatsAppGraphUrl(`${sender.metaPhoneNumberId}/messages`);
  if (!accessToken || !url) return { messageId: null, success: false, error: 'WHATSAPP_CLOUD_API_NOT_CONFIGURED' };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildWhatsAppMediaPayload(toNormalized, params)),
    });
    const json: any = await response.json().catch(() => ({}));
    const messageId = typeof json?.messages?.[0]?.id === 'string' ? json.messages[0].id : null;
    if (!response.ok || !messageId) return { messageId: null, success: false, error: `WHATSAPP_MEDIA_SEND_REJECTED_HTTP_${response.status}` };
    await db.whatsAppMessageArchive.create({
      data: {
        whatsappMessageId: messageId,
        conversationId: `wa:${toNormalized}`,
        threadId: `wa:${toNormalized}`,
        senderPhone: sender.normalizedPhone,
        receiverPhone: toNormalized,
        senderNumber: sender.phoneNumber,
        messageType: params.mediaType,
        messageBody: (params.caption || params.fileName || '').slice(0, 10000),
        timestamp: new Date(),
        direction: 'outbound',
        deliveryStatus: 'sent',
        employeeSenderId: params.actorId || '',
      },
    });
    await persistWhatsAppStatus(messageId, 'sent', toNormalized, { purpose: params.purpose });
    return { messageId, success: true };
  } catch {
    return { messageId: null, success: false, error: 'WHATSAPP_MEDIA_NETWORK_OR_PERSISTENCE_ERROR' };
  }
}
