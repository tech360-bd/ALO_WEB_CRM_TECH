import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

async function handlePost(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || body.action !== 'send_campaign' || body.dryRun !== true) {
    return NextResponse.json({ error: 'Only consent-checked campaign dry runs are supported.' }, { status: 400 });
  }
  if (typeof body.subject !== 'string' || !body.subject.trim() || typeof body.html !== 'string' || !body.html.trim()) {
    return NextResponse.json({ error: 'Subject and HTML content are required.' }, { status: 400 });
  }
  try {
    const count = await db.communicationConsent.count({
      where: { channel: 'email', consentGiven: true, optedOutAt: null },
    });
    return NextResponse.json({ success: true, dryRun: true, count, requiresApproval: true });
  } catch (error) {
    console.error('[email/dry-run] Consent query failed.', {
      code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: 'Email campaign validation is temporarily unavailable.' }, { status: 503 });
  }
}

export const POST = withAuth(handlePost, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'MARKETING', 'MARKETING_MANAGER'] });
