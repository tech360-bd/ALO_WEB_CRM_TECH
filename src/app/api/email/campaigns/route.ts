import { NextRequest, NextResponse } from 'next/server';
import { logAuditAction, withAuth } from '@/lib/auth-middleware';
import { createDraftCampaign, listCampaigns, parseDraftInput } from '@/lib/email-marketing/campaigns';
import { EmailConfigError, publicEmailConfigSummary, readEmailMarketingConfig } from '@/lib/email-marketing/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configOrError() {
  try {
    const config = readEmailMarketingConfig();
    return { ok: true as const, config };
  } catch (error) {
    const variable = error instanceof EmailConfigError ? error.variable : 'UNKNOWN';
    return { ok: false as const, variable };
  }
}

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const campaigns = await listCampaigns();
    const loaded = configOrError();
    const config = loaded.ok ? publicEmailConfigSummary(loaded.config) : { error: 'EMAIL_CONFIG_INVALID', variable: loaded.variable };
    return NextResponse.json({ success: true, campaigns, config });
  }, { requirePermissions: ['marketing.email.view'] })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    const body = await req.json().catch(() => null);
    const parsed = parseDraftInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error, detail: parsed.detail }, { status: parsed.status });
    }

    const loaded = configOrError();
    if (!loaded.ok) {
      return NextResponse.json({ success: false, error: 'EMAIL_CONFIG_INVALID', variable: loaded.variable }, { status: 503 });
    }

    const result = await createDraftCampaign(parsed.value, { userId: auth.userId }, loaded.config);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, detail: result.detail }, { status: result.status });
    }

    await logAuditAction(auth, 'EMAIL_CAMPAIGN_DRAFTED', 'EmailCampaign', result.value.campaignId, {
      recipientCount: result.value.recipientCount,
      skipped: result.value.skipped,
      testMode: parsed.value.testMode,
      testModeRestricted: result.value.testModeRestricted,
      consentBasis: parsed.value.consentBasis,
    });

    return NextResponse.json({ success: true, ...result.value }, { status: 201 });
  }, { requirePermissions: ['marketing.email.manage'] })(request);
}
