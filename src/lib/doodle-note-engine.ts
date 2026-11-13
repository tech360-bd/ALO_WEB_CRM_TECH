// ============================================================
// Doodle Note — Privacy-first local-first meeting capture + AI notes
// Source: Onyx-Dev-Labs/doodle-note (171★ 500 commits 5 branches)
//   apps/desktop+mobile, engine/, packages/, local speaker labels,
//   Google Calendar token exchange, privacy-first, model catalog via API keys
// ALO use: counselor↔student meeting capture → diarized transcript → AI notes
//   (summary, action items, next steps, risk flags) — all local-first.
// Reuses: TimelineEvent + StudentMessage + CrmAuditLog + FileMetadata
// No new DB — stores transcript as TimelineEvent.details JSON, audio ref as FileMetadata.
// ============================================================
import { db } from '@/lib/db';

export type DoodleCaptureOpts = {
  meetingId: string;
  studentId?: string;
  counselorId: string;
  title: string;
  calendarEventId?: string; // Google Calendar ID (from doodle-note token flow)
  language?: string; // default en-BD
};

export type SpeakerSegment = { speaker: string; text: string; startMs: number; endMs: number; confidence?: number };
export type DoodleNotes = {
  summary: string;
  actionItems: { assignee: string; task: string; dueDate?: string }[];
  risks: string[];
  nextSteps: string[];
  speakers: string[];
};

const MODEL_CATALOG_KEY = process.env.DOODLE_NOTE_MODEL || 'gpt-4o-mini'; // saved API key catalog (see doodle-note docs/load provider model catalogs)

export async function startDoodleCapture(opts: DoodleCaptureOpts): Promise<{ captureId: string; startedAt: string }> {
  const captureId = `doodle_${opts.meetingId}_${Date.now()}`;
  // Persist start as TimelineEvent (privacy-first: no audio stored yet, just intent)
  await db.timelineEvent.create({
    data: {
      studentId: opts.studentId || 'system',
      type: 'MEETING_CAPTURE_STARTED',
      title: opts.title,
      description: JSON.stringify({ captureId, meetingId: opts.meetingId, counselorId: opts.counselorId, calendarEventId: opts.calendarEventId, language: opts.language || 'en-BD', model: MODEL_CATALOG_KEY }),
      createdAt: new Date(),
    } as any,
  }).catch(()=>{});
  await db.crmAuditLog.create({ data: { action: 'DOODLE_CAPTURE_START', targetCollection: 'MeetingCapture', targetId: captureId, actorUserId: opts.counselorId || '', afterData: JSON.stringify({ meetingId: opts.meetingId, studentId: opts.studentId }), createdAt: new Date() } }).catch(()=>{});
  return { captureId, startedAt: new Date().toISOString() };
}

/**
 * Process local audio chunks → speaker-labeled transcript.
 * In production, engine runs on-device (opus + Whisper + diarization).
 * This server stub validates + persists segments without storing raw audio
 * (raw audio stays on counselor device per privacy-first design).
 */
export async function ingestDoodleSegments(captureId: string, segments: SpeakerSegment[]): Promise<{ segmentCount: number }> {
  if (!segments?.length) throw new Error('No segments');
  // Validate no empty speaker
  const cleaned = segments.filter(s => s.text.trim().length > 0).map(s => ({ ...s, speaker: s.speaker || 'Speaker 1' }));
  await db.timelineEvent.create({
    data: {
      studentId: 'system',
      type: 'MEETING_TRANSCRIPT_INGESTED',
      title: `Transcript: ${captureId}`,
      description: JSON.stringify({ captureId, segments: cleaned.slice(0, 200) }), // cap for DB
      createdAt: new Date(),
    } as any,
  }).catch(()=>{});
  return { segmentCount: cleaned.length };
}

/**
 * Generate AI notes from transcript using saved provider model.
 * Falls back to rule-based summary if no API key (local-first).
 */
export async function generateDoodleNotes(captureId: string, transcriptText: string, opts?: { model?: string }): Promise<DoodleNotes> {
  const model = opts?.model || MODEL_CATALOG_KEY;
  const apiKey = process.env.OPENAI_API_KEY || process.env.DOODLE_NOTE_API_KEY;
  let notes: DoodleNotes | null = null;

  if (apiKey && process.env.PAID_AI_API_ALLOWED === 'true' && transcriptText.length > 20) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are Doodle Note: privacy-first meeting AI. From transcript, return JSON with summary (2-3 sentences), actionItems [{assignee, task, dueDate}], risks [strings], nextSteps [strings], speakers [names]. No preamble.' },
            { role: 'user', content: transcriptText.slice(0, 12000) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });
      const json: any = await res.json().catch(()=>null);
      const content = json?.choices?.[0]?.message?.content;
      if (content) notes = JSON.parse(content);
    } catch {}
  }

  // Fallback: extractive summary
  if (!notes) {
    const lines = transcriptText.split(/[.!\n]/).filter(Boolean).slice(0, 3);
    notes = {
      summary: lines.join('. ').slice(0, 400) || 'Meeting captured — AI notes unavailable offline. Transcript preserved locally.',
      actionItems: [],
      risks: [],
      nextSteps: ['Review transcript', 'Confirm next counseling appointment'],
      speakers: Array.from(new Set(transcriptText.match(/Speaker \d/g) || ['Speaker 1'])),
    };
  }

  await db.timelineEvent.create({
    data: {
      studentId: 'system',
      type: 'MEETING_NOTES_GENERATED',
      title: `Notes: ${captureId}`,
      description: JSON.stringify({ captureId, notes }),
      createdAt: new Date(),
    } as any,
  }).catch(()=>{});
  return notes;
}

/**
 * Google Calendar token refresh helper (mirrors doodle-note fix: restore Google Calendar token exchange)
 * Stores token via Encrypted Token utility (reuses token-encryption.ts pattern) — caller persists.
 */
export async function refreshDoodleCalendarToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    });
    const j: any = await r.json();
    if (j.access_token) return { accessToken: j.access_token, expiresIn: j.expires_in || 3600 };
  } catch {}
  return null;
}
