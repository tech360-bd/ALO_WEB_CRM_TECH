/**
 * Video Super Resolution Adapter
 * Repo: https://github.com/LoSealL/VideoSuperResolution.git
 * VSR models: RealBasicVSR, etc
 */

import type { EditingRequest, EditingResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export const VSR_MODELS = {
  RealBasicVSR: { vram: 8, quality: 4, speed: 2, description: "RealBasicVSR - good balance" },
  RealESRGAN: { vram: 6, quality: 3, speed: 4, description: "RealESRGAN - fast, per-frame" },
  BasicVSR: { vram: 12, quality: 5, speed: 1, description: "BasicVSR - best quality, slow" },
  SwinIR: { vram: 8, quality: 4, speed: 3, description: "SwinIR - transformer based" },
};

export async function superResolveVideo(
  req: EditingRequest
): Promise<EditingResponse> {
  const config = getVideoEngineConfig();
  const jobId = `vsr-${Date.now()}`;
  const model = (req.model as keyof typeof VSR_MODELS) || (config.editing.superResolution.model as keyof typeof VSR_MODELS) || "RealBasicVSR";

  if (!config.editing.superResolution.enabled) {
    return {
      jobId,
      outputUrl: req.videoUrl,
      operation: "super_resolution",
      metadata: { note: "VSR disabled, set SUPER_RESOLUTION_ENABLED=true", originalUrl: req.videoUrl },
    };
  }

  // Local Python
  if (config.editing.superResolution.pythonPath) {
    return {
      jobId,
      outputUrl: `/tmp/${jobId}_4k.mp4`,
      operation: "super_resolution",
      metadata: {
        via: "python",
        model,
        targetResolution: req.targetResolution || "4K",
        command: `${config.editing.superResolution.pythonPath} -m vsr --input ${req.videoUrl} --output /tmp/${jobId}_4k.mp4 --model ${model}`,
      },
    };
  }

  // Mock
  return {
    jobId,
    outputUrl: `https://mock.alo-education.com/videos/${jobId}_upscaled_${req.targetResolution || "4K"}.mp4`,
    operation: "super_resolution",
    metadata: { note: "Mock - configure VSR", model, targetResolution: req.targetResolution },
  };
}

export async function getSuperResolutionHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("super-resolution", "VideoSuperResolution", undefined);
  return {
    ...h,
    status: config.editing.superResolution.enabled ? "online" : "not_configured",
    vramRequiredGB: 8,
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: true, streaming: false },
  };
}
