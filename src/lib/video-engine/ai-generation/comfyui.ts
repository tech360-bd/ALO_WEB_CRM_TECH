/**
 * ComfyUI VideoHelperSuite Bridge
 * Repo: https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
 * ComfyUI custom nodes for video load/save/combine
 * Also integrates: LTX, CogVideo, Hunyuan via ComfyUI workflows
 */

import type { AIGenerationRequest, AIGenerationResponse, ProviderHealth } from "../types";
import type { AIVideoProvider } from "./providers";
import { checkProviderHealth } from "./providers";
import { getVideoEngineConfig } from "../config";

export const ComfyUIProvider: AIVideoProvider = {
  id: "comfyui",
  name: "ComfyUI-VideoHelperSuite",
  description: "ComfyUI bridge: run LTX/CogVideo/Hunyuan workflows via ComfyUI API, plus video helper nodes. GPL.",
  repoUrl: "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git",
  vramRequiredGB: 12,
  quality: 4,
  speed: 3,
  supports: { t2v: true, i2v: true, longVideo: true, customResolution: true },
  buildPrompt(b) { return b; },
  async generate(req: AIGenerationRequest): Promise<AIGenerationResponse> {
    const config = getVideoEngineConfig();
    const jobId = `comfyui-${Date.now()}`;
    if (!config.aiProviders.comfyui.enabled) {
      return { jobId, status: "failed", promptUsed: req.prompt, providerId: "comfyui", metadata: { error: "ComfyUI not enabled, set COMFYUI_ENABLED=true and COMFYUI_URL" } };
    }
    // Delegate to LTX/CogVideo/Hunyuan based on request
    // For generic, use LTX workflow as default
    try {
      const res = await fetch(`${config.aiProviders.comfyui.url}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: {
            "1": { class_type: "CLIPTextEncode", inputs: { text: req.prompt } },
            "2": { class_type: "SaveVideo", inputs: { filename_prefix: jobId } },
          },
        }),
      });
      const json = await res.json();
      return { jobId: json.prompt_id || jobId, status: "rendering", promptUsed: req.prompt, providerId: "comfyui", metadata: { comfyPromptId: json.prompt_id } };
    } catch (e: any) {
      return { jobId, status: "failed", promptUsed: req.prompt, providerId: "comfyui", metadata: { error: e.message } };
    }
  },
  async health(): Promise<ProviderHealth> {
    const config = getVideoEngineConfig();
    return checkProviderHealth("comfyui", "ComfyUI", config.aiProviders.comfyui.url);
  },
};

// ─── VideoHelperSuite specific helpers ──────────────────────────────

export interface ComfyUIWorkflow {
  nodes: Record<string, { class_type: string; inputs: Record<string, any> }>;
}

export async function queueComfyUIWorkflow(
  workflow: ComfyUIWorkflow,
  clientId?: string
): Promise<{ promptId: string; status: string }> {
  const config = getVideoEngineConfig();
  const url = `${config.aiProviders.comfyui.url}/prompt`;
  const body = { prompt: workflow.nodes, client_id: clientId || `alo-${Date.now()}` };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ComfyUI queue failed ${res.status}`);
  const json = await res.json();
  return { promptId: json.prompt_id, status: "queued" };
}

export async function getComfyUIHistory(promptId: string): Promise<any> {
  const config = getVideoEngineConfig();
  const res = await fetch(`${config.aiProviders.comfyui.url}/history/${promptId}`);
  if (!res.ok) throw new Error(`ComfyUI history ${res.status}`);
  return res.json();
}

export async function getComfyUIQueue(): Promise<any> {
  const config = getVideoEngineConfig();
  const res = await fetch(`${config.aiProviders.comfyui.url}/queue`);
  if (!res.ok) throw new Error(`ComfyUI queue ${res.status}`);
  return res.json();
}

// Pre-built workflows for ALO
export const COMFYUI_WORKFLOWS = {
  ltx_text_to_video: (prompt: string, negative: string, width = 768, height = 512, frames = 121) => ({
    nodes: {
      "1": { class_type: "LTXVideoModelLoader", inputs: { model: "ltx-video-2b-v0.9.5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "LTXVideoSampler", inputs: { model: ["1", 0], positive: ["2", 0], negative: ["3", 0], steps: 30, cfg: 3, width, height, length: frames } },
      "5": { class_type: "VHS_VideoCombine", inputs: { images: ["4", 0], frame_rate: 24, format: "video/h264-mp4", save_output: true, filename_prefix: `ALO_LTX_${Date.now()}` } },
    },
  }),
  cogvideo_text_to_video: (prompt: string, width = 720, height = 480, frames = 49) => ({
    nodes: {
      "1": { class_type: "CogVideoModelLoader", inputs: { model: "cogvideox-5b" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1", 1] } },
      "3": { class_type: "CogVideoSampler", inputs: { model: ["1", 0], positive: ["2", 0], width, height, length: frames } },
      "4": { class_type: "VHS_VideoCombine", inputs: { images: ["3", 0], frame_rate: 8, format: "video/h264-mp4", save_output: true } },
    },
  }),
};
