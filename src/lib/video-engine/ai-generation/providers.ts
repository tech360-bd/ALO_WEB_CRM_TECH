/**
 * AI Video Generation Providers Registry
 * Unified interface for CogVideo, Hunyuan, LTX, LongCat, Pixelle, ComfyUI
 */

import type { AIGenerationRequest, AIGenerationResponse, VideoProviderId, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";

export interface AIVideoProvider {
  id: VideoProviderId;
  name: string;
  description: string;
  repoUrl: string;
  vramRequiredGB: number;
  quality: 1 | 2 | 3 | 4 | 5; // 5 best
  speed: 1 | 2 | 3 | 4 | 5; // 5 fastest
  supports: {
    t2v: boolean;
    i2v: boolean;
    longVideo: boolean;
    customResolution: boolean;
  };
  generate: (req: AIGenerationRequest) => Promise<AIGenerationResponse>;
  health: () => Promise<ProviderHealth>;
  buildPrompt: (basePrompt: string, context: { university?: string; course?: string; country?: string; language?: string }) => string;
}

// ─── Prompt Builder (Education-specific) ────────────────────────────

export function buildEducationPrompt(
  basePrompt: string,
  context: { university?: string; course?: string; country?: string; language?: string; category?: string }
): string {
  const parts = [basePrompt];
  
  if (context.university) parts.push(`University: ${context.university}`);
  if (context.course) parts.push(`Course: ${context.course}`);
  if (context.country) parts.push(`Country: ${context.country}, campus, students`);
  if (context.language === "bangla" || context.language === "bn") parts.push("Bangladeshi students, diverse");
  if (context.category === "scholarship") parts.push("celebratory, scholarship award, happy students");
  if (context.category === "visa_guide") parts.push("professional, official, timeline, documents");
  if (context.category === "campus_tour") parts.push("cinematic campus tour, drone shot, modern buildings, green campus");
  
  // Add quality boosters (from CogVideo/Hunyuan prompting guides)
  parts.push("high quality, 4K, cinematic, professional lighting, stable camera, no distortion, no blur");
  
  return parts.join(", ");
}

export function buildNegativePrompt(): string {
  return "low quality, blurry, distorted, watermark, text, logo, deformed, extra limbs, bad anatomy, duplicate, morbid, mutilated, out of frame, poorly drawn, bad proportions, gross proportions, text overlay, subtitle";
}

// ─── Provider Health Check Helper ───────────────────────────────────

export async function checkProviderHealth(
  id: VideoProviderId,
  name: string,
  apiUrl?: string
): Promise<ProviderHealth> {
  const start = Date.now();
  let status: ProviderHealth["status"] = "not_configured";
  let error: string | undefined;
  
  if (!apiUrl) {
    status = "not_configured";
  } else {
    try {
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      status = res.ok ? "online" : "degraded";
    } catch (e: any) {
      status = "offline";
      error = e.message;
    }
  }
  
  return {
    id,
    name,
    category: "ai_generation",
    status,
    latencyMs: Date.now() - start,
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: true, i2v: true, talkingHead: false, captioning: false, editing: false, streaming: false },
    error,
  };
}
