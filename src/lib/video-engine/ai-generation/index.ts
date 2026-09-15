/**
 * AI Generation Index - Unified provider interface
 */

import type { AIGenerationRequest, AIGenerationResponse, VideoProviderId } from "../types";
import { LTXProvider } from "./ltx";
import { CogVideoProvider } from "./cogvideo";
import { HunyuanProvider } from "./hunyuan";
import { LongCatProvider } from "./longcat";
import { PixelleProvider } from "./pixelle";
import { ComfyUIProvider } from "./comfyui";
import type { AIVideoProvider } from "./providers";

export const AI_PROVIDERS: Record<string, AIVideoProvider> = {
  ltx: LTXProvider,
  cogvideo: CogVideoProvider,
  hunyuan: HunyuanProvider,
  longcat: LongCatProvider,
  pixelle: PixelleProvider,
  comfyui: ComfyUIProvider,
};

export function getAIProvider(id: string): AIVideoProvider | undefined {
  return AI_PROVIDERS[id];
}

export function getAllAIProviders(): AIVideoProvider[] {
  return Object.values(AI_PROVIDERS);
}

export function getDefaultAIProvider(): AIVideoProvider {
  // LTX is default fastest
  return LTXProvider;
}

export async function generateAIVideo(
  req: AIGenerationRequest
): Promise<AIGenerationResponse> {
  const provider = getAIProvider(req.providerId);
  if (!provider) {
    throw new Error(`AI provider ${req.providerId} not found`);
  }
  return provider.generate(req);
}

export async function generateWithFallback(
  req: Omit<AIGenerationRequest, "providerId"> & { preferredProviders?: VideoProviderId[] }
): Promise<AIGenerationResponse> {
  const preferred = req.preferredProviders || ["ltx", "cogvideo", "hunyuan"];
  
  let lastError: any;
  for (const providerId of preferred) {
    try {
      const provider = getAIProvider(providerId);
      if (!provider) continue;
      const result = await provider.generate({ ...req, providerId: providerId as any });
      if (result.status !== "failed") return result;
      lastError = result.metadata?.error;
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  
  throw new Error(`All AI providers failed. Last error: ${lastError}`);
}

// Prompt engineering helpers for ALO Education niche
export const ALO_PROMPT_PRESETS = {
  campus_tour: "cinematic drone shot of university campus, modern buildings, green lawns, students walking, sunny day, 4K, professional",
  scholarship: "happy diverse students celebrating scholarship award, confetti, university background, cinematic, 4K",
  visa_guide: "professional office, documents, passport, visa stamp, timeline animation, clean, official",
  testimonial_broll: "university library, students studying, campus life, diverse, warm lighting, 4K",
  course_explainer: "modern classroom, teacher explaining, students engaged, technology, data science, engineering",
  uk_campus: "UK university campus, historic buildings mixed modern, students, autumn, cinematic",
  canada_campus: "Canada university campus, snow, modern, diverse students, winter, cinematic",
  australia_campus: "Australia university campus, sunny, beach nearby, modern architecture, diverse",
};

export function enhancePromptForALO(
  basePrompt: string,
  preset?: keyof typeof ALO_PROMPT_PRESETS,
  country?: string
): string {
  let enhanced = basePrompt;
  if (preset && ALO_PROMPT_PRESETS[preset]) {
    enhanced = `${basePrompt}, ${ALO_PROMPT_PRESETS[preset]}`;
  }
  if (country) {
    const countryPreset = `${country.toLowerCase()}_campus` as keyof typeof ALO_PROMPT_PRESETS;
    if (ALO_PROMPT_PRESETS[countryPreset]) {
      enhanced += `, ${ALO_PROMPT_PRESETS[countryPreset]}`;
    }
  }
  enhanced += ", high quality, 4K, cinematic, professional lighting, stable camera";
  return enhanced;
}
