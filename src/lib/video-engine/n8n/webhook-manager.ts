/**
 * n8n Webhook Manager for Video
 * Enhanced manager for video-specific webhooks
 */

import { triggerWorkflow } from "@/lib/n8n";

export interface VideoWebhookConfig {
  enabled: boolean;
  webhookUrl?: string;
  events: string[];
  retry: boolean;
  timeoutMs: number;
}

export function getVideoWebhookConfig(): VideoWebhookConfig {
  return {
    enabled: !!process.env.N8N_WEBHOOK_URL,
    webhookUrl: process.env.N8N_WEBHOOK_URL,
    events: (process.env.N8N_VIDEO_EVENTS || "video.project.created,video.render.completed,video.project.approved,video.recording.completed").split(","),
    retry: true,
    timeoutMs: 10000,
  };
}

export async function sendVideoWebhook(
  event: string,
  data: Record<string, unknown>,
  idempotencyKey?: string
) {
  const config = getVideoWebhookConfig();
  if (!config.enabled) {
    return { success: false, error: "N8N_WEBHOOK_URL not configured" };
  }
  if (!config.events.includes(event) && !config.events.includes("*")) {
    return { success: false, error: `Event ${event} not enabled` };
  }
  return triggerWorkflow(event, data, idempotencyKey);
}

export async function testN8nConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const config = getVideoWebhookConfig();
  if (!config.enabled || !config.webhookUrl) {
    return { success: false, latencyMs: 0, error: "N8N_WEBHOOK_URL not set" };
  }
  const start = Date.now();
  try {
    const res = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "test.connection", timestamp: new Date().toISOString(), source: "alo-video-engine" }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    return { success: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, latencyMs: Date.now() - start, error: e.message };
  }
}
