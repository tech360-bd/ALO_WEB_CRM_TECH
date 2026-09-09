import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── POST: Convert a DM thread to a lead ─────────────────────────────────────

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
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

    // Create a MarketingLead from the DM thread data
    const lead = await db.marketingLead.create({
      data: {
        name: thread.contactName,
        phone: thread.contactPhone,
        source: 'dm',
        sourceDetail: `DM thread on ${thread.platform}`,
        destination: responses.destination || responses.country || '',
        level: responses.level || responses.studyLevel || '',
        intake: responses.intake || '',
        ieltsScore: responses.ieltsScore ? parseFloat(responses.ieltsScore) : 0,
        pteScore: responses.pteScore ? parseFloat(responses.pteScore) : 0,
        budget: responses.budget || '',
        status: thread.qualified ? 'qualified' : 'new',
        hotLead: thread.qualified,
        createdById: userId,
      },
    });

    // Update the thread to reference the new lead
    const updatedThread = await db.marketingDMThread.update({
      where: { id: threadId },
      data: {
        leadId: lead.id,
      },
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
    console.error('DM convert-lead error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);
