/**
 * Talking Head Index
 * Aggregates InfiniteTalk + video-retalking
 */

import type { TalkingHeadRequest, TalkingHeadResponse } from "../types";
import { generateInfiniteTalk, getInfiniteTalkHealth, getAllAvatarPresets } from "./infinitetalk";
import { generateRetalking, getRetalkingHealth, dubVideoMultilingual } from "./retalking";

export { AVATAR_PRESETS, getAvatarPreset, getAllAvatarPresets } from "./infinitetalk";
export { dubVideoMultilingual, textToSpeechForDubbing } from "./retalking";

export async function generateTalkingHead(
  req: TalkingHeadRequest
): Promise<TalkingHeadResponse> {
  if (req.providerId === "infinitetalk") {
    return generateInfiniteTalk(req);
  }
  if (req.providerId === "retalking") {
    return generateRetalking(req);
  }
  throw new Error(`Unknown talking head provider ${req.providerId}`);
}

export async function getTalkingHeadProvidersHealth() {
  const [infiniteTalk, retalking] = await Promise.all([
    getInfiniteTalkHealth(),
    getRetalkingHealth(),
  ]);
  return { infinitetalk: infiniteTalk, retalking };
}

// ─── ALO Use Cases ──────────────────────────────────────────────────

export const TALKING_HEAD_USE_CASES = {
  ai_counselor: {
    title: "AI Counselor Avatar",
    description: "Virtual study abroad advisor that speaks Bangla/English, 24/7",
    provider: "infinitetalk" as const,
    preset: "counselor_bangla_female",
    examplePrompt: "Hello! I'm your ALO Education counselor. Let's discuss your UK study options for 2027 intake...",
  },
  multilingual_dub: {
    title: "Multilingual Dubbing",
    description: "Take English counselor video, dub to Bangla/Hindi/Arabic with lip-sync",
    provider: "retalking" as const,
    languages: ["bn", "hi", "ar", "en"],
  },
  campus_tour: {
    title: "Campus Tour Guide",
    description: "AI avatar guides through campus tour slideshow",
    provider: "infinitetalk" as const,
    preset: "campus_guide",
  },
  visa_guide: {
    title: "Visa Guide Officer",
    description: "Official avatar explains visa steps",
    provider: "infinitetalk" as const,
    preset: "visa_officer",
  },
  personalized_message: {
    title: "Personalized Video Message",
    description: "Student name + university + course → unique video",
    provider: "infinitetalk" as const,
    dynamicProps: ["studentName", "university", "course", "intake"],
  },
};
