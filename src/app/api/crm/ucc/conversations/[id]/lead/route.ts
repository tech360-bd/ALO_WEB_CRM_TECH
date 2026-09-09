// ============================================================
// /api/crm/ucc/conversations/[id]/lead
// POST — Link conversation to existing lead, or create a new MarketingLead
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const { existingLeadId, createNew, leadData } = await request.json() as {
      existingLeadId?: string;
      createNew?: boolean;
      leadData?: {
        name?: string;
        phone?: string;
        email?: string;
        destination?: string;
      };
    };

    const conv = await db.uccConversation.findUnique({ where: { id } });
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    if (existingLeadId) {
      await db.uccConversation.update({ where: { id }, data: { leadId: existingLeadId } });
      await logAuditAction(auth, 'CONVERSATION_LINKED_TO_LEAD', 'UccConversation', id, { leadId: existingLeadId });
      return NextResponse.json({ success: true, message: 'Conversation linked to existing lead.', leadId: existingLeadId });
    }

    if (createNew) {
      const lead = await db.marketingLead.create({
        data: {
          name: leadData?.name || conv.participantName || 'Unknown',
          phone: leadData?.phone || conv.participantPhone || '',
          email: leadData?.email || conv.participantEmail || '',
          destination: leadData?.destination || conv.destinationCountry || '',
          source: `ucc_${conv.channel}`,
          status: 'new',
          counselorId: auth.userId,
          counselorName: auth.name || auth.email || 'Staff',
          createdById: auth.userId,
        },
      });

      await db.uccConversation.update({ where: { id }, data: { leadId: lead.id } });
      await logAuditAction(auth, 'LEAD_CREATED_FROM_CONVERSATION', 'UccConversation', id, {
        leadId: lead.id,
        channel: conv.channel,
      });

      return NextResponse.json({ success: true, message: 'New lead created and linked to conversation.', lead });
    }

    return NextResponse.json(
      { success: false, error: 'Provide existingLeadId or set createNew=true with leadData.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const conv = await db.uccConversation.findUnique({ where: { id } });
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    let lead: any = null;
    if (conv.leadId) {
      lead = await db.marketingLead.findUnique({ where: { id: conv.leadId } });
    }

    return NextResponse.json({ success: true, leadId: conv.leadId, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
