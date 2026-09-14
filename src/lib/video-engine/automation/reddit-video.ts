/**
 * RedditVideoMakerBot Adapter
 * Repo: https://github.com/elebumm/RedditVideoMakerBot.git
 * Turns Reddit threads into TikTok/Shorts: TTS + background video + subtitles
 * Adapted for ALO Education: FAQ DB / success stories → video
 */

import type { ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";

export interface RedditVideoRequest {
  redditUrl?: string;
  subreddit?: string;
  sortBy?: "hot" | "top" | "new";
  postId?: string;
  backgroundVideoUrl?: string;
  backgroundMusicUrl?: string;
  voice: "male" | "female" | "bengali_male" | "bengali_female" | "arabic_male";
  maxComments?: number;
  includePost: boolean;
  language: string;
  source: "reddit" | "alo_forum" | "faq_db" | "success_stories";
  // ALO specific
  faqId?: string;
  successStoryId?: string;
  customText?: string;
  title?: string;
}

export interface RedditVideoResponse {
  jobId: string;
  outputUrl: string;
  title: string;
  durationSec: number;
  source: string;
  segments: { text: string; startSec: number; endSec: number }[];
  metadata: Record<string, unknown>;
}

export async function createRedditStyleVideo(
  req: RedditVideoRequest
): Promise<RedditVideoResponse> {
  const config = getVideoEngineConfig();
  const jobId = `reddit-video-${Date.now()}`;

  // If source is ALO, use internal DB
  if (req.source === "faq_db" || req.source === "alo_forum" || req.source === "success_stories") {
    return createALOStyleVideo(req, jobId);
  }

  // Reddit source - requires Reddit API
  if (req.source === "reddit" && !config.automation.reddit.enabled) {
    throw new Error("Reddit API not configured, set REDDIT_ENABLED=true, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET");
  }

  // Mock for Reddit source
  return {
    jobId,
    outputUrl: `https://mock.alo-education.com/videos/${jobId}.mp4`,
    title: req.title || "Reddit Story Video",
    durationSec: 50,
    source: req.source,
    segments: [
      { text: "This is a Reddit story...", startSec: 0, endSec: 5 },
      { text: "Top comment: ...", startSec: 5, endSec: 15 },
    ],
    metadata: {
      via: "RedditVideoMakerBot pattern",
      subreddit: req.subreddit,
      voice: req.voice,
      backgroundVideo: req.backgroundVideoUrl || "minecraft_parkour",
      note: "Adapted from elebumm/RedditVideoMakerBot - uses TTS + background + subtitles",
      compliance: "GPL inspiration, own implementation via Remotion",
    },
  };
}

async function createALOStyleVideo(
  req: RedditVideoRequest,
  jobId: string
): Promise<RedditVideoResponse> {
  // For ALO, we generate video from FAQ or success story
  // This will use Remotion composition "SuccessStoryRedditStyle" or "FAQShort"
  
  let title = req.title || "";
  let content = req.customText || "";
  
  if (req.source === "faq_db") {
    title = req.title || "FAQ: Study Abroad";
    content = req.customText || "What is the UK student visa fee? It's £490 plus IHS.";
  } else if (req.source === "success_stories") {
    title = req.title || "Student Success Story";
    content = req.customText || "From Dhaka to London: My journey with ALO Education...";
  }

  return {
    jobId,
    outputUrl: `https://mock.alo-education.com/videos/${jobId}.mp4`,
    title,
    durationSec: 45,
    source: req.source,
    segments: [
      { text: title, startSec: 0, endSec: 3 },
      { text: content.slice(0, 100), startSec: 3, endSec: 15 },
    ],
    metadata: {
      via: "ALO adaptation of RedditVideoMakerBot",
      remotionComposition: req.source === "faq_db" ? "FAQShort" : "SuccessStoryRedditStyle",
      voice: req.voice,
      language: req.language,
      backgroundVideoUrl: req.backgroundVideoUrl || "/videos/minecraft-parkour.mp4 (or campus B-roll)",
      tts: "ElevenLabs or Azure TTS",
      subtitles: "Remotion + VideoCaptioner",
      approvalRequired: true,
      note: "All ALO videos require Marketing Manager approval before publish (per existing approval queue)",
    },
  };
}

export async function getRedditMakerHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  return {
    id: "reddit-maker",
    name: "RedditVideoMakerBot (ALO Adapted)",
    category: "content_automation",
    status: config.automation.reddit.enabled ? "online" : "not_configured",
    lastCheckedAt: new Date().toISOString(),
    supports: { t2v: false, i2v: false, talkingHead: false, captioning: false, editing: false, streaming: false },
  };
}

// ─── Batch FAQ to Video (n8n cron) ──────────────────────────────────

export async function batchFAQToVideos(
  faqs: { id: string; question: string; answer: string }[],
  options: { voice: string; language: string; backgroundVideoUrl?: string }
): Promise<RedditVideoResponse[]> {
  const results: RedditVideoResponse[] = [];
  for (const faq of faqs) {
    const video = await createRedditStyleVideo({
      source: "faq_db",
      faqId: faq.id,
      title: faq.question,
      customText: faq.answer,
      voice: options.voice as any,
      language: options.language,
      backgroundVideoUrl: options.backgroundVideoUrl,
      includePost: true,
    });
    results.push(video);
  }
  return results;
}
