import { NextRequest, NextResponse } from 'next/server';
import { logAuditAction, withAuth } from '@/lib/auth-middleware';
import { queueCampaign } from '@/lib/email-marketing/campaigns';
import { EmailConfigError, readEmailMarketingConfig } from '@/lib/email-marketing/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Moves a draft into the outbox. The body must repeat the exact recipientCount and
 * subject. The worker still refuses to send unless EMAIL_SENDING_ENABLED=true, and
 * still applies test mode and the caps.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(async (req, auth) => {
    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    let config;
    try {
      config = readEmailMarketingConfig();
    } catch (error) {
      const variable = error instanceof EmailConfigError ? error.variable : 'UNKNOWN';
      return NextResponse.json({ success: false, error: 'EMAIL_CONFIG_INVALID', variable }, { status: 503 });
    }
    if (!config.unsubscribeSecret || !config.appBaseUrl) {
      return NextResponse.json({ success: false, error: 'EMAIL_LINKS_NOT_CONFIGURED' }, { status: 409 });
    }

    const result = await queueCampaign(id, body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, detail: result.detail }, { status: result.status });
    }

    await logAuditAction(auth, 'EMAIL_CAMPAIGN_QUEUED', 'EmailCampaign', id, { queued: result.value.queued });
    return NextResponse.json({
      success: true,
      ...result.value,
      sendingEnabled: config.sendingEnabled,
      testMode: config.testMode,
    });
  }, { requirePermissions: ['marketing.email.manage'] })(request);
}
