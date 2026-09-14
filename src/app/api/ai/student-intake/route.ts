import { NextRequest, NextResponse } from 'next/server';
import { handleIntakeMessage, type Channel, isOfficeHours } from '@/lib/ai-agents/student-intake-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Unified Student Intake AI — website / webchat / Facebook / any channel
 * POST { channel, senderId, text, mediaType?, mediaInfo? }
 * Optional bearer: verifies student ownership; else public intake (ID-first).
 * Sequential per senderId: callers must await; server also serialises via DB memory.
 */

function mapChannel(c: string | null): Channel {
  if (c === 'whatsapp' || c === 'facebook' || c === 'website' || c === 'webchat') return c;
  return 'website';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}));
  const channel = mapChannel(body.channel || req.nextUrl.searchParams.get('channel') || 'website');
  const senderId: string = (body.senderId || body.sessionId || body.phone || '').toString().trim();
  const text: string = (body.text || body.message || '').toString();
  const mediaType = body.mediaType ?? body.media_type ?? null;
  const mediaInfo = body.mediaInfo ?? body.media_info ?? null;

  if (!senderId) return NextResponse.json({ error: 'senderId required' }, { status: 400 });
  if (!text && !mediaType) return NextResponse.json({ error: 'text or mediaType required' }, { status: 400 });

  // Public intake allowed; optional auth not blocking

  try {
    const result = await handleIntakeMessage({
      channel,
      senderId,
      text,
      mediaType,
      mediaInfo,
    });

    // Office hours flag for frontend human-like typing indicator
    const office = isOfficeHours();

    return NextResponse.json({
      success: true,
      reply: result.reply,
      studentDbId: result.studentDbId ?? result.context.studentDbId ?? null,
      studentCode: result.studentCode ?? result.context.studentCode ?? null,
      state: result.context.state,
      lang: result.context.lang,
      officeHours: office,
      channel,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'intake_failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Health + contract for Super-Admin dashboard
  return NextResponse.json({
    success: true,
    agent: 'STUDENT_INTAKE_BN',
    description: 'First asks Student ID (AE-YYYYXXXXXX), verifies → informs independent submission, then multilingual (BN/EN) + doc/voice counseling with memory & sequential queue.',
    officeHours: isOfficeHours(),
    officeWindow: '10:00-19:00 Asia/Dhaka, Sat-Thu (human-like sequential)',
    channels: ['website','whatsapp','webchat','facebook'],
    memory: 'per senderId+channel via AgentMemory + TimelineEvent fallback',
    contract: {
      POST: { channel: 'website|whatsapp|webchat|facebook', senderId: 'phone|sessionId', text: 'string', mediaType: 'document|image|audio|voice|null', mediaInfo: '{fileName,mime,mediaId,transcription}' },
      reply: 'string (Bangla/English, office-hours aware)'
    }
  });
}
