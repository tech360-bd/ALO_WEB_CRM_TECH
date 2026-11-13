import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logAuditAction, withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { detectLanguage, detectIntent, detectSentiment, generateAiReply, logAiOperation } from '@/lib/ai-whatsapp-engine';
import { canUseUccCommunication } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

const postSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  threadId: z.string().trim().min(1).max(191).optional(),
  // Accepted only as a consistency check against the server-resolved thread.
  studentId: z.string().trim().min(1).max(191).optional(),
}).strict();

function canReadWhatsappAi(auth: AuthContext): boolean {
  return canUseUccCommunication(auth);
}

export const POST = withAuth(async (req, auth) => {
  if (!canReadWhatsappAi(auth)) return NextResponse.json({ success: false, error: 'WhatsApp AI drafting access is not permitted.' }, { status: 403 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid WhatsApp AI draft request.' }, { status: 400 });
  const { message, threadId, studentId } = parsed.data;
  if (studentId && !threadId) return NextResponse.json({ success: false, error: 'A student link must be resolved from an authorized WhatsApp thread.' }, { status: 400 });

  let trustedStudentId = '';
  if (threadId) {
    const thread = await db.communicationThread.findUnique({
      where: { id: threadId },
      select: { id: true, channel: true, studentId: true },
    });
    if (!thread || thread.channel.toLowerCase() !== 'whatsapp' || !(await canViewUccConversationB2B(auth, thread))) {
      return NextResponse.json({ success: false, error: 'WhatsApp conversation not found or access denied.' }, { status: 404 });
    }
    if (studentId && studentId !== thread.studentId) return NextResponse.json({ success: false, error: 'Student context does not match this conversation.' }, { status: 403 });
    trustedStudentId = thread.studentId || '';
  }

  const language = detectLanguage(message);
  const intent = detectIntent(message);
  const sentiment = detectSentiment(message);
  const aiReply = await generateAiReply({
    message,
    language: language.language,
    intent: intent.intent,
    sentiment: sentiment.sentiment,
  });

  await logAuditAction(auth, 'WHATSAPP_AI_DRAFT_CREATED', threadId ? 'CommunicationThread' : 'WhatsAppAiDraft', threadId || 'unlinked', {
    intent: intent.intent,
    sentiment: sentiment.sentiment,
    requiresHumanReview: true,
  });
  if (threadId) {
    await logAiOperation({
      threadId,
      studentId: trustedStudentId,
      intent: intent.intent,
      intentConfidence: intent.confidence,
      sentiment: sentiment.sentiment,
      sentimentConfidence: sentiment.confidence,
      language: language.language,
      shouldHandover: aiReply.shouldHandover,
      handoverReason: aiReply.handoverReason,
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    language,
    intent,
    sentiment,
    aiReply: { ...aiReply, requiresHumanApproval: true, automaticallySent: false },
    shouldHandover: aiReply.shouldHandover,
    handoverReason: aiReply.handoverReason,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
});

export const GET = withAuth(async (req, auth) => {
  if (!canReadWhatsappAi(auth)) return NextResponse.json({ success: false, error: 'WhatsApp AI log access is not permitted.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const requestedStudentId = searchParams.get('studentId');
  const threadId = searchParams.get('threadId');
  if (requestedStudentId && !threadId) return NextResponse.json({ success: false, error: 'Student scope must be resolved from an authorized WhatsApp thread.' }, { status: 400 });

  let studentId = '';
  if (threadId) {
    const thread = await db.communicationThread.findUnique({ where: { id: threadId }, select: { id: true, channel: true, studentId: true } });
    if (!thread || thread.channel.toLowerCase() !== 'whatsapp' || !(await canViewUccConversationB2B(auth, thread))) {
      return NextResponse.json({ success: false, error: 'WhatsApp conversation not found or access denied.' }, { status: 404 });
    }
    if (requestedStudentId && requestedStudentId !== thread.studentId) return NextResponse.json({ success: false, error: 'Student scope does not match this conversation.' }, { status: 403 });
    studentId = thread.studentId || '';
  }

  const whereIntent: Record<string, unknown> = {};
  const whereSentiment: Record<string, unknown> = {};
  if (studentId) {
    whereIntent.studentId = studentId;
    whereSentiment.studentId = studentId;
  }
  if (threadId) {
    whereIntent.threadId = threadId;
    whereSentiment.threadId = threadId;
  }

  const [intents, sentiments, leadScores] = await Promise.all([
    db.aiIntentLog.findMany({ where: whereIntent, orderBy: { createdAt: 'desc' }, take: 50 }),
    db.aiSentimentLog.findMany({ where: whereSentiment, orderBy: { createdAt: 'desc' }, take: 50 }),
    db.aiLeadScore.findMany({ where: studentId ? { studentId } : {}, orderBy: { score: 'desc' }, take: 20 }),
  ]);
  await logAuditAction(auth, 'WHATSAPP_AI_LOGS_VIEWED', 'AiIntentLog', threadId || 'all', {
    scopedToThread: Boolean(threadId),
    resultCount: intents.length + sentiments.length + leadScores.length,
  });

  return NextResponse.json({ success: true, intents, sentiments, leadScores }, { headers: { 'Cache-Control': 'private, no-store' } });
});
