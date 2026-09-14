/**
 * CogVideoX Provider
 * Repo: https://github.com/zai-org/CogVideo.git
 * Tsinghua THUDM + Zhipu AI, 5B/2B, I2V/T2V, long narrative
 */

import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from "../types";
import type { AIVideoProvider } from "./providers";
import { buildEducationPrompt, buildNegativePrompt, checkProviderHealth } from "./providers";
import { getVideoEngineConfig } from "../config";

export const CogVideoProvider: AIVideoProvider = {
  id: "cogvideo",
  name: "CogVideoX (Zhipu AI)",
  description: "Tsinghua CogVideoX 5B/2B, I2V/T2V, long narrative, precise text. Apache 2.0. 18GB VRAM.",
  repoUrl: "https://github.com/zai-org/CogVideo.git",
  vramRequiredGB: 18,
  quality: 4,
  speed: 3,
  supports: { t2v: true, i2v: true, longVideo: true, customResolution: true },

  buildPrompt(base, ctx) { return buildEducationPrompt(base, ctx); },

  async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
    const config = getVideoEngineConfig();
    const jobId = `cogvideo-${Date.now()}`;
    const prompt = buildEducationPrompt(req.prompt, {
      university: req.universityName,
      course: req.courseName,
      country: req.country,
      language: req.language,
    });

    if (config.aiProviders.comfyui.enabled) {
      // ComfyUI CogVideo workflow
      return {
        jobId,
        status: "queued",
        promptUsed: prompt,
        providerId: "cogvideo",
        metadata: { via: "comfyui", model: "cogvideox-5b", note: "Use ComfyUI CogVideo nodes" },
      };
    }

    if (config.aiProviders.cogvideo.apiUrl) {
      try {
        const res = await fetch(`${config.aiProviders.cogvideo.apiUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.aiProviders.cogvideo.apiKey}` },
          body: JSON.stringify({
            prompt,
            negative_prompt: buildNegativePrompt(),
            image_url: req.referenceImageUrl,
            num_frames: (req.durationSec || 5) * 8,
            guidance_scale: req.guidanceScale || 6,
            num_inference_steps: req.steps || 50,
          }),
        });
        const json = await res.json();
        return { jobId: json.id || jobId, status: "rendering", promptUsed: prompt, providerId: "cogvideo", metadata: json };
      } catch (e: any) {
        return { jobId, status: "failed", promptUsed: prompt, providerId: "cogvideo", metadata: { error: e.message } };
      }
    }

    // Replicate API fallback
    if (config.aiProviders.cogvideo.replicateModel) {
      return {
        jobId,
        status: "queued",
        promptUsed: prompt,
        providerId: "cogvideo",
        metadata: {
          via: "replicate",
          model: config.aiProviders.cogvideo.replicateModel,
          prompt,
          note: "Set REPLICATE_API_TOKEN and call Replicate API",
        },
      };
    }

    return {
      jobId,
      status: "queued",
      promptUsed: prompt,
      providerId: "cogvideo",
      metadata: {
        note: "CogVideo not configured, set COGVIDEO_API_URL or COMFYUI_URL or REPLICATE. Mock queued.",
        vramRequired: "18GB for 5B, 8GB for 2B",
        estimatedTimeSec: 8 * 60,
      },
    };
  },

  async health(): Promise<ProviderHealth> {
    const config = getVideoEngineConfig();
    const h = await checkProviderHealth("cogvideo", "CogVideoX", config.aiProviders.cogvideo.apiUrl);
    return { ...h, vramRequiredGB: 18 };
  },
};
