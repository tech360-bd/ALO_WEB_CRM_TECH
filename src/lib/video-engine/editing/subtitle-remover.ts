/**
 * Video Subtitle Remover Adapter
 * Repo: https://github.com/YaoFANGUK/video-subtitle-remover.git
 * AI-based hardcoded subtitle removal via inpainting
 */

import type { EditingRequest, EditingResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export async function removeSubtitles(
  req: EditingRequest
): Promise<EditingResponse> {
  const config = getVideoEngineConfig();
  const jobId = `subtitle-remover-${Date.now()}`;

  if (!config.editing.subtitleRemover.enabled) {
    return {
      jobId,
      outputUrl: req.videoUrl, // No-op if disabled
      operation: "remove_subtitles",
      metadata: { note: "Subtitle remover disabled, set SUBTITLE_REMOVER_ENABLED=true", originalUrl: req.videoUrl },
    };
  }

  // If Python path exists, spawn remover
  if (config.editing.subtitleRemover.pythonPath) {
    try {
      // python -m video_subtitle_remover --video input.mp4 --output out.mp4 --area x,y,w,h
      const args = ["-m", "video_subtitle_remover", "--video", req.videoUrl, "--output", `/tmp/${jobId}.mp4`];
      if (req.subtitleArea) {
        args.push("--area", `${req.subtitleArea.x},${req.subtitleArea.y},${req.subtitleArea.w},${req.subtitleArea.h}`);
      }
      
      // In real implementation, spawn child_process
      return {
        jobId,
        outputUrl: `/tmp/${jobId}.mp4`,
        operation: "remove_subtitles",
        metadata: { via: "python", command: `${config.editing.subtitleRemover.pythonPath} ${args.join(" ")}`, area: req.subtitleArea },
      };
    } catch (e: any) {
      return {
        jobId,
        outputUrl: "",
        operation: "remove_subtitles",
        metadata: { error: e.message },
      };
    }
  }

  // Mock
  return {
    jobId,
    outputUrl: `https://mock.alo-education.com/videos/${jobId}_no_subs.mp4`,
    operation: "remove_subtitles",
    metadata: { note: "Mock - configure SUBTITLE_REMOVER", originalUrl: req.videoUrl },
  };
}

export async function getSubtitleRemoverHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("subtitle-remover", "video-subtitle-remover", undefined);
  return {
    ...h,
    status: config.editing.subtitleRemover.enabled ? "online" : "not_configured",
    vramRequiredGB: 4,
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: true, streaming: false },
  };
}

// ─── Batch removal ──────────────────────────────────────────────────

export async function batchRemoveSubtitles(
  videoUrls: string[],
  area?: { x: number; y: number; w: number; h: number }
): Promise<EditingResponse[]> {
  const results: EditingResponse[] = [];
  for (const url of videoUrls) {
    const res = await removeSubtitles({ operation: "remove_subtitles", videoUrl: url, subtitleArea: area });
    results.push(res);
  }
  return results;
}
