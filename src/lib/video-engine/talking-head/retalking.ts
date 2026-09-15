/**
 * Video-Retalking Adapter
 * Repo: https://github.com/OpenTalker/video-retalking.git
 * Lip-sync via audio, multilingual dubbing
 */

import type { TalkingHeadRequest, TalkingHeadResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export async function generateRetalking(
  req: TalkingHeadRequest
): Promise<TalkingHeadResponse> {
  const config = getVideoEngineConfig();
  const jobId = `retalking-${Date.now()}`;

  if (!req.referenceVideoUrl) {
    throw new Error("referenceVideoUrl required for video-retalking (video to lip-sync)");
  }
  if (!req.audioUrl && !req.audioText) {
    throw new Error("audioUrl or audioText required for lip-sync");
  }

  // API
  if (config.talkingHead.retalking.apiUrl) {
    try {
      const res = await fetch(`${config.talkingHead.retalking.apiUrl}/lip-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: req.referenceVideoUrl,
          audio_url: req.audioUrl,
          audio_text: req.audioText,
          language: req.language,
        }),
      });
      if (!res.ok) throw new Error(`Retalking API ${res.status}`);
      const json = await res.json();
      return {
        jobId: json.job_id || jobId,
        outputUrl: json.output_url || json.video_url,
        durationSec: json.duration || 30,
        providerId: "retalking",
      };
    } catch (e: any) {
      console.error("[Retalking] API failed:", e);
    }
  }

  // Local
  if (config.talkingHead.retalking.localPath) {
    return {
      jobId,
      outputUrl: `/tmp/${jobId}.mp4`,
      durationSec: 30,
      providerId: "retalking",
    };
  }

  // Mock
  return {
    jobId,
    outputUrl: `https://mock.alo-education.com/videos/${jobId}_dub_${req.language}.mp4`,
    durationSec: 30,
    providerId: "retalking",
  };
}

export async function getRetalkingHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("retalking", "video-retalking", config.talkingHead.retalking.apiUrl);
  return { ...h, vramRequiredGB: 8, supports: { t2v: false, i2v: false, talkingHead: true, captioning: false, editing: false, streaming: false } };
}

// ─── Multilingual Dubbing Pipeline ──────────────────────────────────

/**
 * Dub a video to multiple languages
 * Workflow: English video + translated audio → lip-synced videos
 * Huge for ALO Bangladesh market
 */
export async function dubVideoMultilingual(
  referenceVideoUrl: string,
  translations: { language: string; audioUrl?: string; audioText?: string }[]
): Promise<TalkingHeadResponse[]> {
  const results: TalkingHeadResponse[] = [];
  
  for (const trans of translations) {
    const result = await generateRetalking({
      providerId: "retalking",
      referenceVideoUrl,
      audioUrl: trans.audioUrl,
      audioText: trans.audioText,
      language: trans.language,
    });
    results.push(result);
  }
  
  return results;
}

// ─── TTS Helper (needed for retalking when only text provided) ───────

export async function textToSpeechForDubbing(
  text: string,
  language: string,
  voice?: string
): Promise<{ audioUrl: string; durationSec: number }> {
  // In production, use ElevenLabs, Azure TTS, or local TTS
  // For now mock
  return {
    audioUrl: `https://mock.tts.alo-education.com/${language}/${Date.now()}.mp3`,
    durationSec: Math.ceil(text.length / 15), // Rough estimate
  };
}
