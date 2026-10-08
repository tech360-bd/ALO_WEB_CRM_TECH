import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

async function handlePost(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || body.action !== 'send_bulk' || body.dryRun !== true) {
    return NextResponse.json({ error: 'Only consent-checked SMS dry runs are supported.' }, { status: 400 });
  }
  if (typeof body.message !== 'string' || !body.message.trim() || !/\b(stop|opt[ -]?out)\b/i.test(body.message)) {
    return NextResponse.json({ error: 'Message and clear opt-out instructions are required.' }, { status: 400 });
  }
  try {
    const count = await db.communicationConsent.count({
      where: { channel: 'sms', consentGiven: true, optedOutAt: null },
    });
    return NextResponse.json({ success: true, dryRun: true, count, cost: null, requiresApproval: true });
  } catch (error) {
    console.error('[sms/dry-run] Consent query failed.', {
      code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: 'SMS campaign validation is temporarily unavailable.' }, { status: 503 });
  }
}

export const POST = withAuth(handlePost, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'MARKETING', 'MARKETING_MANAGER'] });
