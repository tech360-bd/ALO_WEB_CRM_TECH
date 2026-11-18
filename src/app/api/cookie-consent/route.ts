import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { readRequestTextLimited } from '@/lib/request-body';
import { publicMutationOriginAllowed } from '@/lib/request-origin';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8_000;
const VISITOR_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const SOURCE_PATTERN = /^[a-z0-9_-]{2,32}$/;
const VERSION_PATTERN = /^[0-9A-Za-z.-]{1,32}$/;

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  return ip.slice(0, 64);
}

/**
 * /api/cookie-consent
 *
 * Records the public website visitor's cookie/analytics consent as an
 * append-only audit row (spec: Cookie Consent Manager). No personal identity
 * is accepted or required: the anonymous `visitorId` (opaque random token from
 * localStorage) is the only subject reference. Marketing communication consent
 * is a separate, per-channel decision recorded by the marketing-consent service —
 * this record is about analytics/preferences only and is never treated as
 * marketing permission.
 *
 * POST   — record a decision: { visitorId, necessary?, analytics, marketing, functional, consentVersion, policyVersion, source? }
 * DELETE — record withdrawal: { visitorId, source? } (append-only row, withdrawnAt set, all optional categories false)
 * GET    — latest decision for ?visitorId= (the visitor's own record; no cross-visitor access)
 */

export async function POST(request: NextRequest) {
  if (!publicMutationOriginAllowed(request)) {
    return NextResponse.json({ success: false, error: 'Origin not allowed.' }, { status: 403 });
  }
  const ip = clientIp(request);
  const limit = checkRateLimit(ip, 'cookie_consent');
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many consent updates. Please try again later.' }, { status: 429 });
  }

  const requestBody = await readRequestTextLimited(request, MAX_BODY_BYTES);
  if (!requestBody.ok) {
    return NextResponse.json({ success: false, error: 'Submission is too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(requestBody.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'A valid JSON submission is required.' }, { status: 400 });
  }

  const visitorId = typeof body.visitorId === 'string' ? body.visitorId.trim() : '';
  if (!VISITOR_ID_PATTERN.test(visitorId)) {
    return NextResponse.json({ success: false, error: 'visitorId must be an opaque token (8-64 chars, [A-Za-z0-9_-]).' }, { status: 400 });
  }

  const analytics = body.analytics === true;
  const marketing = body.marketing === true;
  const functional = body.functional === true;
  // Strictly necessary storage is always granted; the API ignores a
  // `necessary: false` attempt rather than recording an invalid state.
  const necessary = true;
  const consentVersion = typeof body.consentVersion === 'string' && VERSION_PATTERN.test(body.consentVersion) ? body.consentVersion : '2.0';
  const policyVersion = typeof body.policyVersion === 'string' && VERSION_PATTERN.test(body.policyVersion) ? body.policyVersion : '2.0';
  const source = typeof body.source === 'string' && SOURCE_PATTERN.test(body.source) ? body.source : 'cookie_banner';

  try {
    const record = await db.websiteConsent.create({
      data: {
        visitorId,
        necessary,
        analytics,
        marketing,
        functional,
        consentVersion,
        policyVersion,
        source,
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ success: true, consentId: record.id, createdAt: record.createdAt });
  } catch (error) {
    console.error('[cookie-consent] failed to record consent', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Could not save your preference right now. Please try again.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!publicMutationOriginAllowed(request)) {
    return NextResponse.json({ success: false, error: 'Origin not allowed.' }, { status: 403 });
  }
  const ip = clientIp(request);
  const limit = checkRateLimit(ip, 'cookie_consent');
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many consent updates. Please try again later.' }, { status: 429 });
  }

  const requestBody = await readRequestTextLimited(request, MAX_BODY_BYTES);
  if (!requestBody.ok) {
    return NextResponse.json({ success: false, error: 'Submission is too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(requestBody.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'A valid JSON submission is required.' }, { status: 400 });
  }

  const visitorId = typeof body.visitorId === 'string' ? body.visitorId.trim() : '';
  if (!VISITOR_ID_PATTERN.test(visitorId)) {
    return NextResponse.json({ success: false, error: 'visitorId must be an opaque token (8-64 chars, [A-Za-z0-9_-]).' }, { status: 400 });
  }
  const source = typeof body.source === 'string' && SOURCE_PATTERN.test(body.source) ? body.source : 'cookie_banner_withdraw';

  try {
    const record = await db.websiteConsent.create({
      data: {
        visitorId,
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        consentVersion: '2.0',
        policyVersion: '2.0',
        source,
        withdrawnAt: new Date(),
      },
      select: { id: true, withdrawnAt: true },
    });
    return NextResponse.json({ success: true, consentId: record.id, withdrawnAt: record.withdrawnAt });
  } catch (error) {
    console.error('[cookie-consent] failed to record withdrawal', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Could not record withdrawal right now. Please try again.' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const visitorId = request.nextUrl.searchParams.get('visitorId')?.trim() || '';
  if (!VISITOR_ID_PATTERN.test(visitorId)) {
    return NextResponse.json({ success: false, error: 'visitorId must be an opaque token (8-64 chars, [A-Za-z0-9_-]).' }, { status: 400 });
  }
  try {
    const latest = await db.websiteConsent.findFirst({
      where: { visitorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
        consentVersion: true,
        policyVersion: true,
        source: true,
        withdrawnAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, record: latest });
  } catch (error) {
    console.error('[cookie-consent] failed to read consent', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Could not read consent right now.' }, { status: 503 });
  }
}
