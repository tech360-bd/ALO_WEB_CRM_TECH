// Social Integration Center API.
// Configuration records may be listed, but credentials are never returned and
// unverified metadata can never be presented as a live provider connection.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const VIEW_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER']);
const MANAGE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const PROVIDERS = [
  { provider: 'whatsapp', name: 'WhatsApp Business Platform' },
  { provider: 'meta_business', name: 'Meta Business Manager' },
  { provider: 'facebook_page', name: 'Facebook Pages' },
  { provider: 'instagram', name: 'Instagram Business' },
  { provider: 'google_analytics', name: 'Google Analytics 4' },
  { provider: 'google_search_console', name: 'Google Search Console' },
  { provider: 'youtube', name: 'YouTube Channel' },
  { provider: 'telegram', name: 'Telegram Bot' },
  { provider: 'smtp_email', name: 'SMTP & IMAP Mailer' },
  { provider: 'sms_provider', name: 'SMS Gateway Provider' },
];

function hasRole(auth: { userType: string; roles: string[] }, allowed: Set<string>) {
  return [auth.userType, ...auth.roles].some((role) => allowed.has(role.toUpperCase()));
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, VIEW_ROLES)) return NextResponse.json({ success: false, error: 'Integration status access is not permitted.' }, { status: 403 });

  try {
    const stored = await db.socialIntegration.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        provider: true,
        name: true,
        status: true,
        connectedAccount: true,
        businessAccountId: true,
        tokenExpiresAt: true,
        webhookStatus: true,
        apiVersion: true,
        healthStatus: true,
        lastSyncAt: true,
        accounts: {
          select: { id: true, provider: true, assetId: true, assetName: true, assetType: true, phoneNumber: true, isPrimary: true, status: true },
        },
      },
    });
    const integrations = PROVIDERS.map((provider) => {
      const record = stored.find((item) => item.provider === provider.provider);
      return record
        ? {
            ...record,
            // The legacy `status=connected` flag has no OAuth, webhook, or live
            // message evidence attached to it. Never turn it into a green claim.
            status: 'NOT_VERIFIED',
            reportedStatus: record.status,
            providerEvidence: 'NOT_VERIFIED — no successful provider exchange/live test is stored',
          }
        : {
            id: `draft_${provider.provider}`,
            provider: provider.provider,
            name: provider.name,
            status: 'CONFIGURATION_REQUIRED',
            connectedAccount: null,
            businessAccountId: null,
            tokenExpiresAt: null,
            webhookStatus: 'inactive',
            apiVersion: null,
            healthStatus: 'unknown',
            lastSyncAt: null,
            accounts: [],
            providerEvidence: 'NOT VERIFIED — no provider credentials or live-test evidence',
          };
    });
    return NextResponse.json({ success: true, integrations });
  } catch {
    return NextResponse.json({ success: false, error: 'Integration status is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  // The old endpoint wrote placeholder IDs/tokens, set status="connected" and
  // activated webhooks without contacting a provider. Refuse that fake-success
  // path until a real credential exchange, evidence record, and live test exist.
  await logAuditAction(auth, 'SOCIAL_INTEGRATION_CONFIGURATION_REFUSED', 'SocialIntegration', '', {
    reason: 'provider_exchange_and_live_verification_not_implemented',
  });
  return NextResponse.json({
    success: false,
    status: 'NOT_VERIFIED',
    error: 'Provider setup is not available through this endpoint. No credentials were stored and no integration was marked connected.',
    verification: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
  }, { status: 501 });
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Integration id is required.' }, { status: 400 });

  try {
    const existing = await db.socialIntegration.findUnique({ where: { id }, select: { id: true, provider: true, status: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Integration not found.' }, { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.socialIntegration.update({
        where: { id },
        data: {
          status: 'disconnected',
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          webhookSecret: null,
          webhookStatus: 'inactive',
          healthStatus: 'warning',
        },
      });
      await tx.socialAccount.updateMany({ where: { integrationId: id }, data: { status: 'disconnected' } });
    });
    await logAuditAction(auth, 'DISCONNECT_SOCIAL_INTEGRATION_LOCALLY', 'SocialIntegration', id, {
      provider: existing.provider,
      priorStatus: existing.status,
      externalRevocation: 'NOT_VERIFIED — local credentials cleared; provider revocation requires authorized external access',
    });
    return NextResponse.json({
      success: true,
      status: 'DISCONNECTED_LOCALLY',
      message: 'Local credentials and account statuses were cleared. Provider-side token revocation was not performed or verified.',
      providerRevocation: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Integration could not be disconnected locally.' }, { status: 503 });
  }
}
