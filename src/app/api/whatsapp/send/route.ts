import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { normalizePhone } from '@/lib/phone-normalization';
import { sendWhatsAppMessage, type WhatsAppMessagePurpose } from '@/lib/whatsapp-cloud-api';
import { determineSenderNumber, MAIN_NUMBER } from '@/lib/whatsapp-number-pool';
import { canAccessUccConversation } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIVILEGED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'CEO']);
const PURPOSES = new Set<WhatsAppMessagePurpose>(['SERVICE', 'TRANSACTIONAL', 'PROMOTIONAL_MARKETING']);

function normalizedRoles(auth: { userType: string; roles: string[] }) {
  return new Set([auth.userType, ...auth.roles].map((role) => String(role).toUpperCase()));
}

function rateLimitedUserKey(userId: string) {
  return `whatsapp-send:${userId}`;
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });

  const roles = normalizedRoles(auth);
  const isPrivileged = [...PRIVILEGED_ROLES].some((role) => roles.has(role));
  const authorized = auth.permissions.includes('c2') || isPrivileged;
  if (!authorized) return NextResponse.json({ success: false, error: 'WhatsApp send permission is required.' }, { status: 403 });

  const limit = checkRateLimit(rateLimitedUserKey(auth.userId), 'whatsapp_send');
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'WhatsApp send rate limit reached. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) } },
    );
  }

  const body = await req.json().catch(() => null) as {
    to?: string;
    text?: string;
    templateName?: string;
    templateLanguage?: string;
    purpose?: string;
    conversationId?: string;
    studentId?: string;
    leadId?: string;
    contactId?: string;
    campaignId?: string;
    approvalId?: string;
  } | null;
  if (!body || typeof body !== 'object') return NextResponse.json({ success: false, error: 'A valid JSON body is required.' }, { status: 400 });
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const normalizedRecipient = normalizePhone(to);
  const purpose = String(body.purpose || '').toUpperCase() as WhatsAppMessagePurpose;
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const templateName = typeof body.templateName === 'string' ? body.templateName.trim() : '';
  if (!normalizedRecipient) return NextResponse.json({ success: false, error: 'A valid recipient phone number is required.' }, { status: 400 });
  if (!PURPOSES.has(purpose)) return NextResponse.json({ success: false, error: 'Explicit SERVICE, TRANSACTIONAL, or PROMOTIONAL_MARKETING purpose is required.' }, { status: 400 });
  if (!templateName && !text) return NextResponse.json({ success: false, error: 'Either an approved template or text is required.' }, { status: 400 });
  if (text.length > 4096) return NextResponse.json({ success: false, error: 'Text exceeds the WhatsApp message limit of 4,096 characters.' }, { status: 400 });
  if (purpose === 'PROMOTIONAL_MARKETING' && !isPrivileged && !roles.has('MARKETING_MANAGER')) return NextResponse.json({ success: false, error: 'Promotional sends are restricted to Marketing Manager and administrator roles.' }, { status: 403 });

  let conversationId = '';
  let selectedSender = MAIN_NUMBER;
  let studentId = '';
  let leadId = '';
  let contactId = '';

  if (purpose === 'SERVICE') {
    conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
    if (!conversationId) return NextResponse.json({ success: false, error: 'SERVICE sends require an existing conversation.' }, { status: 400 });
    const conversation = await db.uccConversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.channel.toLowerCase() !== 'whatsapp') return NextResponse.json({ success: false, error: 'WhatsApp conversation not found.' }, { status: 404 });
    if (!canAccessUccConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
      return NextResponse.json({ success: false, error: 'You may send only in conversations within your authorized assignment and branch scope.' }, { status: 403 });
    }
    if (normalizePhone(conversation.participantPhone || '') !== normalizedRecipient) return NextResponse.json({ success: false, error: 'Recipient does not match the selected conversation.' }, { status: 403 });
    const recentInbound = await db.uccMessage.findFirst({
      where: { conversationId, direction: 'inbound', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!recentInbound && !templateName) return NextResponse.json({ success: false, code: 'WHATSAPP_SERVICE_WINDOW_CLOSED', error: 'A free-form WhatsApp service message requires an inbound message within the last 24 hours.' }, { status: 422 });
    studentId = conversation.studentId || '';
    leadId = conversation.leadId || '';
    const routing = await determineSenderNumber({ counselorId: auth.userId, studentId: studentId || undefined, leadId: leadId || undefined });
    selectedSender = routing.number;
  }

  if (purpose === 'TRANSACTIONAL') {
    studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
    if (!studentId) return NextResponse.json({ success: false, error: 'TRANSACTIONAL sends require an existing student identity.' }, { status: 400 });
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true, studentId: true, phone: true, counselorId: true } });
    if (!student || normalizePhone(student.phone || '') !== normalizedRecipient) return NextResponse.json({ success: false, error: 'The recipient must match the identified student record.' }, { status: 403 });
    if (!PRIVILEGED_ROLES.has([...roles].find((role) => PRIVILEGED_ROLES.has(role)) || '') && student.counselorId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Student is not assigned to this sender.' }, { status: 403 });
    }
    studentId = student.id;
  }

  if (purpose === 'PROMOTIONAL_MARKETING') {
    if (!body.campaignId || !body.approvalId) return NextResponse.json({ success: false, error: 'An approved campaign and approval record are required.' }, { status: 400 });
    contactId = typeof body.contactId === 'string' ? body.contactId.trim() : '';
    studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
    leadId = typeof body.leadId === 'string' ? body.leadId.trim() : '';
    if (!contactId && !studentId && !leadId) return NextResponse.json({ success: false, error: 'Promotional sends require a contact, student, or lead CRM identity.' }, { status: 400 });

    let identityMatches = false;
    if (contactId) {
      const contact = await db.whatsAppContact.findUnique({ where: { id: contactId }, select: { id: true, normalizedPhone: true } });
      identityMatches = Boolean(contact && contact.normalizedPhone === normalizedRecipient);
    }
    if (!identityMatches && studentId) {
      const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true, phone: true } });
      identityMatches = Boolean(student && normalizePhone(student.phone || '') === normalizedRecipient);
      if (student) studentId = student.id;
    }
    if (!identityMatches && leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId }, select: { id: true, phone: true } });
      identityMatches = Boolean(lead && normalizePhone(lead.phone || '') === normalizedRecipient);
    }
    if (!identityMatches) return NextResponse.json({ success: false, error: 'The recipient does not match an existing CRM identity.' }, { status: 403 });
  }

  const sendResult = await sendWhatsAppMessage({
    to: normalizedRecipient,
    text: text || undefined,
    templateName: templateName || undefined,
    templateLanguage: typeof body.templateLanguage === 'string' ? body.templateLanguage : undefined,
    purpose,
    conversationId: conversationId || undefined,
    contactId: contactId || undefined,
    studentId: studentId || undefined,
    leadId: leadId || undefined,
    campaignId: typeof body.campaignId === 'string' ? body.campaignId : undefined,
    approvalId: typeof body.approvalId === 'string' ? body.approvalId : undefined,
    actorId: auth.userId,
    employeeSenderId: auth.userId,
    senderNumber: selectedSender,
  });

  if (!sendResult.success || !sendResult.messageId) {
    const sendError = sendResult.error || 'WHATSAPP_PROVIDER_DID_NOT_CONFIRM';
    let retryQueued = false;
    // Retry only messages with durable purpose, actor, and authorization context.
    // Template sends are not downgraded to text in the retry worker.
    const definitiveRateLimit = sendError.includes('HTTP_429');
    if (!templateName && text && purpose === 'SERVICE' && conversationId && definitiveRateLimit) {
      await db.whatsAppRetryQueue.create({
        data: {
          messageId: '',
          recipientPhone: normalizedRecipient,
          messageBody: text,
          purpose: purpose.toLowerCase(),
          campaignId: body.campaignId || '',
          approvalId: body.approvalId || '',
          conversationId,
          actorId: auth.userId,
          senderNumber: selectedSender,
          attemptCount: 0,
          maxAttempts: 3,
          lastError: sendError.slice(0, 400),
          nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
          status: 'pending',
        },
      }).then(() => { retryQueued = true; }).catch(() => {});
    }

    const recipientHash = createHash('sha256').update(normalizedRecipient).digest('hex').slice(0, 16);
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'WHATSAPP_SEND_FAILED',
        resource: 'WhatsApp',
        resourceId: recipientHash,
        actorRole: auth.roles[0] || auth.userType,
        details: JSON.stringify({ purpose, campaignId: purpose === 'PROMOTIONAL_MARKETING' ? body.campaignId : undefined, retryQueued, errorCode: sendError.slice(0, 120) }),
      },
    }).catch(() => {});
    const notConfigured = /NOT_CONFIGURED|NO_RECENTLY_VERIFIED|REGISTRY_UNAVAILABLE/i.test(sendError);
    return NextResponse.json({ success: false, error: 'WhatsApp send failed.', detail: sendError, retryQueued }, { status: notConfigured ? 503 : 502 });
  }

  return NextResponse.json({
    success: true,
    messageId: sendResult.messageId,
    socialMessageId: sendResult.socialMessageId ?? null,
    statusRecorded: sendResult.statusRecorded ?? false,
    senderNumber: sendResult.senderNumber,
    fallbackUsed: sendResult.fallbackUsed ?? false,
  });
}
