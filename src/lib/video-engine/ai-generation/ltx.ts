/**
 * LTX-Video Provider
 * Repo: https://github.com/Lightricks/LTX-Video.git
 * Fastest, 12GB VRAM, 768x512 in 45s, ComfyUI support
 * Default provider for MVP
 */

import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from "../types";
import type { AIVideoProvider } from "./providers";
import { buildEducationPrompt, buildNegativePrompt, checkProviderHealth } from "./providers";
import { getVideoEngineConfig } from "../config";

export const LTXProvider: AIVideoProvider = {
  id: "ltx",
  name: "LTX-Video (Lightricks)",
  description: "Fastest T2V, low VRAM 12GB, 45s for 5s clip, best for iteration. Apache 2.0.",
  repoUrl: "https://github.com/Lightricks/LTX-Video.git",
  vramRequiredGB: 12,
  quality: 3,
  speed: 5,
  supports: { t2v: true, i2v: true, longVideo: true, customResolution: true },

  buildPrompt(basePrompt, context) {
    return buildEducationPrompt(basePrompt, context);
  },

  async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
    const config = getVideoEngineConfig();
    const jobId = `ltx-${Date.now()}`;
    const prompt = buildEducationPrompt(req.prompt, {
      university: req.universityName,
      course: req.courseName,
      country: req.country,
      language: req.language,
    });

    // If ComfyUI available, use ComfyUI workflow
    if (config.aiProviders.comfyui.enabled) {
      return generateViaComfyUI(req, prompt, jobId);
    }

    // If local LTX path exists, spawn Python
    if (config.aiProviders.ltx.localPath) {
      return generateViaLocal(req, prompt, jobId);
    }

    // If API URL exists, call API
    if (config.aiProviders.ltx.apiUrl) {
      return generateViaAPI(req, prompt, jobId);
    }

    // Fallback: mock for dev, queue job
    return {
      jobId,
      status: "queued",
      promptUsed: prompt,
      providerId: "ltx",
      metadata: {
        provider: "ltx",
        note: "LTX not configured, set LTX_LOCAL_PATH or COMFYUI_URL or LTX_API_URL. Mock queued.",
        vramRequired: "12GB",
        estimatedTimeSec: 45,
        resolution: req.resolution,
        aspectRatio: req.aspectRatio,
        steps: req.steps || 30,
        guidanceScale: req.guidanceScale || 3,
      },
    };
  },

  async health(): Promise<ProviderHealth> {
    const config = getVideoEngineConfig();
    const health = await checkProviderHealth("ltx", "LTX-Video", config.aiProviders.ltx.apiUrl || config.aiProviders.comfyui.url);
    return { ...health, vramRequiredGB: 12 };
  },
};

async function generateViaComfyUI(
  req: AIGenerationRequest,
  prompt: string,
  jobId: string
): Promise<AIGenerationResponse> {
  const config = getVideoEngineConfig();
  const comfyUrl = config.aiProviders.comfyui.url;

  // ComfyUI workflow JSON for LTX-Video
  const workflow = {
    "1": { class_type: "LTXVideoModelLoader", inputs: { model: "ltx-video-2b-v0.9.5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: buildNegativePrompt(), clip: ["1", 1] } },
    "4": { class_type: "LTXVideoSampler", inputs: { model: ["1", 0], positive: ["2", 0], negative: ["3", 0], steps: req.steps || 30, cfg: req.guidanceScale || 3, width: 768, height: 512, length: (req.durationSec || 5) * 24 } },
    "5": { class_type: "SaveVideo", inputs: { video: ["4", 0], filename_prefix: jobId } },
  };

  try {
    const res = await fetch(`${comfyUrl}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    });
    if (!res.ok) throw new Error(`ComfyUI ${res.status}`);
    const json = await res.json();
    return {
      jobId: json.prompt_id || jobId,
      status: "rendering",
      promptUsed: prompt,
      providerId: "ltx",
      metadata: { comfyPromptId: json.prompt_id, workflow, via: "comfyui" },
    };
  } catch (e: any) {
    return {
      jobId,
      status: "failed",
      promptUsed: prompt,
      providerId: "ltx",
      metadata: { error: e.message, via: "comfyui" },
    };
  }
}

async function generateViaLocal(
  req: AIGenerationRequest,
  prompt: string,
  jobId: string
): Promise<AIGenerationResponse> {
  // Spawn python inference
  // python -m ltx_video.inference --prompt "..." --output out.mp4
  return {
    jobId,
    status: "rendering",
    promptUsed: prompt,
    providerId: "ltx",
    metadata: {
      via: "local",
      command: `python -m ltx_video.inference --prompt "${prompt}" --output /tmp/${jobId}.mp4 --height 512 --width 768 --num_frames ${req.durationSec * 24}`,
    },
  };
}

async function generateViaAPI(
  req: AIGenerationRequest,
  prompt: string,
  jobId: string
): Promise<AIGenerationResponse> {
  const config = getVideoEngineConfig();
  try {
    const res = await fetch(`${config.aiProviders.ltx.apiUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.aiProviders.ltx.apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: buildNegativePrompt(),
        duration: req.durationSec,
        aspect_ratio: req.aspectRatio,
        resolution: req.resolution,
        seed: req.seed,
      }),
    });
    if (!res.ok) throw new Error(`LTX API ${res.status}`);
    const json = await res.json();
    return {
      jobId: json.job_id || jobId,
      status: "rendering",
      promptUsed: prompt,
      providerId: "ltx",
      metadata: { apiResponse: json },
    };
  } catch (e: any) {
    return {
      jobId,
      status: "failed",
      promptUsed: prompt,
      providerId: "ltx",
      metadata: { error: e.message },
    };
  }
}
