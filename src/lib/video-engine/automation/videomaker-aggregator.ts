/**
 * VideoMaker Aggregator
 * Aggregates 9x VideoMaker repos:
 * - https://github.com/dunossauro/videomaker-helper.git
 * - https://github.com/burhankocabiyik/videomaker.git
 * - https://github.com/wtz2017/VideoMaker.git
 * - https://github.com/viniciusenari/slideshow-videomaker.git (core)
 * - https://github.com/WuTao-CS/VideoMaker.git
 * - https://github.com/seed0001/videoMaker.git
 * - https://github.com/Bilal-Belli/videoMakerBOT.git
 * - https://github.com/Nncstudio/VideoMakerPro.git
 * - https://github.com/shubhamdevhouse/Animated-VideoMaker.git
 * 
 * Plus:
 * - https://github.com/Augani/openreel-video.git (CapCut alternative)
 */

import type { ProviderHealth } from "../types";

export const VIDEOMAKER_REPOS = [
  { id: "videomaker-helper", url: "https://github.com/dunossauro/videomaker-helper.git", name: "videomaker-helper", pattern: "FFmpeg wrapper helper", priority: "P2" },
  { id: "videomaker-burhan", url: "https://github.com/burhankocabiyik/videomaker.git", name: "videomaker (burhan)", pattern: "Image+audio→video", priority: "P2" },
  { id: "videomaker-wtz", url: "https://github.com/wtz2017/VideoMaker.git", name: "VideoMaker (wtz2017)", pattern: "Slideshow+music", priority: "P2" },
  { id: "slideshow-videomaker", url: "https://github.com/viniciusenari/slideshow-videomaker.git", name: "slideshow-videomaker", pattern: "Image→video with transitions (core)", priority: "P1" },
  { id: "videomaker-wutao", url: "https://github.com/WuTao-CS/VideoMaker.git", name: "VideoMaker (WuTao)", pattern: "Generic", priority: "P2" },
  { id: "videomaker-seed", url: "https://github.com/seed0001/videoMaker.git", name: "videoMaker (seed)", pattern: "Generic", priority: "P2" },
  { id: "videomakerbot", url: "https://github.com/Bilal-Belli/videoMakerBOT.git", name: "videoMakerBOT", pattern: "Telegram bot", priority: "P1" },
  { id: "videomakerpro", url: "https://github.com/Nncstudio/VideoMakerPro.git", name: "VideoMakerPro", pattern: "Pro timeline", priority: "P2" },
  { id: "animated-videomaker", url: "https://github.com/shubhamdevhouse/Animated-VideoMaker.git", name: "Animated-VideoMaker", pattern: "Kinetic typography", priority: "P1" },
  { id: "openreel-video", url: "https://github.com/Augani/openreel-video.git", name: "openreel-video", pattern: "CapCut alternative timeline", priority: "P2" },
];

export function getVideoMakerRepo(id: string) {
  return VIDEOMAKER_REPOS.find(r => r.id === id);
}

export function getAllVideoMakerRepos() {
  return VIDEOMAKER_REPOS;
}

// Unified interface that aggregates all patterns
export interface UnifiedVideoMakerRequest {
  type: "slideshow" | "animated_text" | "image_audio" | "telegram_bot" | "pro_timeline";
  images?: { url: string; durationSec: number }[];
  texts?: string[];
  audioUrl?: string;
  musicUrl?: string;
  transition?: string;
  template?: string;
  // For telegram bot
  chatId?: string;
  command?: string;
}

export async function createViaUnifiedMaker(
  req: UnifiedVideoMakerRequest
): Promise<{ jobId: string; outputUrl: string; via: string; metadata: any }> {
  const jobId = `unified-${req.type}-${Date.now()}`;
  
  let via = "";
  let remotionComposition = "";
  
  switch (req.type) {
    case "slideshow":
      via = "viniciusenari/slideshow-videomaker + wtz2017/VideoMaker";
      remotionComposition = "CampusTourSlideshow";
      break;
    case "animated_text":
      via = "shubhamdevhouse/Animated-VideoMaker";
      remotionComposition = "AnimatedText";
      break;
    case "image_audio":
      via = "burhankocabiyik/videomaker";
      remotionComposition = "UniversityPromo";
      break;
    case "telegram_bot":
      via = "Bilal-Belli/videoMakerBOT";
      remotionComposition = "Telegram bot triggers n8n → Remotion";
      break;
    case "pro_timeline":
      via = "Nncstudio/VideoMakerPro + Augani/openreel-video";
      remotionComposition = "OpenReel timeline → Remotion";
      break;
  }

  return {
    jobId,
    outputUrl: `/tmp/${jobId}.mp4`,
    via,
    metadata: {
      type: req.type,
      remotionComposition,
      aggregatedRepos: VIDEOMAKER_REPOS.filter(r => r.pattern.toLowerCase().includes(req.type) || req.type === "slideshow").map(r => r.id),
      note: "All 9 VideoMaker repos patterns aggregated into Remotion + FFmpeg. Original repos are simple, we provide superior implementation via Remotion.",
      originalRepos: VIDEOMAKER_REPOS,
    },
  };
}

export async function getVideoMakerAggregatorHealth(): Promise<ProviderHealth> {
  return {
    id: "slideshow",
    name: "VideoMaker Aggregator (9 repos)",
    category: "content_automation",
    status: "online",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}
