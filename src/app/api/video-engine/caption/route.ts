import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN", "COUNSELOR"] };

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { videoUrl, language, targetLanguages, useWhisperLocal, useLLMRefinement } = body;
    if (!videoUrl) return NextResponse.json({ success: false, error: "videoUrl required" }, { status: 400 });

    const engine = getVideoEngine();
    const result = await engine.captionVideo({
      videoUrl,
      language: language || "en",
      targetLanguages: targetLanguages || ["bn", "en"],
      useWhisperLocal: useWhisperLocal || false,
      useLLMRefinement: useLLMRefinement !== false,
    });

    return NextResponse.json({ success: true, caption: result, provider: "videocaptioner (WEIFENG2333/VideoCaptioner)" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
