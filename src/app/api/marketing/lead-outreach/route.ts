import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHANNELS = new Set(['WHATSAPP', 'EMAIL', 'SMS', 'PHONE', 'FACEBOOK', 'INSTAGRAM']);

// PII and consent-ledger records are manager-only until an audited assigned-lead scope exists.
export const GET = withMarketingAccess(async (_req: Request, _auth: AuthContext) => {
  try {
    const outreach = await db.leadOutreach.findMany({
      include: { lead: { select: { leadId: true, fullName: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    return NextResponse.json({ success: true, outreach, delivery: 'NOT CONFIGURED — records are not proof of messages sent' });
  } catch (error) {
    console.error('[marketing.lead-outreach] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load outreach records.' }, { status: 503 });
  }
}, 'manager');

// POST creates an unsent draft only, and only for a lead with a current opted-in consent ledger entry.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  const channel = typeof body?.channel === 'string' ? body.channel.trim().toUpperCase() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const sourceName = typeof body?.sourceName === 'string' ? body.sourceName.trim().slice(0, 120) : 'Manual';
  const sourceType = typeof body?.sourceType === 'string' ? body.sourceType.trim().toUpperCase() : 'OUTREACH';
  if (!leadId || leadId.length > 191 || !CHANNELS.has(channel) || !message || message.length > 5000) {
    return NextResponse.json({ success: false, error: 'A lead, supported channel and 1–5000 character draft are required.' }, { status: 400 });
  }
  if (!['ORGANIC', 'PAID', 'OUTREACH', 'REFERRAL'].includes(sourceType)) {
    return NextResponse.json({ success: false, error: 'Unsupported outreach source type.' }, { status: 400 });
  }
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId }, select: { id: true } });
    if (!lead) return NextResponse.json({ success: false, error: 'CRM lead not found.' }, { status: 404 });
    const consent = await db.consentRecord.findFirst({
      where: { leadId: lead.id, channel },
      orderBy: { createdAt: 'desc' },
      select: { id: true, consentStatus: true, optOutDate: true },
    });
    if (!consent || consent.consentStatus !== 'OPTED_IN' || consent.optOutDate) {
      return NextResponse.json({ success: false, error: 'A current OPTED_IN consent record for this exact channel is required. No outreach draft was saved.' }, { status: 403 });
    }
    const outreach = await db.leadOutreach.create({
      data: {
        leadId: lead.id,
        sourceName: sourceName || 'Manual',
        sourceType,
        channel,
        consentStatus: 'OPTED_IN',
        outreachHistory: JSON.stringify([{ date: new Date().toISOString(), channel, message, result: 'DRAFT_NOT_SENT', consentRecordId: consent.id }]),
        status: 'DRAFT',
      },
    });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'MESSAGE_ACTION', resource: 'LeadOutreach', resourceId: outreach.id, details: JSON.stringify({ leadId: lead.id, channel, consentRecordId: consent.id, state: 'DRAFT_NOT_SENT' }) } });
    return NextResponse.json({ success: true, sent: false, state: 'DRAFT_NOT_SENT', outreach, message: 'Draft recorded against verified consent. No provider message was sent.' }, { status: 201 });
  } catch (error) {
    console.error('[marketing.lead-outreach] draft failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to record outreach draft.' }, { status: 503 });
  }
}, 'manager');
