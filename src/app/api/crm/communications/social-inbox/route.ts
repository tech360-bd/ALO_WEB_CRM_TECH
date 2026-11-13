import { NextRequest, NextResponse } from 'next/server';
import { withAuth, logAuditAction, AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { hasMarketingAccess, isMarketingManager } from '@/lib/marketing/access';

async function employeeAssignmentIds(auth: AuthContext): Promise<string[]> {
  const employee = await db.employee.findFirst({
    where: { OR: [{ userId: auth.userId }, { employeeId: auth.userId }] },
    select: { userId: true, employeeId: true, status: true },
  }).catch(() => null);
  if (employee && employee.status.toLowerCase() === 'active') return [...new Set([auth.userId, employee.userId, employee.employeeId])];
  return [auth.userId];
}

async function canUseSocialInbox(auth: AuthContext): Promise<boolean> {
  if (isMarketingManager(auth)) return true;
  if (await hasMarketingAccess(auth, 'social-inbox')) return true;
  const employee = await db.employee.findFirst({
    where: { OR: [{ userId: auth.userId }, { employeeId: auth.userId }], status: { in: ['active', 'ACTIVE'] } },
    select: { id: true },
  }).catch(() => null);
  return Boolean(employee);
}

async function authorize(request: Request, handler: (req: Request, auth: AuthContext) => Promise<NextResponse>) {
  return withAuth(async (req, auth) => {
    if (!(await canUseSocialInbox(auth))) {
      return NextResponse.json({ success: false, error: 'Social inbox access is not approved for this account.' }, { status: 403 });
    }
    return handler(req, auth);
  })(request);
}

export async function GET(request: NextRequest) {
  return authorize(request, async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const where: Record<string, unknown> = {};
      const platform = searchParams.get('platform');
      const status = searchParams.get('status');
      if (platform) where.platform = platform;
      if (status) where.status = status;
      if (!isMarketingManager(auth)) where.assignedTo = { in: await employeeAssignmentIds(auth) };
      const inbox = await db.socialInbox.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true, platform: true, externalMessageId: true, externalCommentId: true,
          senderName: true, senderProfileUrl: true, messageText: true, intent: true,
          leadId: true, studentId: true, assignedTo: true, status: true,
          createdAt: true, updatedAt: true,
        },
      });
      return NextResponse.json({ success: true, data: inbox });
    } catch (error) {
      console.error('[crm.social-inbox] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
      return NextResponse.json({ success: false, error: 'Unable to load assigned social conversations.' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return authorize(request, async (req, auth) => {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body.action !== 'string' || typeof body.id !== 'string' || !body.id.trim()) {
      return NextResponse.json({ success: false, error: 'id and action are required.' }, { status: 400 });
    }
    try {
      const item = await db.socialInbox.findUnique({ where: { id: body.id.trim() } });
      if (!item) return NextResponse.json({ success: false, error: 'Social message not found.' }, { status: 404 });
      const manager = isMarketingManager(auth);
      if (!manager) {
        const assignees = await employeeAssignmentIds(auth);
        if (!assignees.includes(item.assignedTo)) return NextResponse.json({ success: false, error: 'This conversation is not assigned to your account.' }, { status: 403 });
      }

      if (body.action === 'reply' || body.action === 'save_draft') {
        const replyText = typeof body.replyText === 'string' ? body.replyText.trim() : '';
        if (!replyText || replyText.length > 5000) return NextResponse.json({ success: false, error: 'A reply draft of 1–5000 characters is required.' }, { status: 400 });
        const draft = await db.aiReplyDraft.create({
          data: {
            communicationId: item.id,
            promptContext: item.messageText.slice(0, 5000),
            draftBody: replyText,
            riskFlags: JSON.stringify(['NOT_SENT', 'MANAGER_REVIEW_REQUIRED']),
            approvalStatus: 'pending',
            createdBy: auth.userId,
          },
        });
        await logAuditAction(auth, 'save_social_reply_draft', 'SocialInbox', item.id, { draftId: draft.id, deliveryStatus: 'NOT_SENT' });
        return NextResponse.json({ success: true, state: 'DRAFT_PENDING_REVIEW', sent: false, message: 'Reply saved as a draft for review. No external message was sent.', draftId: draft.id }, { status: 201 });
      }

      if (body.action === 'hide_comment') {
        return NextResponse.json({ success: false, deliveryStatus: 'NOT_CONFIGURED', error: 'Official comment moderation is not configured here. No comment was hidden.' }, { status: 503 });
      }

      if (body.action === 'mark_spam') {
        await db.socialInbox.update({ where: { id: item.id }, data: { status: 'spam' } });
        await logAuditAction(auth, 'mark_social_message_spam', 'SocialInbox', item.id, { platform: item.platform });
        return NextResponse.json({ success: true, state: 'MARKED_SPAM', message: 'Marked as spam in the ALO CRM only. No platform action was taken.' });
      }

      if (body.action === 'create_lead') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const phone = typeof body.phone === 'string' ? body.phone.trim().replace(/[\s()-]/g, '') : '';
        const name = typeof body.name === 'string' ? body.name.trim().slice(0, 160) : item.senderName.slice(0, 160);
        if ((!email && !phone) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || phone.length > 32) {
          return NextResponse.json({ success: false, error: 'A valid phone or email is needed to prevent duplicate lead creation.' }, { status: 400 });
        }
        const existing = await db.marketingLead.findFirst({ where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] }, select: { id: true } });
        const lead = existing ? await db.marketingLead.update({ where: { id: existing.id }, data: { source: `social_${item.platform.toLowerCase()}`, sourceDetail: item.messageText.slice(0, 500) } }) : await db.marketingLead.create({
          data: {
            name: name || 'Social inquiry', phone, email,
            source: `social_${item.platform.toLowerCase()}`,
            sourceDetail: item.messageText.slice(0, 500),
            status: 'new', consent: false, createdById: auth.identityDomain === 'user' ? auth.userId : null,
          },
        });
        await db.socialInbox.update({ where: { id: item.id }, data: { leadId: lead.id, status: 'converted' } });
        await logAuditAction(auth, existing ? 'link_existing_social_lead' : 'create_social_lead', 'SocialInbox', item.id, { leadId: lead.id, consent: false });
        return NextResponse.json({ success: true, leadId: lead.id, deduplicated: Boolean(existing), consent: false, message: existing ? 'Existing lead linked. Marketing consent remains unconfirmed.' : 'Lead created. Marketing consent remains unconfirmed; no outreach is permitted until opt-in is recorded.' }, { status: existing ? 200 : 201 });
      }

      if (body.action === 'assign') {
        if (!manager) return NextResponse.json({ success: false, error: 'Only the Marketing Manager or Super Admin can assign official social conversations.' }, { status: 403 });
        const requested = typeof body.assignedTo === 'string' ? body.assignedTo.trim() : '';
        if (!requested) return NextResponse.json({ success: false, error: 'assignedTo is required.' }, { status: 400 });
        const employee = await db.employee.findFirst({ where: { OR: [{ userId: requested }, { employeeId: requested }], status: { in: ['active', 'ACTIVE'] } }, select: { userId: true } });
        if (!employee) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 400 });
        const updated = await db.socialInbox.update({ where: { id: item.id }, data: { assignedTo: employee.userId } });
        await logAuditAction(auth, 'assign_social_conversation', 'SocialInbox', item.id, { assignedToUserId: employee.userId });
        return NextResponse.json({ success: true, message: 'Conversation assigned in ALO CRM.', assignedTo: updated.assignedTo });
      }

      if (body.action === 'ai_draft') {
        return NextResponse.json({ success: false, error: 'No verified AI draft provider is configured for this inbox. No generated text was saved.' }, { status: 503 });
      }
      return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
    } catch (error) {
      console.error('[crm.social-inbox] action failed', { error: error instanceof Error ? error.name : 'UnknownError' });
      return NextResponse.json({ success: false, error: 'Unable to update the social conversation.' }, { status: 500 });
    }
  });
}
