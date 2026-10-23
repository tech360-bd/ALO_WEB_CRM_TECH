import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

const KEYWORD_TYPES = new Set(['CONTAINS', 'EXACT']);
const PLATFORMS = new Set(['ALL', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'MESSENGER']);

export const GET = withMarketingAccess(async (req: Request, _auth: AuthContext) => {
  const status = new URL(req.url).searchParams.get('status');
  const triggers = await db.keywordTrigger.findMany({ where: status ? { status } : {}, orderBy: { triggerCount: 'desc' }, take: 500 });
  return NextResponse.json({ success: true, triggers, automation: 'DISABLED_UNVERIFIED — records are drafts/configuration only' });
}, 'manager');

// Creates an inactive configuration draft; request booleans can never enable automation.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : '';
  const keywordType = typeof body?.keywordType === 'string' ? body.keywordType.trim().toUpperCase() : 'CONTAINS';
  const platform = typeof body?.platform === 'string' ? body.platform.trim().toUpperCase() : 'ALL';
  const autoReplyText = typeof body?.autoReplyText === 'string' ? body.autoReplyText.trim() : '';
  const autoDmText = typeof body?.autoDmText === 'string' ? body.autoDmText.trim() : '';
  if (!keyword || keyword.length > 120 || !KEYWORD_TYPES.has(keywordType) || !PLATFORMS.has(platform) || !autoReplyText || autoReplyText.length > 3000 || autoDmText.length > 3000) {
    return NextResponse.json({ success: false, error: 'Keyword, match type, platform, or draft text is invalid.' }, { status: 400 });
  }
  try {
    const trigger = await db.keywordTrigger.create({
      data: { keyword, keywordType, platform, autoReplyText, autoDmText: autoDmText || null, autoCreateLead: false, autoAssignCounselor: false, sendPortalLink: false, status: 'DRAFT' },
    });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'KeywordTrigger', resourceId: trigger.id, details: JSON.stringify({ action: 'draft_created', keyword, automationEnabled: false }) } });
    return NextResponse.json({ success: true, trigger, message: 'Trigger draft saved. It is inactive; no reply, DM, lead creation, assignment, or portal link was executed.' }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') return NextResponse.json({ success: false, error: 'A trigger with this keyword already exists.' }, { status: 409 });
    console.error('[marketing.keyword-triggers] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to save trigger draft.' }, { status: 503 });
  }
}, 'manager');

// Update copy or disable legacy rules. Enabling is unavailable until a verified provider flow exists.
export const PATCH = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const status = typeof body?.status === 'string' ? body.status.trim().toUpperCase() : undefined;
  if (!id) return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400 });
  if (status === 'ACTIVE') return NextResponse.json({ success: false, error: 'Automation activation requires a verified official provider, approved content and delivery tests. The trigger was not enabled.' }, { status: 503 });
  if (status && !['DRAFT', 'INACTIVE', 'PAUSED'].includes(status)) return NextResponse.json({ success: false, error: 'Unsupported trigger status.' }, { status: 400 });
  const data: Record<string, unknown> = { autoCreateLead: false, autoAssignCounselor: false, sendPortalLink: false };
  if (status) data.status = status;
  if (typeof body?.autoReplyText === 'string') {
    if (!body.autoReplyText.trim() || body.autoReplyText.length > 3000) return NextResponse.json({ success: false, error: 'Invalid reply draft.' }, { status: 400 });
    data.autoReplyText = body.autoReplyText.trim();
  }
  if (typeof body?.autoDmText === 'string') {
    if (body.autoDmText.length > 3000) return NextResponse.json({ success: false, error: 'DM draft is too long.' }, { status: 400 });
    data.autoDmText = body.autoDmText.trim();
  }
  if (typeof body?.keyword === 'string') data.keyword = body.keyword.trim().slice(0, 120);
  try {
    const trigger = await db.keywordTrigger.update({ where: { id }, data });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'KeywordTrigger', resourceId: id, details: JSON.stringify({ action: 'draft_updated_or_deactivated', status: trigger.status, automationEnabled: false }) } });
    return NextResponse.json({ success: true, trigger, message: 'Configuration saved; automatic channel actions remain disabled.' });
  } catch (error) {
    console.error('[marketing.keyword-triggers] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update trigger.' }, { status: 503 });
  }
}, 'manager');

// Preserve audit/history; disabling is safer than deleting a rule.
export const DELETE = withMarketingAccess(async () => NextResponse.json({ success: false, error: 'Deletion is disabled. Set the trigger to INACTIVE to preserve its audit history.' }, { status: 409 }), 'manager');
