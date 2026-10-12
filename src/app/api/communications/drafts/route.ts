import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateDraftMode } from '@/lib/communication/approval-modes';
import { canAccessUccConversation, canUseUccCommunication, canViewUccB2B, isUccDocumentSupervisor } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const dynamic = 'force-dynamic';

async function requireCommunicationAccess(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return { response: auth } as const;
  if (!canUseUccCommunication(auth)) return { response: NextResponse.json({ success: false, error: 'Communication draft access is not permitted.' }, { status: 403 }) } as const;
  return { auth } as const;
}

// GET — only return drafts visible to the authenticated staff actor.
export async function GET(request: NextRequest) {
  const access = await requireCommunicationAccess(request);
  if ('response' in access) return access.response;
  const auth = access.auth;
  try {
    const status = request.nextUrl.searchParams.get('status');
    const studentId = request.nextUrl.searchParams.get('studentId');
    const channel = request.nextUrl.searchParams.get('channel');
    const riskLevel = request.nextUrl.searchParams.get('riskLevel');
    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (channel) where.channel = channel;
    if (riskLevel) where.riskLevel = riskLevel;
    if (!isUccDocumentSupervisor(auth)) where.createdBy = auth.userId;
    const drafts = await db.communicationDraft.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    if (!canViewUccB2B(auth)) {
      const studentIds = [...new Set(drafts.map((draft) => draft.studentId).filter((value): value is string => !!value))];
      if (studentIds.length) {
        const confidentialApplications = await db.application.findMany({ where: { studentId: { in: studentIds }, isB2bConfidential: true }, select: { studentId: true } });
        const confidentialStudentIds = new Set(confidentialApplications.map((application) => application.studentId));
        return NextResponse.json({ success: true, drafts: drafts.filter((draft) => !draft.studentId || !confidentialStudentIds.has(draft.studentId)) });
      }
    }
    return NextResponse.json({ success: true, drafts });
  } catch {
    return NextResponse.json({ success: false, error: 'Communication drafts are temporarily unavailable.' }, { status: 503 });
  }
}

// POST — create an authenticated, auditable AI/human communication draft.
export async function POST(request: NextRequest) {
  const access = await requireCommunicationAccess(request);
  if ('response' in access) return access.response;
  const auth = access.auth;
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid draft payload is required.' }, { status: 400 });
    const { channel, socialInboxMessageId, studentId, leadId, applicationId, draftBody, aiGenerated, aiConfidence, aiReasoning, riskLevel, riskFlags, mode } = body;
    if (typeof channel !== 'string' || !channel.trim() || typeof draftBody !== 'string' || !draftBody.trim()) return NextResponse.json({ success: false, error: 'channel and draftBody are required.' }, { status: 400 });
    if (draftBody.length > 5000) return NextResponse.json({ success: false, error: 'Draft text must be 5,000 characters or fewer.' }, { status: 400 });

    const decision = validateDraftMode({ mode, riskLevel, riskFlags });
    if (!decision.ok) return NextResponse.json({ success: false, error: decision.error }, { status: 422 });
    if (decision.mode === 'APPROVED_AUTOMATION' || decision.mode === 'RESTRICTED_AUTOMATION') return NextResponse.json({ success: false, error: 'Automated communication sending is not enabled in this workflow. Use a human-approved draft mode.' }, { status: 422 });
    const supervisor = isUccDocumentSupervisor(auth);
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
    const threadId = typeof body.threadId === 'string' ? body.threadId.trim() : '';
    let linkedStudentId = typeof studentId === 'string' && studentId.trim() ? studentId.trim() : '';

    if (conversationId) {
      const conversation = await db.uccConversation.findUnique({ where: { id: conversationId }, select: { id: true, studentId: true, assignedToUserId: true } });
      if (!conversation || !canAccessUccConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) return NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 });
      if (linkedStudentId && linkedStudentId !== conversation.studentId) return NextResponse.json({ success: false, error: 'Draft student does not match the conversation.' }, { status: 403 });
      linkedStudentId = conversation.studentId || '';
    } else if (threadId) {
      const thread = await db.communicationThread.findUnique({ where: { id: threadId }, select: { id: true, studentId: true, assignedToId: true } });
      if (!thread || (!supervisor && thread.assignedToId !== auth.userId) || !(await canViewUccConversationB2B(auth, thread))) return NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 });
      if (linkedStudentId && linkedStudentId !== thread.studentId) return NextResponse.json({ success: false, error: 'Draft student does not match the conversation.' }, { status: 403 });
      linkedStudentId = thread.studentId || '';
    } else if (linkedStudentId) {
      const student = await db.student.findUnique({ where: { id: linkedStudentId }, select: { id: true, counselorId: true } });
      if (!student || (!supervisor && student.counselorId !== auth.userId)) return NextResponse.json({ success: false, error: 'Student not found or access denied.' }, { status: 404 });
      if (!await canViewUccConversationB2B(auth, { studentId: student.id })) return NextResponse.json({ success: false, error: 'B2B-confidential student data requires explicit access.' }, { status: 403 });
    }

    let linkedLeadId = typeof leadId === 'string' && leadId.trim() ? leadId.trim() : '';
    if (linkedLeadId) {
      const lead = await db.lead.findUnique({ where: { id: linkedLeadId }, select: { id: true, counselorId: true } });
      if (!lead || (!supervisor && lead.counselorId !== auth.userId)) return NextResponse.json({ success: false, error: 'Lead not found or access denied.' }, { status: 404 });
    }

    let linkedApplicationId = typeof applicationId === 'string' && applicationId.trim() ? applicationId.trim() : '';
    if (linkedApplicationId) {
      const application = await db.application.findUnique({ where: { id: linkedApplicationId }, select: { id: true, studentId: true, isB2bConfidential: true } });
      if (!application || !linkedStudentId || application.studentId !== linkedStudentId) return NextResponse.json({ success: false, error: 'Application does not belong to the linked student.' }, { status: 403 });
      if (application.isB2bConfidential && !canViewUccB2B(auth)) return NextResponse.json({ success: false, error: 'B2B-confidential applications require explicit access.' }, { status: 403 });
    }

    const draft = await db.communicationDraft.create({
      data: {
        channel: channel.trim().toUpperCase(),
        socialInboxMessageId: typeof socialInboxMessageId === 'string' ? socialInboxMessageId : undefined,
        studentId: linkedStudentId || undefined,
        leadId: linkedLeadId || undefined,
        applicationId: linkedApplicationId || undefined,
        draftBody: draftBody.trim(),
        aiGenerated: typeof aiGenerated === 'boolean' ? aiGenerated : true,
        aiConfidence: typeof aiConfidence === 'number' && Number.isFinite(aiConfidence) ? Math.max(0, Math.min(100, Math.round(aiConfidence))) : 0,
        aiReasoning: typeof aiReasoning === 'string' ? aiReasoning.slice(0, 3000) : undefined,
        riskLevel: typeof riskLevel === 'string' ? riskLevel.toUpperCase() : 'LOW',
        riskFlags: typeof riskFlags === 'string' ? riskFlags.slice(0, 3000) : JSON.stringify(riskFlags || []),
        mode: decision.mode,
        status: 'DRAFT',
        createdBy: auth.userId,
      },
    });
    return NextResponse.json({ success: true, draft, requiresHumanReview: decision.requiresHumanReview, displayLabel: 'AI GENERATED DRAFT' }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Communication draft could not be saved.' }, { status: 503 });
  }
}
