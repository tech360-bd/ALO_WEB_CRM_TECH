/**
 * Pixelle-Video Provider
 * Repo: https://github.com/ATH-MaaS/Pixelle-Video.git
 * DiT-based research model
 */
import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from "../types";
import type { AIVideoProvider } from "./providers";
import { buildEducationPrompt, checkProviderHealth } from "./providers";
import { getVideoEngineConfig } from "../config";

export const PixelleProvider: AIVideoProvider = {
  id: "pixelle",
  name: "Pixelle-Video",
  description: "DiT-based video generation research, Pixelle family. Apache 2.0.",
  repoUrl: "https://github.com/ATH-MaaS/Pixelle-Video.git",
  vramRequiredGB: 16,
  quality: 3,
  speed: 3,
  supports: { t2v: true, i2v: false, longVideo: false, customResolution: false },
  buildPrompt(b, c) { return buildEducationPrompt(b, c); },
  async generate(req): Promise<AIGenerationResponse> {
    const jobId = `pixelle-${Date.now()}`;
    const prompt = buildEducationPrompt(req.prompt, { university: req.universityName, course: req.courseName, country: req.country });
    const config = getVideoEngineConfig();
    if (config.aiProviders.pixelle.apiUrl) {
      try {
        const res = await fetch(`${config.aiProviders.pixelle.apiUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, duration: req.durationSec }),
        });
        const json = await res.json();
        return { jobId: json.id || jobId, status: "rendering", promptUsed: prompt, providerId: "pixelle", metadata: json };
      } catch (e: any) {
        return { jobId, status: "failed", promptUsed: prompt, providerId: "pixelle", metadata: { error: e.message } };
      }
    }
    return { jobId, status: "queued", promptUsed: prompt, providerId: "pixelle", metadata: { note: "Set PIXELLE_API_URL, research model" } };
  },
  async health(): Promise<ProviderHealth> {
    const config = getVideoEngineConfig();
    const h = await checkProviderHealth("pixelle", "Pixelle-Video", config.aiProviders.pixelle.apiUrl);
    return { ...h, vramRequiredGB: 16 };
  },
};
