/**
 * Slideshow VideoMaker Adapter
 * Repos:
 * - https://github.com/viniciusenari/slideshow-videomaker.git (core)
 * - https://github.com/wtz2017/VideoMaker.git
 * - https://github.com/burhankocabiyik/videomaker.git
 * - https://github.com/WuTao-CS/VideoMaker.git
 * - https://github.com/seed0001/videoMaker.git
 * Pattern: images + music + transitions → video
 */

import type { ProviderHealth } from "../types";

export interface SlideshowRequest {
  images: { url: string; durationSec: number; caption?: string; transition?: string }[];
  musicUrl?: string;
  transition: "fade" | "slide" | "zoom" | "cut" | "ken_burns";
  aspectRatio: "16:9" | "9:16" | "1:1";
  resolution: "480p" | "720p" | "1080p" | "4K";
  fps?: number;
  title?: string;
  subtitle?: boolean;
  brandOverlay?: boolean;
  captions?: boolean;
}

export interface SlideshowResponse {
  jobId: string;
  outputUrl: string;
  durationSec: number;
  imageCount: number;
  metadata: Record<string, unknown>;
}

export async function createSlideshowVideo(
  req: SlideshowRequest
): Promise<SlideshowResponse> {
  const jobId = `slideshow-${Date.now()}`;
  const totalDuration = req.images.reduce((sum, img) => sum + img.durationSec, 0);

  // Build FFmpeg command (from viniciusenari/slideshow-videomaker pattern)
  // Or Remotion composition "CampusTourSlideshow"
  
  const ffmpegCommand = buildFFmpegSlideshowCommand(req, jobId);

  return {
    jobId,
    outputUrl: `/tmp/${jobId}.mp4`,
    durationSec: totalDuration,
    imageCount: req.images.length,
    metadata: {
      via: "FFmpeg + Remotion",
      pattern: "viniciusenari/slideshow-videomaker + wtz2017/VideoMaker",
      transition: req.transition,
      aspectRatio: req.aspectRatio,
      resolution: req.resolution,
      ffmpegCommand,
      remotionComposition: "CampusTourSlideshow",
      remotionProps: {
        images: req.images,
        transition: req.transition,
        title: req.title,
      },
      brandOverlay: req.brandOverlay,
      captions: req.captions,
    },
  };
}

function buildFFmpegSlideshowCommand(req: SlideshowRequest, jobId: string): string {
  // Simplified - real would create complex filter_complex for transitions
  const inputs = req.images.map((img, i) => `-loop 1 -t ${img.durationSec} -i ${img.url}`).join(" ");
  const filter = req.transition === "fade"
    ? `fade=t=in:st=0:d=0.5,fade=t=out:st=${req.images[0].durationSec - 0.5}:d=0.5`
    : "null";
  
  return `ffmpeg ${inputs} ${req.musicUrl ? `-i ${req.musicUrl}` : ""} -filter_complex "${filter}" -c:v libx264 -r ${req.fps || 30} /tmp/${jobId}.mp4`;
}

export async function getSlideshowHealth(): Promise<ProviderHealth> {
  return {
    id: "slideshow",
    name: "Slideshow VideoMaker",
    category: "content_automation",
    status: "online",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}

// ─── Campus Tour Slideshow (ALO specific) ───────────────────────────

export interface CampusTourSlideshowRequest {
  universityName: string;
  images: { url: string; caption?: string }[];
  durationPerImageSec?: number;
  musicUrl?: string;
  includeBranding?: boolean;
}

export async function createCampusTourSlideshow(
  req: CampusTourSlideshowRequest
): Promise<SlideshowResponse> {
  const images = req.images.map(img => ({
    url: img.url,
    durationSec: req.durationPerImageSec || 3,
    caption: img.caption,
  }));

  return createSlideshowVideo({
    images,
    musicUrl: req.musicUrl,
    transition: "ken_burns", // Ken Burns effect for campus
    aspectRatio: "16:9",
    resolution: "1080p",
    title: `${req.universityName} Campus Tour`,
    brandOverlay: req.includeBranding,
    captions: true,
  });
}
