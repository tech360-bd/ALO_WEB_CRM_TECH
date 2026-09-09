// ============================================================
// /api/crm/ucc/oauth/callback
// GET — OAuth 2.0 callback handler
// Validates state, encrypts authorization code, stores integration
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptToken } from '@/lib/token-encryption';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const REDIRECT_BASE = `${BASE_URL}/admin/integration-wizard`;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');
    const errorDesc = url.searchParams.get('error_description');

    // User denied or provider returned error
    if (errorParam) {
      return NextResponse.redirect(
        `${REDIRECT_BASE}?oauth_error=${encodeURIComponent(errorDesc || errorParam)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${REDIRECT_BASE}?oauth_error=missing_code_or_state`
      );
    }

    // Validate state from DB
    const stateRecord = await db.uccWebhookEvent.findFirst({
      where: { eventId: state, eventType: 'oauth_state', status: 'pending' },
    });

    if (!stateRecord) {
      return NextResponse.redirect(`${REDIRECT_BASE}?oauth_error=invalid_or_expired_state`);
    }

    // Enforce 10-minute expiry
    let stateData: Record<string, string> = {};
    try {
      stateData = JSON.parse(stateRecord.payload || '{}');
    } catch {}

    if (stateData.createdAt) {
      const age = Date.now() - new Date(stateData.createdAt).getTime();
      if (age > 10 * 60 * 1000) {
        await db.uccWebhookEvent.update({
          where: { id: stateRecord.id },
          data: { status: 'error', errorMessage: 'State expired after 10 minutes.' },
        });
        return NextResponse.redirect(`${REDIRECT_BASE}?oauth_error=state_expired`);
      }
    }

    // Mark state as consumed (one-time use)
    await db.uccWebhookEvent.update({
      where: { id: stateRecord.id },
      data: { status: 'processed' },
    });

    const provider = stateRecord.provider.replace('oauth_state_', '');

    // Encrypt the authorization code before storage
    // In production: exchange code for access_token here using provider token endpoint
    const encryptedCode = encryptToken(code);

    // Upsert SocialIntegration record
    const existing = await db.socialIntegration.findFirst({ where: { provider } });
    let integration;
    if (existing) {
      integration = await db.socialIntegration.update({
        where: { id: existing.id },
        data: {
          status: 'connecting',
          accessToken: encryptedCode,
          lastSyncAt: new Date(),
          metadata: JSON.stringify({
            oauthCallbackAt: new Date().toISOString(),
            actorId: stateData.actorId,
          }),
        },
      });
    } else {
      integration = await db.socialIntegration.create({
        data: {
          provider,
          name: `${provider} (OAuth)`,
          status: 'connecting',
          accessToken: encryptedCode,
          lastSyncAt: new Date(),
          metadata: JSON.stringify({
            oauthCallbackAt: new Date().toISOString(),
            actorId: stateData.actorId,
          }),
        },
      });
    }

    // Audit log
    await db.integrationAuditLog.create({
      data: {
        actorId: stateData.actorId || 'system',
        actorName: stateData.actorEmail || 'OAuth Callback',
        actorRole: 'system',
        action: 'OAUTH_SUCCESS',
        resourceType: 'SocialIntegration',
        resourceId: integration.id,
        provider,
        result: 'success',
        metadata: JSON.stringify({ provider, callbackAt: new Date().toISOString() }),
      },
    });

    return NextResponse.redirect(
      `${REDIRECT_BASE}?oauth_success=1&provider=${provider}&integration_id=${integration.id}`
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${REDIRECT_BASE}?oauth_error=${encodeURIComponent(error.message)}`
    );
  }
}
