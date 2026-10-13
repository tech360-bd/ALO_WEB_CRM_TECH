/**
 * POST /api/v1/whatsapp/chat
 * ==========================
 * Public endpoint for the website's "Chat with AI on WhatsApp" widget.
 * Accepts a message from the website, runs the AI agent, and returns
 * the response WITHOUT sending via WhatsApp Cloud API (the user is on
 * the website, not WhatsApp — they can choose to continue on WhatsApp
 * via a deep link if they want).
 *
 * This lets users preview the AI agent before switching to WhatsApp.
 *
 * Rate limited: 20 messages / 10 min / IP (in-memory).
 */
import { NextRequest, NextResponse } from "next/server";
import { processAgentMessage, buildWhatsappHandoffUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory rate limiter (per IP)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 20; // 20 messages per window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  return { ok: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Rate limit exceeded. Please try again later.",
        data: null,
        meta: { retryAfterSeconds: Math.ceil((rl.resetAt - Date.now()) / 1000) },
        errors: ["rate_limited"],
      },
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Parse body
  let body: { message?: string; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body.", data: null, meta: {}, errors: ["invalid_json"] },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { success: false, message: "Message is required.", data: null, meta: {}, errors: ["message_required"] },
      { status: 400 }
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { success: false, message: "Message too long (max 2000 chars).", data: null, meta: {}, errors: ["message_too_long"] },
      { status: 400 }
    );
  }

  // Process via the AI agent (don't send via WhatsApp — return the response)
  const response = await processAgentMessage({
    message,
    from: "web-preview", // not a real WhatsApp number
    history: Array.isArray(body.history)
      ? (body.history as { role: "user" | "assistant"; content: string }[])
          .filter((m) => m && typeof m.content === "string")
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }))
      : [],
    conversationRef: `web-${Date.now().toString(36)}`,
  });

  // Extract response text
  const responseText =
    response.action.type === "respond" ||
    response.action.type === "consent_required" ||
    response.action.type === "lead_created" ||
    response.action.type === "human_handoff"
      ? response.action.message
      : "I'm sorry, I couldn't process that. Please try again.";

  // Build a WhatsApp handoff URL (for "Continue on WhatsApp" button)
  const handoffUrl = buildWhatsappHandoffUrl(response.timestamp.slice(-8));

  return NextResponse.json({
    success: true,
    message: "OK",
    data: {
      reply: responseText,
      intent: response.intent,
      intentConfidence: response.intentConfidence,
      usedLlm: response.usedLlm,
      identified: response.identified,
      knowledgeFound: response.knowledge?.totalFound ?? 0,
      continueOnWhatsappUrl: handoffUrl,
      action: response.action.type,
    },
    meta: {
      elapsedMs: response.elapsedMs,
      rateLimitRemaining: rl.remaining,
      rateLimitResetAt: new Date(rl.resetAt).toISOString(),
    },
    errors: [],
  });
}

// Health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "WhatsApp AI chat endpoint is active.",
    data: { endpoint: "/api/v1/whatsapp/chat", methods: ["POST"] },
  });
}
