import { NextRequest, NextResponse } from 'next/server';
import { logAuditAction, withAuth } from '@/lib/auth-middleware';
import { transitionCampaign, type CampaignAction } from '@/lib/email-marketing/campaigns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS: readonly CampaignAction[] = ['pause', 'resume', 'cancel'];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(async (req, auth) => {
    const { id } = await context.params;
    const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
    const action = body?.action;
    if (typeof action !== 'string' || !ACTIONS.includes(action as CampaignAction)) {
      return NextResponse.json({ success: false, error: 'ACTION_INVALID', allowed: ACTIONS }, { status: 400 });
    }

    const result = await transitionCampaign(id, action as CampaignAction);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, detail: result.detail }, { status: result.status });
    }

    await logAuditAction(auth, `EMAIL_CAMPAIGN_${action.toUpperCase()}`, 'EmailCampaign', id, { status: result.value.status });
    return NextResponse.json({ success: true, ...result.value });
  }, { requirePermissions: ['marketing.email.manage'] })(request);
}
