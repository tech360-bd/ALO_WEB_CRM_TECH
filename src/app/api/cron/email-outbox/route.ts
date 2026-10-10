import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';
import { EmailConfigError, readEmailMarketingConfig, type EmailMarketingConfig } from '@/lib/email-marketing/config';
import { prismaOutboxStore } from '@/lib/email-marketing/store';
import { createSmtpSender } from '@/lib/email-marketing/transport';
import { buildUnsubscribeUrl } from '@/lib/email-marketing/unsubscribe-token';
import { runOutboxBatch } from '@/lib/email-marketing/worker';

/**
 * Outbox worker entry point. Call it from Hostinger cron every 5 minutes:
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<app-host>/api/cron/email-outbox
 * Sending happens only when EMAIL_SENDING_ENABLED=true. Otherwise the call is a no-op.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function runWorker(request: NextRequest): Promise<NextResponse> {
  const denied = await requireCron(request);
  if (denied) return denied;

  let config: EmailMarketingConfig;
  try {
    config = readEmailMarketingConfig();
  } catch (error) {
    const variable = error instanceof EmailConfigError ? error.variable : 'UNKNOWN';
    return NextResponse.json({ success: false, error: 'EMAIL_CONFIG_INVALID', variable }, { status: 503 });
  }

  if (!config.sendingEnabled) {
    return NextResponse.json({ success: true, skipped: 'EMAIL_SENDING_DISABLED' });
  }
  if (!config.unsubscribeSecret || !config.appBaseUrl) {
    return NextResponse.json({ success: false, error: 'EMAIL_LINKS_NOT_CONFIGURED' }, { status: 503 });
  }

  const smtp = createSmtpSender();
  if (!smtp.ok) {
    return NextResponse.json({ success: false, error: smtp.code }, { status: 503 });
  }

  const baseUrl = config.appBaseUrl;
  const secret = config.unsubscribeSecret;
  try {
    const summary = await runOutboxBatch({
      store: prismaOutboxStore,
      sender: smtp.sender,
      config,
      buildUnsubscribeUrl: (email, campaignId) => buildUnsubscribeUrl({ baseUrl, secret, email, campaignId }),
      now: () => new Date(),
      newLockToken: () => crypto.randomUUID(),
    });
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[email-outbox] batch failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, error: 'EMAIL_WORKER_FAILED' }, { status: 500 });
  } finally {
    smtp.close();
  }
}

export async function GET(request: NextRequest) {
  return runWorker(request);
}

export async function POST(request: NextRequest) {
  return runWorker(request);
}
