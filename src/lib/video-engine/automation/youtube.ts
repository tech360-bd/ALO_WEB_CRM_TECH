/**
 * YouTube-DL / yt-dlp Adapter
 * Repo: https://github.com/ytdl-org/youtube-dl.git (and yt-dlp successor)
 * Download videos from 1000+ sites
 */

import type { ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export interface YoutubeDownloadRequest {
  url: string;
  quality?: "best" | "1080p" | "720p" | "480p" | "audio_only";
  extractSubtitles?: boolean;
  subtitleLangs?: string[];
  trim?: { startSec: number; endSec: number };
  hasRights: boolean; // Must be true - compliance
  purpose: string;
  outputPath?: string;
}

export interface YoutubeDownloadResponse {
  jobId: string;
  originalUrl: string;
  outputUrl: string;
  title: string;
  durationSec: number;
  thumbnailUrl?: string;
  subtitles?: { lang: string; url: string }[];
  metadata: Record<string, unknown>;
}

export async function downloadYoutubeVideo(
  req: YoutubeDownloadRequest
): Promise<YoutubeDownloadResponse> {
  const config = getVideoEngineConfig();
  const jobId = `yt-${Date.now()}`;

  if (!req.hasRights) {
    throw new Error("hasRights must be true - you must own or have explicit rights to download this content. Respect ToS.");
  }

  if (!config.automation.youtubeDl.enabled) {
    throw new Error("YouTube DL disabled, set YOUTUBE_DL_ENABLED=true");
  }

  // Use youtube-dl-exec if available (npm package that bundles yt-dlp)
  try {
    // Dynamic import to avoid hard dependency
    // const youtubedl = await import("youtube-dl-exec");
    // const result = await youtubedl.exec(req.url, { format: qualityMap[req.quality], ... })
    
    // Mock for now
    return {
      jobId,
      originalUrl: req.url,
      outputUrl: `/tmp/${jobId}.mp4`,
      title: "Mock Downloaded Video",
      durationSec: 300,
      thumbnailUrl: `https://img.youtube.com/vi/mock/hqdefault.jpg`,
      subtitles: req.extractSubtitles ? [{ lang: "en", url: `/tmp/${jobId}.en.srt` }] : undefined,
      metadata: {
        via: config.automation.youtubeDl.useYtDlp ? "yt-dlp" : "youtube-dl",
        quality: req.quality,
        purpose: req.purpose,
        hasRights: req.hasRights,
        complianceNote: "Only download content you own or have rights to",
        command: `${config.automation.youtubeDl.binaryPath} ${req.url} -f ${req.quality} -o /tmp/${jobId}.mp4`,
      },
    };
  } catch (e: any) {
    throw new Error(`YouTube download failed: ${e.message}`);
  }
}

export async function getYoutubeDlHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  return {
    id: "youtube-dl",
    name: "youtube-dl / yt-dlp",
    category: "content_automation",
    status: config.automation.youtubeDl.enabled ? "online" : "not_configured",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}

// ─── Compliance helpers ─────────────────────────────────────────────

export const YOUTUBE_DL_COMPLIANCE = {
  rules: [
    "Only download videos you own or have explicit written permission",
    "Respect YouTube ToS, don't circumvent DRM",
    "For competitor research, use only metadata/thumbnails, not full video unless public domain",
    "Always credit original creator if reusing",
    "For ALO: Use to download own channel content for re-editing, or university official promo videos with permission",
  ],
  allowedPurposes: [
    "own_content_reedit",
    "university_official_with_permission",
    "competitor_metadata_analysis",
    "educational_fair_use_short_clip",
  ],
  disallowed: [
    "Download entire competitor video to re-upload as own",
    "Circumvent age restriction or paywall",
    "Mass scraping",
  ],
};

export function validateYoutubeDownloadRequest(req: YoutubeDownloadRequest): { valid: boolean; error?: string } {
  if (!req.url || !req.url.includes("http")) return { valid: false, error: "Invalid URL" };
  if (!req.hasRights) return { valid: false, error: "hasRights must be true" };
  if (!req.purpose) return { valid: false, error: "Purpose required for compliance" };
  if (!YOUTUBE_DL_COMPLIANCE.allowedPurposes.includes(req.purpose) && req.purpose !== "competitor analysis") {
    // Allow custom but log warning
    console.warn(`[YouTube DL] Unusual purpose: ${req.purpose}, ensure compliance`);
  }
  return { valid: true };
}
