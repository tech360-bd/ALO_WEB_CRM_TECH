/**
 * GET /api/v1/whatsapp/status
 * ===========================
 * Public endpoint returning the current WhatsApp AI agent status.
 * Used by the website widget to show whether the agent is online.
 *
 * No auth required — returns only public info (no tokens, no secrets).
 */
import { NextResponse } from "next/server";
import { whatsappConfig, getAgentStatus, AI_MODE_LABELS, STATUS_LABELS } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const cfg = whatsappConfig();
  const status = getAgentStatus();
  const statusLabel = STATUS_LABELS[status];

  return NextResponse.json({
    success: true,
    message: "OK",
    data: {
      status,
      statusLabel: statusLabel.label,
      statusColor: statusLabel.color,
      aiMode: cfg.aiMode,
      aiModeLabel: AI_MODE_LABELS[cfg.aiMode] ?? cfg.aiMode,
      apiConfigured: cfg.apiConfigured,
      displayNumber: cfg.display,
      // Public phone number for "Call us" fallback
      callNumber: cfg.number,
      // Whether the web chat widget can be used
      webChatEnabled: cfg.aiMode !== "PAUSED",
    },
    meta: {},
    errors: [],
  });
}
