// ============================================================
// /api/crm/ucc/ai-assistant
// POST — Real AI Communication Hub Assistant (§165, §166, §175)
//
// Every response is derived from stored conversation data and approved
// template content ONLY. The previous implementation returned fabricated
// people, fabricated scholarships and canned "translations" regardless of
// input — that's exactly what this module forbids ("Do not build fake",
// "AI must NOT invent information"). Where a capability requires a provider
// that is not configured, this route answers CONFIGURATION REQUIRED.
//
// §166: permission is enforced BEFORE retrieval — the conversation is loaded
// without messages, access is proven, and only then are messages fetched.
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import {
  buildFormPrefill,
  buildReplySuggestions,
  canAccessConversation,
  summarizeConversation,
  TRANSLATION_CONFIGURATION_REQUIRED,
  type AssistantActor,
  type UccConversationView,
  type UccMessageView,
} from '@/lib/ucc/ai-assistant-core';

export const dynamic = 'force-dynamic';

function actorFromAuth(auth: unknown): AssistantActor {
  const a = auth as { userId?: string; roles?: string[] };
  const role = (a.roles || []).map((r) => String(r).toUpperCase())[0] || "";
  return { userId: a.userId, role, employeeId: a.userId };
}

async function loadConversationCore(id: string) {
  const conversation = (await db.uccConversation.findUnique({ where: { id } })) as
    | (UccConversationView & { unreadCount: number })
    | null;
  return conversation;
}

async function loadMessages(conversationId: string, take = 60): Promise<UccMessageView[]> {
  const rows = await db.uccMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take,
  });
  return rows.map((m) => ({
    id: m.id,
    direction: m.direction,
    senderName: m.senderName,
    messageType: m.messageType,
    content: m.content,
    status: m.status,
    createdAt: m.createdAt,
  }));
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const { action, conversationId, text, targetLanguage = 'en' } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    // All four actions require a real conversation id — no anonymous demo data.
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'conversationId is required — the assistant works on a real, authorized conversation only (§166).' },
        { status: 400 },
      );
    }

    const conversation = await loadConversationCore(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 },
      );
    }
    if (!canAccessConversation(actorFromAuth(auth), conversation)) {
      return NextResponse.json(
        { success: false, error: "Forbidden — conversation is not assigned to you (§166: permission is enforced before retrieval)" },
        { status: 403 },
      );
    }

    if (action === 'suggest_replies') {
      // Suggestions come exclusively from approved, unlocked templates.
      const templates = await db.communicationTemplate.findMany({
        where: { status: 'active', visibility: { in: ['public_safe', 'internal'] } },
        orderBy: { updatedAt: 'desc' },
        take: 12,
      });
      const messages = await loadMessages(conversation.id, 30);
      const suggestions = buildReplySuggestions(
        templates.map((t) => ({
          templateCode: t.templateCode,
          templateName: t.templateName,
          channel: t.channel,
          body: t.body,
        })),
        conversation,
      );

      return NextResponse.json({
        success: true,
        action,
        suggestions,
        requiresHumanReview: true,
        basisNote:
          suggestions.length > 0
            ? 'Suggestions are approved-template drafts filled with conversation facts — review before sending (§130: AI GENERATED DRAFT).'
            : 'No approved template applies to this channel — draft manually. The assistant never invents content (§175).',
        lastMessageContext: messages.length
          ? { lastInboundAt: conversation.lastMessageAt, messageCount: messages.length }
          : undefined,
      });
    }

    if (action === 'form_prefill') {
      return NextResponse.json({
        success: true,
        action,
        prefilledData: buildFormPrefill(conversation),
        basisNote:
          'Only fields backed by stored conversation data are prefilled; everything else stays empty so no profile data is ever fabricated (§175).',
      });
    }

    if (action === 'translate') {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return NextResponse.json({ success: false, error: 'text is required for translation' }, { status: 400 });
      }
      const configured = !!process.env.TRANSLATION_PROVIDER && !!process.env.TRANSLATION_API_KEY;
      if (!configured) {
        return NextResponse.json(
          { success: false, error: TRANSLATION_CONFIGURATION_REQUIRED, targetLanguage },
          { status: 503 },
        );
      }
      // A configured provider would be invoked here. This branch deliberately
      // has no canned output.
      return NextResponse.json(
        { success: false, error: 'Translation provider adapter is not installed — configure the adapter package.' },
        { status: 503 },
      );
    }

    if (action === 'summarize') {
      const messages = await loadMessages(conversation.id, 60);
      const summary = summarizeConversation(conversation, messages);
      return NextResponse.json({ success: true, action, ...summary });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
