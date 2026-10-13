/**
 * GET /api/v1/whatsapp/admin/stats
 * ================================
 * Admin-only endpoint returning WhatsApp AI agent metrics for the
 * admin dashboard. Shows real data — no fake metrics. When data is
 * unavailable, returns null (the UI shows "Data unavailable").
 *
 * Requires `ai_tasks.view` permission.
 */
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { ok } from "@/lib/admin-api";
import {
  whatsappConfig,
  getAgentStatus,
  getAgentMetrics,
  AI_MODE_LABELS,
  STATUS_LABELS,
} from "@/lib/whatsapp";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "ai_tasks.view");
  if (guard.denied) return guard.response;

  const cfg = whatsappConfig();
  const status = getAgentStatus();
  const statusLabel = STATUS_LABELS[status];

  // Get metrics (last 24h by default)
  const hoursBack = Number(new URL(req.url).searchParams.get("hours") || "24");
  const metrics = await getAgentMetrics(hoursBack);

  // Get recent WhatsApp-related audit logs (for the activity feed)
  const recentLogs = await db.auditLog.findMany({
    where: {
      action: { startsWith: "whatsapp_" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      meta: true,
      createdAt: true,
    },
  });

  return ok(
    {
      status,
      statusLabel: statusLabel.label,
      statusColor: statusLabel.color,
      aiMode: cfg.aiMode,
      aiModeLabel: AI_MODE_LABELS[cfg.aiMode] ?? cfg.aiMode,
      apiConfigured: cfg.apiConfigured,
      apiPhoneNumberId: cfg.apiConfigured ? "configured" : null,
      webhookVerifyToken: cfg.webhookVerifyToken ? "configured" : null,
      displayNumber: cfg.display,
      callNumber: cfg.number,
      metrics: {
        // Real metrics — null when unavailable (never fake)
        messagesToday: metrics.messagesToday,
        leadsCreated: metrics.leadsCreated,
        humanHandoffs: metrics.humanHandoffs,
        aiConversations: metrics.aiConversations,
        failedMessages: metrics.failedMessages,
        averageResponseTimeMs: metrics.averageResponseTimeMs,
        apiErrors: metrics.apiErrors,
        totalEvents: metrics.totalEvents,
      },
      recentActivity: recentLogs.map((log) => {
        let meta: Record<string, unknown> = {};
        try {
          meta = log.meta ? JSON.parse(log.meta) : {};
        } catch {
          // keep empty
        }
        return {
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          fromSuffix: meta.fromSuffix ?? null,
          intent: meta.intent ?? null,
          status: meta.status ?? null,
          error: meta.error ?? null,
          createdAt: log.createdAt.toISOString(),
        };
      }),
    },
    "WhatsApp AI agent stats",
    { hoursBack }
  );
}
