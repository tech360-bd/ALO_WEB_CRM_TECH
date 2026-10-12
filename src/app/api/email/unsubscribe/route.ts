import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { escapeHtml } from '@/lib/email-marketing/templating';
import { verifyUnsubscribeToken, type UnsubscribeTokenFailure } from '@/lib/email-marketing/unsubscribe-token';

/**
 * Public unsubscribe endpoint.
 *   GET  shows a confirmation page. It changes nothing, so mail scanners that prefetch links are harmless.
 *   POST records the unsubscribe. Mail clients call it directly for RFC 8058 one-click.
 * Both need a valid signed token from ?t=. Public access is allowed in src/proxy.ts.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAILURE_MESSAGES: Record<UnsubscribeTokenFailure, { status: number; text: string }> = {
  config: { status: 503, text: 'Unsubscribe is temporarily unavailable. Please try again later.' },
  malformed: { status: 400, text: 'This unsubscribe link is not valid.' },
  bad_signature: { status: 400, text: 'This unsubscribe link is not valid.' },
  expired: { status: 400, text: 'This unsubscribe link has expired. Please contact us to be removed from our list.' },
};

function page(title: string, bodyHtml: string, status: number): NextResponse {
  const html = [
    '<!doctype html><html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="robots" content="noindex,nofollow">',
    `<title>${escapeHtml(title)}</title></head>`,
    '<body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">',
    '<main style="max-width:520px;margin:48px auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">',
    `<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>`,
    bodyHtml,
    '</main></body></html>',
  ].join('');
  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email.charAt(0)}***${email.slice(at)}`;
}

function currentSecret(): string | null {
  const value = (process.env.EMAIL_UNSUBSCRIBE_SECRET ?? '').trim();
  return value.length > 0 ? value : null;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t');
  const verification = verifyUnsubscribeToken(token, currentSecret());
  if (!verification.ok) {
    const failure = FAILURE_MESSAGES[verification.reason];
    return page('Unsubscribe', `<p>${escapeHtml(failure.text)}</p>`, failure.status);
  }

  const action = `/api/email/unsubscribe?t=${encodeURIComponent(token ?? '')}`;
  return page(
    'Unsubscribe from marketing emails',
    [
      `<p style="line-height:1.5">Stop marketing emails to <strong>${escapeHtml(maskEmail(verification.email))}</strong>?</p>`,
      `<form method="post" action="${escapeHtml(action)}">`,
      '<button type="submit" style="padding:10px 16px;background:#0f172a;color:#ffffff;border:0;border-radius:8px;font-size:15px;cursor:pointer">Confirm unsubscribe</button>',
      '</form>',
    ].join(''),
    200
  );
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t');
  const verification = verifyUnsubscribeToken(token, currentSecret());
  if (!verification.ok) {
    const failure = FAILURE_MESSAGES[verification.reason];
    return page('Unsubscribe', `<p>${escapeHtml(failure.text)}</p>`, failure.status);
  }

  try {
    await db.emailSuppression.upsert({
      where: { email: verification.email },
      create: { email: verification.email, reason: 'unsubscribed', source: 'link' },
      update: {},
    });
  } catch (error) {
    console.error('[email-unsubscribe] write failed:', error instanceof Error ? error.name : 'unknown');
    return page('Unsubscribe', '<p>We could not record this request. Please try again later.</p>', 503);
  }

  if (verification.campaignId) {
    // Best effort. The suppression above is what enforces the opt-out.
    await db.emailEvent
      .create({
        data: { campaignId: verification.campaignId, email: verification.email, type: 'unsubscribed' },
      })
      .catch(() => undefined);
  }

  return page(
    'You are unsubscribed',
    '<p style="line-height:1.5">You will no longer receive marketing emails from ALO Education at this address.</p>',
    200
  );
}
