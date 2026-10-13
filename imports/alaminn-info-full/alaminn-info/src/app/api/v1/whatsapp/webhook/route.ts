/**
 * WhatsApp Webhook — Meta Cloud API verification + inbound messages
 *
 * GET  /api/v1/whatsapp/webhook
 *   Meta verifies the webhook by sending hub.challenge. We echo it back
 *   only if hub.verify_token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 *
 * POST /api/v1/whatsapp/webhook
 *   Meta delivers inbound messages here. We parse, classify, retrieve
 *   knowledge, generate a response, and send it back via the Cloud API.
 *   All steps are logged to AuditLog for observability.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  whatsappConfig,
  parseInboundWebhook,
  processAgentMessage,
  sendWhatsappMessage,
  type AgentMessage,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── GET: Webhook verification ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const cfg = whatsappConfig();

  if (!cfg.webhookVerifyToken) {
    return new NextResponse("Webhook verify token not configured", { status: 503 });
  }

  if (mode === "subscribe" && token === cfg.webhookVerifyToken) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST: Inbound message handler ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const inbound = parseInboundWebhook(payload);
  if (!inbound || !inbound.text) {
    // Not a text message (could be a status update or system event) — ack only
    return NextResponse.json({ success: true, message: "ignored" });
  }

  // Log inbound message (safe — no PII beyond the number hash)
  const logKey = inbound.from.slice(-4);
  await safeAudit("whatsapp_message_received", "WhatsApp", inbound.messageId, {
    fromSuffix: logKey,
    messageLength: inbound.text.length,
    messageType: inbound.type,
  });

  // Fetch recent conversation history (last 10 messages from this user)
  const history = await loadHistory(inbound.from);

  // Process via the AI agent
  const conversationRef = `wa-${inbound.from}-${Date.now().toString(36)}`;
  const response = await processAgentMessage({
    message: inbound.text,
    from: inbound.from,
    history,
    conversationRef,
  });

  // Log intent detection
  await safeAudit(
    "whatsapp_intent_detected",
    "WhatsApp",
    inbound.messageId,
    {
      fromSuffix: logKey,
      intent: response.intent,
      confidence: response.intentConfidence,
      method: response.intentMethod,
      usedLlm: response.usedLlm,
      elapsedMs: response.elapsedMs,
    }
  );

  // Log knowledge retrieval (if any)
  if (response.knowledge && response.knowledge.totalFound > 0) {
    await safeAudit(
      "whatsapp_knowledge_retrieved",
      "WhatsApp",
      inbound.messageId,
      {
        fromSuffix: logKey,
        totalFound: response.knowledge.totalFound,
        universities: response.knowledge.universities.length,
        courses: response.knowledge.courses.length,
        scholarships: response.knowledge.scholarships.length,
        countries: response.knowledge.countries.length,
      }
    );
  }

  // Extract the response text from the action
  const responseText =
    response.action.type === "human_handoff"
      ? response.action.message
      : response.action.type === "lead_created"
        ? response.action.message
        : response.action.type === "consent_required"
          ? response.action.message
          : (response.action as { message: string }).message;

  // Send the response back to the user
  const sendResult = await sendWhatsappMessage(inbound.from, responseText);

  // Log the send result
  await safeAudit(
    sendResult.status === "FAILED" ? "whatsapp_message_failed" : "whatsapp_message_sent",
    "WhatsApp",
    sendResult.messageId || inbound.messageId,
    {
      fromSuffix: logKey,
      status: sendResult.status,
      actuallySent: sendResult.actuallySent,
      error: sendResult.error,
      responseLength: responseText.length,
      totalElapsedMs: Date.now() - start,
    }
  );

  // If lead was created, log it
  if (response.action.type === "lead_created") {
    await safeAudit(
      "whatsapp_lead_created",
      "Inquiry",
      response.action.inquiryId,
      {
        fromSuffix: logKey,
        isExisting: response.action.isExisting,
        contactId: response.action.contactId,
      }
    );
  }

  // If human handoff, log it
  if (response.action.type === "human_handoff") {
    await safeAudit(
      "whatsapp_human_handoff",
      "Task",
      response.action.taskId,
      {
        fromSuffix: logKey,
        reason: "User requested or AI escalated",
      }
    );
  }

  // Store the conversation turn (for future history loading + audit)
  await storeConversationTurn(inbound.from, inbound.text, responseText, response);

  return NextResponse.json({
    success: true,
    message: "processed",
    data: {
      intent: response.intent,
      status: sendResult.status,
      actuallySent: sendResult.actuallySent,
      elapsedMs: Date.now() - start,
    },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

async function safeAudit(
  action: string,
  resource: string,
  resourceId: string | null,
  meta: Record<string, unknown>
) {
  try {
    await db.auditLog.create({
      data: {
        actorId: "system",
        action,
        resource,
        resourceId: resourceId || null,
        meta: JSON.stringify(meta),
      },
    });
  } catch {
    // Non-fatal — audit logging should never break the message flow
  }
}

async function loadHistory(from: string): Promise<AgentMessage[]> {
  try {
    // Store conversation turns in a Note linked to a synthetic contact.
    // For simplicity, we look up the last 10 audit logs with action
    // whatsapp_message_received/sent for this user suffix.
    const logs = await db.auditLog.findMany({
      where: {
        action: { in: ["whatsapp_message_received", "whatsapp_message_sent"] },
        meta: { contains: from.slice(-4) },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { action: true, meta: true, createdAt: true },
    });
    // Reverse to chronological order
    return logs.reverse().map((log) => ({
      role: log.action === "whatsapp_message_received" ? "user" : "assistant",
      content: "", // We don't store message content in audit logs (privacy)
      timestamp: log.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function storeConversationTurn(
  _from: string,
  _userMessage: string,
  _assistantResponse: string,
  _response: Awaited<ReturnType<typeof processAgentMessage>>
) {
  // Intentionally NOT storing message content in the DB for privacy.
  // Only metadata (intent, timestamp, status) is logged via safeAudit above.
  // If a future requirement needs full conversation history, a dedicated
  // WhatsAppConversation model with encryption-at-rest should be added.
}
