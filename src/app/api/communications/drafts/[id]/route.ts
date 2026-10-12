import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { normalizePhone } from '@/lib/phone-normalization';
import { validateDraftMode } from '@/lib/communication/approval-modes';
import { canUseUccCommunication, canViewUccB2B, isUccDocumentSupervisor } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const dynamic = 'force-dynamic';

async function getVisibleDraft(id: string, request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return { response: auth } as const;
  if (!canUseUccCommunication(auth)) return { response: NextResponse.json({ success: false, error: 'Communication draft access is not permitted.' }, { status: 403 }) } as const;
  const draft = await db.communicationDraft.findUnique({ where: { id } });
  if (!draft) return { response: NextResponse.json({ success: false, error: 'Draft not found.' }, { status: 404 }) } as const;
  if (!isUccDocumentSupervisor(auth) && draft.createdBy !== auth.userId) return { response: NextResponse.json({ success: false, error: 'Draft not found.' }, { status: 404 }) };
  if (draft.studentId && !(await canViewUccConversationB2B(auth, { studentId: draft.studentId }))) return { response: NextResponse.json({ success: false, error: 'Draft not found.' }, { status: 404 }) };
  if (draft.applicationId) {
    const application = await db.application.findUnique({ where: { id: draft.applicationId }, select: { studentId: true, isB2bConfidential: true } });
    if (!application || application.studentId !== draft.studentId || (application.isB2bConfidential && !canViewUccB2B(auth))) return { response: NextResponse.json({ success: false, error: 'Draft not found.' }, { status: 404 }) };
  }
  return { auth, draft } as const;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getVisibleDraft(id, request);
    if ('response' in result) return result.response;
    return NextResponse.json({ success: true, draft: result.draft });
  } catch {
    return NextResponse.json({ success: false, error: 'Draft could not be loaded.' }, { status: 503 });
  }
}

// PATCH is not a send operation. A draft may be marked SENT only when the
// server can verify a recent provider-acknowledged WhatsApp message for the
// draft's actual recipient.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getVisibleDraft(id, request);
    if ('response' in result) return result.response;
    const { auth, draft: existing } = result;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid draft update is required.' }, { status: 400 });

    const requestedStatus = typeof body.status === 'string' ? body.status.toUpperCase() : '';
    const validStatuses = ['DRAFT', 'APPROVED', 'SENT', 'REJECTED', 'EDITED'];
    if (requestedStatus && !validStatuses.includes(requestedStatus)) return NextResponse.json({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    const currentStatus = existing.status.toUpperCase();
    const data: Record<string, unknown> = {};
    let nextStatus = currentStatus;

    if (requestedStatus === 'SENT') {
      if (existing.mode !== 'AI_DRAFT_HUMAN_SEND') return NextResponse.json({ success: false, error: 'Only a human-reviewed send-mode draft may be marked sent through this endpoint.' }, { status: 403 });
      if (!['DRAFT', 'APPROVED', 'EDITED'].includes(currentStatus)) return NextResponse.json({ success: false, error: 'Only an unsent draft can be finalized.' }, { status: 409 });
      if (existing.channel.toUpperCase() !== 'WHATSAPP') return NextResponse.json({ success: false, error: 'Only a provider-acknowledged WhatsApp reply can be finalized through this endpoint.' }, { status: 400 });
      const providerMessageId = typeof body.providerMessageId === 'string' ? body.providerMessageId.trim() : '';
      if (!providerMessageId) return NextResponse.json({ success: false, error: 'A provider message ID is required to confirm send.' }, { status: 400 });
      let expectedPhone = '';
      if (existing.studentId) expectedPhone = (await db.student.findUnique({ where: { id: existing.studentId }, select: { phone: true } }))?.phone || '';
      if (!expectedPhone && existing.leadId) expectedPhone = (await db.lead.findUnique({ where: { id: existing.leadId }, select: { phone: true } }))?.phone || '';
      const providerRecord = await db.whatsAppMessageStatus.findUnique({ where: { messageId: providerMessageId }, select: { recipientPhone: true, status: true, createdAt: true } });
      const providerStatus = String(providerRecord?.status || '').toLowerCase();
      if (!expectedPhone || !providerRecord || !['sent', 'delivered', 'read'].includes(providerStatus) || normalizePhone(providerRecord.recipientPhone) !== normalizePhone(expectedPhone) || providerRecord.createdAt < existing.createdAt) {
        return NextResponse.json({ success: false, error: 'No matching, recent WhatsApp provider acknowledgement was found. The draft remains unsent.' }, { status: 409 });
      }
      data.status = 'SENT';
      data.sentById = auth.userId;
      data.sentAt = new Date();
      if (!existing.approvedBy) {
        data.approvedBy = auth.userId;
        data.approvedAt = new Date();
      }
      nextStatus = 'SENT';
    } else if (requestedStatus === 'APPROVED') {
      if (!['DRAFT', 'EDITED'].includes(currentStatus)) return NextResponse.json({ success: false, error: 'Only a draft can be approved.' }, { status: 409 });
      const decision = validateDraftMode({ mode: existing.mode, riskLevel: existing.riskLevel, riskFlags: existing.riskFlags });
      if (!decision.ok) return NextResponse.json({ success: false, error: decision.error }, { status: 422 });
      data.status = 'APPROVED';
      data.approvedBy = auth.userId;
      data.approvedAt = new Date();
      nextStatus = 'APPROVED';
    } else if (requestedStatus === 'REJECTED') {
      if (['SENT', 'REJECTED'].includes(currentStatus)) return NextResponse.json({ success: false, error: 'This draft can no longer be rejected.' }, { status: 409 });
      data.status = 'REJECTED';
      nextStatus = 'REJECTED';
    } else if (requestedStatus === 'DRAFT') {
      if (currentStatus !== 'DRAFT') return NextResponse.json({ success: false, error: 'A reviewed draft cannot be reset to DRAFT.' }, { status: 409 });
    }

    if (body.editedBody !== undefined) {
      if (typeof body.editedBody !== 'string' || body.editedBody.trim().length === 0 || body.editedBody.length > 5000) return NextResponse.json({ success: false, error: 'editedBody must contain 1 to 5,000 characters.' }, { status: 400 });
      if (!['DRAFT', 'EDITED'].includes(currentStatus)) return NextResponse.json({ success: false, error: 'Approved or sent drafts cannot be edited.' }, { status: 409 });
      data.editedBody = body.editedBody.trim();
      if (!requestedStatus) { data.status = 'EDITED'; nextStatus = 'EDITED'; }
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, error: 'No permitted draft change was provided.' }, { status: 400 });

    const draft = await db.communicationDraft.update({ where: { id }, data });
    await db.communicationLog.create({
      data: {
        communicationId: draft.id,
        eventType: 'DRAFT_STATUS_CHANGED',
        oldStatus: existing.status,
        newStatus: nextStatus,
        details: JSON.stringify({ providerMessageId: body.providerMessageId || null, editor: auth.userId }),
        createdBy: auth.userId,
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, draft });
  } catch {
    return NextResponse.json({ success: false, error: 'Draft update could not be saved.' }, { status: 503 });
  }
}
