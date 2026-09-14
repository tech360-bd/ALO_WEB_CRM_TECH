/**
 * InfiniteTalk Adapter
 * Repo: https://github.com/MeiGen-AI/InfiniteTalk.git
 * Audio-driven infinite talking head
 */

import type { TalkingHeadRequest, TalkingHeadResponse, ProviderHealth } from "../types";
import { getVideoEngineConfig } from "../config";
import { checkProviderHealth } from "../ai-generation/providers";

export async function generateInfiniteTalk(
  req: TalkingHeadRequest
): Promise<TalkingHeadResponse> {
  const config = getVideoEngineConfig();
  const jobId = `infinitetalk-${Date.now()}`;

  if (!req.audioUrl && !req.audioText) {
    throw new Error("Either audioUrl or audioText required for InfiniteTalk");
  }

  // If API URL configured
  if (config.talkingHead.infinitetalk.apiUrl) {
    try {
      const res = await fetch(`${config.talkingHead.infinitetalk.apiUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_url: req.audioUrl,
          audio_text: req.audioText,
          reference_image: req.referenceImageUrl,
          language: req.language,
          emotion: req.emotion || "neutral",
          background: req.backgroundUrl,
          avatar_preset: req.avatarPreset,
        }),
      });
      if (!res.ok) throw new Error(`InfiniteTalk API ${res.status}`);
      const json = await res.json();
      return {
        jobId: json.job_id || jobId,
        outputUrl: json.output_url || json.video_url,
        durationSec: json.duration || 30,
        providerId: "infinitetalk",
      };
    } catch (e: any) {
      return {
        jobId,
        outputUrl: "",
        durationSec: 0,
        providerId: "infinitetalk",
      };
    }
  }

  // Local path
  if (config.talkingHead.infinitetalk.localPath) {
    return {
      jobId,
      outputUrl: `/tmp/${jobId}.mp4`,
      durationSec: 30,
      providerId: "infinitetalk",
    };
  }

  // Mock for dev
  return {
    jobId,
    outputUrl: `https://mock.alo-education.com/videos/${jobId}.mp4`,
    durationSec: 30,
    providerId: "infinitetalk",
  };
}

export async function getInfiniteTalkHealth(): Promise<ProviderHealth> {
  const config = getVideoEngineConfig();
  const h = await checkProviderHealth("infinitetalk", "InfiniteTalk", config.talkingHead.infinitetalk.apiUrl);
  return { ...h, vramRequiredGB: 16, supports: { t2v: false, i2v: false, talkingHead: true, captioning: false, editing: false, streaming: false } };
}

// Avatar presets for ALO
export const AVATAR_PRESETS = {
  counselor_bangla_female: {
    id: "counselor_bangla_female",
    name: "Bangla Female Counselor",
    imageUrl: "/avatars/counselor-bn-f.jpg",
    description: "Professional female counselor, Bangla, friendly, for Bangladeshi students",
    language: "bn",
    gender: "female",
  },
  counselor_english_male: {
    id: "counselor_english_male",
    name: "English Male Counselor",
    imageUrl: "/avatars/counselor-en-m.jpg",
    description: "Professional male counselor, English, UK accent",
    language: "en",
    gender: "male",
  },
  counselor_english_female: {
    id: "counselor_english_female",
    name: "English Female Counselor",
    imageUrl: "/avatars/counselor-en-f.jpg",
    description: "Professional female counselor, English, warm",
    language: "en",
    gender: "female",
  },
  campus_guide: {
    id: "campus_guide",
    name: "Campus Tour Guide",
    imageUrl: "/avatars/campus-guide.jpg",
    description: "Young energetic tour guide for campus videos",
    language: "en",
    gender: "neutral",
  },
  visa_officer: {
    id: "visa_officer",
    name: "Visa Officer Avatar",
    imageUrl: "/avatars/visa-officer.jpg",
    description: "Official visa officer for visa guide videos",
    language: "en",
    gender: "male",
  },
};

export function getAvatarPreset(id: string) {
  return (AVATAR_PRESETS as any)[id];
}

export function getAllAvatarPresets() {
  return Object.values(AVATAR_PRESETS);
}
