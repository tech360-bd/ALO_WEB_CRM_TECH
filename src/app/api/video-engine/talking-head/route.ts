import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN"] };

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { providerId, audioUrl, audioText, referenceImageUrl, referenceVideoUrl, language, avatarPreset, emotion } = body;
    
    if (!providerId) return NextResponse.json({ success: false, error: "providerId required: infinitetalk or retalking" }, { status: 400 });

    const engine = getVideoEngine();
    const result = await engine.generateTalkingHead({
      providerId,
      audioUrl,
      audioText,
      referenceImageUrl,
      referenceVideoUrl,
      language: language || "en",
      avatarPreset,
      emotion: emotion || "neutral",
    });

    return NextResponse.json({ success: true, result, provider: providerId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);

export const GET = withAuth(async () => {
  try {
    const engine = getVideoEngine();
    const presets = engine.getAvatarPresets();
    return NextResponse.json({ success: true, presets, providers: ["infinitetalk (MeiGen-AI/InfiniteTalk)", "retalking (OpenTalker/video-retalking)"] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
