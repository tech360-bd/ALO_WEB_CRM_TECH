import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { handleIntakeMessage, type Channel } from '@/lib/ai-agents/student-intake-agent';
import { createIntakeSession, intakeSessionCookieOptions, intakeSessionSecret, INTAKE_SESSION_COOKIE, verifyIntakeSession } from '@/lib/ai-agents/intake-session';
import { getOfficeHoursStatus } from '@/lib/communication/after-hours';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  // Accepted for backward compatibility only; never used as an identity or memory key.
  senderId: z.string().max(191).optional(),
  channel: z.enum(['website', 'whatsapp', 'webchat', 'facebook']).optional(),
  text: z.string().max(5000).optional(),
  message: z.string().max(5000).optional(),
  mediaType: z.enum(['document', 'image', 'audio', 'voice', 'video']).nullable().optional(),
  media_type: z.enum(['document', 'image', 'audio', 'voice', 'video']).nullable().optional(),
  mediaInfo: z.object({ fileName: z.string().max(191).optional(), mime: z.string().max(120).optional(), mediaId: z.string().max(191).optional() }).strict().optional(),
  media_info: z.object({ fileName: z.string().max(191).optional(), mime: z.string().max(120).optional(), mediaId: z.string().max(191).optional() }).strict().optional(),
}).strict();

function mapChannel(value: string | undefined, queryValue: string | null): Channel {
  const channel = value || queryValue || 'website';
  if (channel === 'whatsapp' || channel === 'facebook' || channel === 'website' || channel === 'webchat') return channel;
  return 'website';
}

export async function POST(req: NextRequest) {
  const limited = rateLimitMiddleware(req, 'ai');
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid intake request', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const channel = mapChannel(body.channel, req.nextUrl.searchParams.get('channel'));
  const text = body.text ?? body.message ?? '';
  const mediaType = body.mediaType ?? body.media_type ?? null;
  const mediaInfo = body.mediaInfo ?? body.media_info ?? undefined;
  if (!text && !mediaType) return NextResponse.json({ success: false, error: 'text or mediaType required' }, { status: 400 });

  const secret = intakeSessionSecret();
  if (!secret) {
    return NextResponse.json({ success: false, code: 'INTAKE_SESSION_SECRET_REQUIRED', error: 'Secure intake sessions are not configured.' }, { status: 503 });
  }
  const existingId = verifyIntakeSession(req.cookies.get(INTAKE_SESSION_COOKIE)?.value, secret);
  const newSession = existingId ? null : createIntakeSession(secret);
  const senderId = existingId || newSession!.id;

  try {
    const result = await handleIntakeMessage({ channel, senderId, text, mediaType, mediaInfo });
    const response = NextResponse.json({
      success: true,
      reply: result.reply,
      // Public intake never exposes a student record or treats a supplied ID as authentication.
      studentDbId: null,
      studentCode: null,
      state: result.context.state,
      lang: result.context.lang,
      officeHours: result.context.officeHours,
      channel,
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } });
    if (newSession) response.cookies.set(INTAKE_SESSION_COOKIE, newSession.cookie, intakeSessionCookieOptions(req.nextUrl.protocol === 'https:'));
    return response;
  } catch (error) {
    console.error('[student-intake] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Student intake is temporarily unavailable.' }, { status: 503 });
  }
}

export async function GET() {
  try {
    const status = await getOfficeHoursStatus();
    return NextResponse.json({
      success: true,
      agent: 'STUDENT_INTAKE_BN',
      description: 'Public intake for general guidance; student ID alone never authenticates a student or exposes account information.',
      officeHours: !status.isAfterHours,
      officeWindow: 'Configured UCC office-hours schedule in Asia/Dhaka',
      nextOpen: status.nextOpen,
      channels: ['website', 'whatsapp', 'webchat', 'facebook'],
      memory: 'server-signed, httpOnly session with 30-day expiration; no client-selected sender identity',
      contract: {
        POST: { channel: 'website|whatsapp|webchat|facebook', text: 'string', mediaType: 'document|image|audio|voice|null', mediaInfo: '{fileName,mime,mediaId}' },
        reply: 'string (Bangla/English; public responses contain no private student records)',
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Student intake status is temporarily unavailable.' }, { status: 503 });
  }
}
