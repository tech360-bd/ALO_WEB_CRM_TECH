/**
 * HunyuanVideo Provider
 * Repo: https://github.com/Tencent-Hunyuan/HunyuanVideo.git
 * Tencent, best quality cinematic, slow, VRAM heavy
 */

import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from "../types";
import type { AIVideoProvider } from "./providers";
import { buildEducationPrompt, buildNegativePrompt, checkProviderHealth } from "./providers";
import { getVideoEngineConfig } from "../config";

export const HunyuanProvider: AIVideoProvider = {
  id: "hunyuan",
  name: "HunyuanVideo (Tencent)",
  description: "Best quality cinematic T2V, slow 15min for 720p, VRAM 14GB+ v1.5. Tencent License.",
  repoUrl: "https://github.com/Tencent-Hunyuan/HunyuanVideo.git",
  vramRequiredGB: 24,
  quality: 5,
  speed: 1,
  supports: { t2v: true, i2v: true, longVideo: false, customResolution: true },

  buildPrompt(base, ctx) { return buildEducationPrompt(base, ctx); },

  async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
    const config = getVideoEngineConfig();
    const jobId = `hunyuan-${Date.now()}`;
    const prompt = buildEducationPrompt(req.prompt, {
      university: req.universityName,
      course: req.courseName,
      country: req.country,
    });

    if (config.aiProviders.hunyuan.apiUrl) {
      try {
        const res = await fetch(`${config.aiProviders.hunyuan.apiUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.aiProviders.hunyuan.apiKey}` },
          body: JSON.stringify({
            prompt,
            negative_prompt: buildNegativePrompt(),
            num_frames: req.durationSec * 24,
            width: req.resolution === "4K" ? 1280 : 720,
            height: req.resolution === "4K" ? 720 : 480,
            guidance_scale: req.guidanceScale || 6,
          }),
        });
        const json = await res.json();
        return { jobId: json.job_id || jobId, status: "rendering", promptUsed: prompt, providerId: "hunyuan", metadata: json };
      } catch (e: any) {
        return { jobId, status: "failed", promptUsed: prompt, providerId: "hunyuan", metadata: { error: e.message } };
      }
    }

    return {
      jobId,
      status: "queued",
      promptUsed: prompt,
      providerId: "hunyuan",
      metadata: {
        note: "Hunyuan not configured, set HUNYUAN_API_URL. Requires A100 40GB or 24GB VRAM with optimizations (TeaCache 4x speedup).",
        vramRequired: "24GB (14GB for v1.5 with offload)",
        estimatedTimeSec: 15 * 60,
        quality: "5/5 best cinematic",
      },
    };
  },

  async health(): Promise<ProviderHealth> {
    const config = getVideoEngineConfig();
    const h = await checkProviderHealth("hunyuan", "HunyuanVideo", config.aiProviders.hunyuan.apiUrl);
    return { ...h, vramRequiredGB: 24 };
  },
};
