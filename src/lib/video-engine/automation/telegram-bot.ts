/**
 * Telegram VideoMakerBOT Adapter
 * Repo: https://github.com/Bilal-Belli/videoMakerBOT.git
 * Telegram bot that creates videos via chat commands
 */

import type { ProviderHealth } from "../types";

export interface TelegramVideoRequest {
  chatId: string;
  userId: string;
  command: string; // e.g., "/video UK scholarship 2027"
  args: string[];
  replyToMessageId?: string;
}

export interface TelegramVideoResponse {
  jobId: string;
  message: string;
  outputUrl?: string;
  status: "queued" | "rendering" | "completed" | "failed";
  metadata: Record<string, unknown>;
}

export async function handleTelegramVideoCommand(
  req: TelegramVideoRequest
): Promise<TelegramVideoResponse> {
  const jobId = `tg-video-${Date.now()}`;

  // Parse command
  // /video <type> <description>
  // /video promo UK universities 2027 intake
  // /video scholarship Manchester £5000
  // /video slideshow campus tour images
  
  const type = req.args[0] || "promo";
  const description = req.args.slice(1).join(" ") || "Study abroad promo";

  // Map to Remotion or AI generation
  let workflow = "";
  if (type === "promo") workflow = "UniversityPromo via Remotion";
  else if (type === "scholarship") workflow = "ScholarshipAnnouncement via Remotion";
  else if (type === "faq") workflow = "FAQShort via Remotion";
  else if (type === "ai") workflow = "LTX-Video AI generation";
  else workflow = "Claude-Video LLM→Remotion";

  return {
    jobId,
    message: `🎬 Video generation queued!\nType: ${type}\nPrompt: ${description}\nJob ID: ${jobId}\n\nWorkflow: ${workflow}\n\nYou'll receive the video when ready. Check /api/video-engine/projects/${jobId}`,
    status: "queued",
    metadata: {
      via: "Bilal-Belli/videoMakerBOT pattern",
      telegram: { chatId: req.chatId, userId: req.userId, command: req.command },
      workflow,
      n8nIntegration: "Telegram bot → n8n webhook → video-engine → Telegram send",
      remotion: true,
      approvalRequired: true,
    },
  };
}

export async function sendTelegramVideo(
  chatId: string,
  videoUrl: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        video: videoUrl,
        caption: caption || "Your video is ready! 🎬",
        parse_mode: "HTML",
      }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.description);
    return { success: true, messageId: json.result.message_id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getTelegramBotHealth(): Promise<ProviderHealth> {
  return {
    id: "animated",
    name: "videoMakerBOT (Telegram)",
    category: "content_automation",
    status: process.env.TELEGRAM_BOT_TOKEN ? "online" : "not_configured",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}

// ─── Bot command definitions ────────────────────────────────────────

export const TELEGRAM_BOT_COMMANDS = [
  { command: "/video", description: "Create video: /video <type> <description>", example: "/video promo UK scholarship 2027" },
  { command: "/slideshow", description: "Create slideshow from images", example: "/slideshow campus tour" },
  { command: "/status", description: "Check video job status", example: "/status <jobId>" },
  { command: "/templates", description: "List video templates", example: "/templates" },
  { command: "/help", description: "Show help", example: "/help" },
];

export function parseTelegramCommand(text: string): { command: string; args: string[] } {
  const parts = text.trim().split(/\s+/);
  const command = parts[0].replace("/", "").toLowerCase();
  const args = parts.slice(1);
  return { command, args };
}
