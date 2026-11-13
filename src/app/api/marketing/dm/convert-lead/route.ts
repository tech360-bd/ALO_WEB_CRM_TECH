import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

// ─── POST: Convert a DM thread to a lead ─────────────────────────────────────

export const POST = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  try {
    const body = await request.json();
    const { threadId } = body;
    const userId = auth.userId;

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }

    const thread = await db.marketingDMThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'DM thread not found' },
        { status: 404 }
      );
    }

    if (thread.leadId) {
      return NextResponse.json(
        { error: 'DM thread already converted to lead' },
        { status: 400 }
      );
    }

    // Parse qualification responses for additional lead data
    let responses: Record<string, string> = {};
    try {
      responses = JSON.parse(thread.responses || '{}');
    } catch {
      // Use empty responses if parsing fails
    }

    // Create/link atomically so retries do not duplicate a lead. Inbound interest is not marketing consent.
    const { lead, updatedThread } = await db.$transaction(async (tx) => {
      const current = await tx.marketingDMThread.findUnique({ where: { id: threadId } });
      if (!current || current.leadId) throw new Error('DM_ALREADY_CONVERTED');
      const createdLead = await tx.marketingLead.create({
        data: {
          name: current.contactName,
          phone: current.contactPhone,
          source: 'dm',
          sourceDetail: `DM thread on ${current.platform}`,
          destination: responses.destination || responses.country || '',
          level: responses.level || responses.studyLevel || '',
          intake: responses.intake || '',
          ieltsScore: responses.ieltsScore ? parseFloat(responses.ieltsScore) : 0,
          pteScore: responses.pteScore ? parseFloat(responses.pteScore) : 0,
          budget: responses.budget || '',
          status: current.qualified ? 'qualified' : 'new',
          consent: false,
          hotLead: current.qualified,
          createdById: userId,
        },
      });
      const changed = await tx.marketingDMThread.updateMany({ where: { id: threadId, leadId: null }, data: { leadId: createdLead.id } });
      if (!changed.count) throw new Error('DM_ALREADY_CONVERTED');
      return { lead: createdLead, updatedThread: await tx.marketingDMThread.findUnique({ where: { id: threadId } }) };
    });

    await createAuditLog({
      userId,
      role: auth.roles[0] || 'marketing',
      action: 'dm.convert_to_lead',
      resource: 'MarketingDMThread',
      resourceId: threadId,
      details: {
        leadId: lead.id,
        contactName: thread.contactName,
        platform: thread.platform,
        qualified: thread.qualified,
      },
    });

    return NextResponse.json({ lead, thread: updatedThread }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'DM_ALREADY_CONVERTED') return NextResponse.json({ success: false, error: 'DM thread was already converted by another request.' }, { status: 409 });
    console.error('DM convert-lead error:', error instanceof Error ? error.name : 'UnknownError');
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'manager');
