import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { detectLanguage, detectIntent, detectSentiment, calculateLeadScore, generateAiReply, logAiOperation } from '@/lib/ai-whatsapp-engine';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { message, studentId, threadId, messageId, studentName, context } = body;

    if (!message) return NextResponse.json({ success: false, error: 'message required' }, { status: 400 });

    const lang = detectLanguage(message);
    const intent = detectIntent(message);
    const sentiment = detectSentiment(message);
    const aiReply = await generateAiReply({
      message,
      studentName,
      language: lang.language,
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      context,
    });

    // Log
    if (studentId && threadId) {
      await logAiOperation({
        threadId,
        messageId,
        studentId,
        intent: intent.intent,
        intentConfidence: intent.confidence,
        sentiment: sentiment.sentiment,
        sentimentConfidence: sentiment.confidence,
        language: lang.language,
        shouldHandover: aiReply.shouldHandover,
        handoverReason: aiReply.handoverReason,
      }).catch(() => {});

      // Update lead score
      const score = calculateLeadScore({
        engagement: 5,
        intent: intent.intent,
        urgency: sentiment.isUrgent ? 8 : sentiment.isHighRisk ? 6 : 3,
      });

      await db.aiLeadScore.upsert({
        where: { studentId },
        update: { score: score.score, explanation: score.explanation, calculatedAt: new Date() },
        create: { studentId, score: score.score, explanation: score.explanation },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      language: lang,
      intent,
      sentiment,
      aiReply,
      shouldHandover: aiReply.shouldHandover,
      handoverReason: aiReply.handoverReason,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const threadId = searchParams.get('threadId');

    const whereIntent: any = {};
    const whereSentiment: any = {};
    if (studentId) {
      whereIntent.studentId = studentId;
      whereSentiment.studentId = studentId;
    }
    if (threadId) {
      whereIntent.threadId = threadId;
      whereSentiment.threadId = threadId;
    }

    const intents = await db.aiIntentLog.findMany({ where: whereIntent, orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []);
    const sentiments = await db.aiSentimentLog.findMany({ where: whereSentiment, orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []);
    const leadScores = await db.aiLeadScore.findMany({ where: studentId ? { studentId } : {}, orderBy: { score: 'desc' }, take: 20 }).catch(() => []);

    return NextResponse.json({ success: true, intents, sentiments, leadScores });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
