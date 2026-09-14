/**
 * LongCat-Video Provider
 * Repo: https://github.com/meituan-longcat/LongCat-Video.git
 * Meituan long video generation
 */
import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from "../types";
import type { AIVideoProvider } from "./providers";
import { buildEducationPrompt, checkProviderHealth } from "./providers";
import { getVideoEngineConfig } from "../config";

export const LongCatProvider: AIVideoProvider = {
  id: "longcat",
  name: "LongCat-Video (Meituan)",
  description: "Long video generation, minutes-long, narrative. Apache 2.0.",
  repoUrl: "https://github.com/meituan-longcat/LongCat-Video.git",
  vramRequiredGB: 20,
  quality: 4,
  speed: 2,
  supports: { t2v: true, i2v: true, longVideo: true, customResolution: false },
  buildPrompt(b, c) { return buildEducationPrompt(b, c); },
  async generate(req): Promise<AIGenerationResponse> {
    const jobId = `longcat-${Date.now()}`;
    const prompt = buildEducationPrompt(req.prompt, { university: req.universityName, course: req.courseName, country: req.country });
    const config = getVideoEngineConfig();
    if (config.aiProviders.longcat.apiUrl) {
      try {
        const res = await fetch(`${config.aiProviders.longcat.apiUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, duration: req.durationSec }),
        });
        const json = await res.json();
        return { jobId: json.id || jobId, status: "rendering", promptUsed: prompt, providerId: "longcat", metadata: json };
      } catch (e: any) {
        return { jobId, status: "failed", promptUsed: prompt, providerId: "longcat", metadata: { error: e.message } };
      }
    }
    return { jobId, status: "queued", promptUsed: prompt, providerId: "longcat", metadata: { note: "Set LONGCAT_API_URL", vram: "20GB", estimated: "10min for 60s" } };
  },
  async health(): Promise<ProviderHealth> {
    const config = getVideoEngineConfig();
    const h = await checkProviderHealth("longcat", "LongCat-Video", config.aiProviders.longcat.apiUrl);
    return { ...h, vramRequiredGB: 20 };
  },
};
