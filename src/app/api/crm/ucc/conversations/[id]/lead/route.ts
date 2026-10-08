import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { canAccessUccConversation, canUseUccCommunication } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

function digits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

async function loadAuthorizedConversation(request: Request, id: string) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return { response: auth } as const;
  if (!canUseUccCommunication(auth)) return { response: NextResponse.json({ success: false, error: 'Communication access is not permitted.' }, { status: 403 }) } as const;
  const conversation = await db.uccConversation.findUnique({ where: { id } });
  if (!conversation || !canAccessUccConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
    return { response: NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 }) } as const;
  }
  return { auth, conversation } as const;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await loadAuthorizedConversation(request, id);
  if ('response' in access) return access.response;
  const body = await request.json().catch(() => null);
  const existingLeadId = typeof body?.existingLeadId === 'string' ? body.existingLeadId.trim() : '';
  const createNew = body?.createNew === true;
  const leadData = body?.leadData && typeof body.leadData === 'object' && !Array.isArray(body.leadData) ? body.leadData : {};
  if (existingLeadId && createNew) return NextResponse.json({ success: false, error: 'Choose an existing lead or create a new one, not both.' }, { status: 400 });
  if (!existingLeadId && !createNew) return NextResponse.json({ success: false, error: 'Provide existingLeadId or set createNew=true.' }, { status: 400 });

  try {
    if (existingLeadId) {
      const lead = await db.marketingLead.findUnique({ where: { id: existingLeadId }, select: { id: true, name: true, phone: true, email: true, destination: true, status: true, counselorId: true } });
      if (!lead) return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
      const isSupervisor = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'].some((role) =>
        [...access.auth.roles, access.auth.userType].some((value) => value.toUpperCase() === role),
      );
      const contactMatches = (!!digits(access.conversation.participantPhone) && digits(access.conversation.participantPhone) === digits(lead.phone)) ||
        (!!access.conversation.participantEmail && access.conversation.participantEmail.toLowerCase() === lead.email.toLowerCase());
      if (!isSupervisor && lead.counselorId !== access.auth.userId && !contactMatches) {
        return NextResponse.json({ success: false, error: 'Lead access is not permitted for this conversation.' }, { status: 403 });
      }
      const phoneComparable = !!access.conversation.participantPhone && !!lead.phone;
      const emailComparable = !!access.conversation.participantEmail && !!lead.email;
      if (!isSupervisor && ((phoneComparable && digits(access.conversation.participantPhone) !== digits(lead.phone)) ||
          (emailComparable && access.conversation.participantEmail!.toLowerCase() !== lead.email.toLowerCase()))) {
        return NextResponse.json({ success: false, error: 'Lead contact details do not match this conversation.' }, { status: 403 });
      }
      const updated = await db.uccConversation.update({ where: { id }, data: { leadId: lead.id } });
      await logAuditAction(access.auth, 'CONVERSATION_LINKED_TO_LEAD', 'UccConversation', id, { leadId: lead.id });
      return NextResponse.json({ success: true, message: 'Conversation linked to an authorized lead.', lead: { id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, destination: lead.destination, status: lead.status }, conversation: updated });
    }

    const suppliedPhone = typeof leadData.phone === 'string' ? leadData.phone.trim() : '';
    const suppliedEmail = typeof leadData.email === 'string' ? leadData.email.trim().toLowerCase() : '';
    if (suppliedPhone && access.conversation.participantPhone && digits(suppliedPhone) !== digits(access.conversation.participantPhone)) {
      return NextResponse.json({ success: false, error: 'Lead phone must match the conversation contact.' }, { status: 400 });
    }
    if (suppliedEmail && access.conversation.participantEmail && suppliedEmail !== access.conversation.participantEmail.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Lead email must match the conversation contact.' }, { status: 400 });
    }
    const lead = await db.marketingLead.create({
      data: {
        name: typeof leadData.name === 'string' && leadData.name.trim() ? leadData.name.trim().slice(0, 191) : access.conversation.participantName,
        phone: access.conversation.participantPhone || suppliedPhone,
        email: access.conversation.participantEmail || suppliedEmail,
        destination: typeof leadData.destination === 'string' ? leadData.destination.trim().slice(0, 191) : access.conversation.destinationCountry || '',
        source: `ucc_${access.conversation.channel}`,
        status: 'new',
        counselorId: access.auth.userId,
        counselorName: access.auth.name || access.auth.email || 'Staff',
        createdById: access.auth.userId,
      },
    });
    const updated = await db.uccConversation.update({ where: { id }, data: { leadId: lead.id } });
    await logAuditAction(access.auth, 'LEAD_CREATED_FROM_CONVERSATION', 'UccConversation', id, { leadId: lead.id, channel: access.conversation.channel });
    return NextResponse.json({ success: true, message: 'Lead created from the authorized conversation and linked.', lead: { id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, destination: lead.destination, status: lead.status }, conversation: updated }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Conversation could not be linked to a lead.' }, { status: 503 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await loadAuthorizedConversation(request, id);
  if ('response' in access) return access.response;
  try {
    const lead = access.conversation.leadId
      ? await db.marketingLead.findUnique({
          where: { id: access.conversation.leadId },
          select: { id: true, name: true, phone: true, email: true, destination: true, status: true, source: true, counselorId: true },
        })
      : null;
    return NextResponse.json({ success: true, leadId: access.conversation.leadId, lead: lead ? { id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, destination: lead.destination, status: lead.status, source: lead.source } : null });
  } catch {
    return NextResponse.json({ success: false, error: 'Lead information is temporarily unavailable.' }, { status: 503 });
  }
}
