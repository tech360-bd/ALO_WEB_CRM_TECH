// OAuth callback boundary. This project currently has no real provider token
// exchange or live-test persistence; authorization codes are validated for a
// pending state, discarded, and never stored as access tokens.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function redirectToWizard(error: string) {
  const configuredBase = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const base = new URL(configuredBase);
  if (process.env.NODE_ENV === 'production' && base.protocol !== 'https:') {
    throw new Error('NEXTAUTH_URL must use HTTPS in production');
  }
  const destination = new URL('/admin/integration-wizard', base);
  destination.searchParams.set('oauth_error', error);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const providerError = url.searchParams.get('error');
    if (providerError) return redirectToWizard('provider_denied');
    if (!code || !state || state.length > 512) return redirectToWizard('missing_or_invalid_state');

    const stateRecord = await db.uccWebhookEvent.findFirst({
      where: { eventId: state, eventType: 'oauth_state', status: 'pending' },
      select: { id: true, provider: true, payload: true },
    });
    if (!stateRecord || !stateRecord.provider.startsWith('oauth_state_')) {
      return redirectToWizard('invalid_or_expired_state');
    }

    let stateData: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(stateRecord.payload || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stateData = parsed;
    } catch { /* malformed state cannot establish authority */ }
    const createdAt = typeof stateData.createdAt === 'string' ? Date.parse(stateData.createdAt) : Number.NaN;
    const ageMs = Date.now() - createdAt;
    if (!Number.isFinite(createdAt) || ageMs < 0 || ageMs > 10 * 60 * 1000) {
      await db.uccWebhookEvent.updateMany({
        where: { id: stateRecord.id, status: 'pending' },
        data: { status: 'error', errorMessage: 'OAuth state expired or had an invalid timestamp.', payload: '{}' },
      });
      return redirectToWizard('state_expired');
    }

    const claimed = await db.uccWebhookEvent.updateMany({
      where: { id: stateRecord.id, status: 'pending' },
      data: {
        status: 'error',
        errorMessage: 'Authorization code discarded; provider exchange is not implemented.',
        payload: '{}',
      },
    });
    if (claimed.count !== 1) return redirectToWizard('invalid_or_expired_state');

    const actorId = typeof stateData.actorId === 'string' ? stateData.actorId : 'system';
    const actorEmail = typeof stateData.actorEmail === 'string' ? stateData.actorEmail : 'OAuth Callback';
    await db.integrationAuditLog.create({
      data: {
        actorId,
        actorName: actorEmail,
        actorRole: 'system',
        action: 'OAUTH_CODE_EXCHANGE_NOT_IMPLEMENTED',
        resourceType: 'SocialIntegration',
        resourceId: stateRecord.provider.replace('oauth_state_', ''),
        provider: stateRecord.provider.replace('oauth_state_', ''),
        result: 'not_verified',
        metadata: JSON.stringify({ callbackAt: new Date().toISOString(), authorizationCodeStored: false }),
      },
    });

    // Do not expose provider errors, authorization codes, state, or internal
    // exception details in the browser redirect.
    return redirectToWizard('provider_exchange_not_implemented');
  } catch {
    try {
      return redirectToWizard('callback_unavailable');
    } catch {
      return NextResponse.json({ success: false, error: 'OAuth callback is unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  }
}
