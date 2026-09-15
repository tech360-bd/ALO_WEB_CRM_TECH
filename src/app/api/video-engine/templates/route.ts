import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN", "COUNSELOR"] };

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const engine = getVideoEngine();
    let compositions = engine.getRemotionCompositions();
    if (category) compositions = compositions.filter(c => c.category === category);

    // Also include Manim templates
    const { MANIM_TEMPLATES } = await import("@/lib/video-engine/manim");

    // AI prompt presets
    const { ALO_PROMPT_PRESETS } = await import("@/lib/video-engine/ai-generation");

    // Talking head use cases
    const { TALKING_HEAD_USE_CASES } = await import("@/lib/video-engine/talking-head");

    // n8n workflow templates
    const { N8N_VIDEO_WORKFLOW_TEMPLATES } = await import("@/lib/video-engine/n8n");

    return NextResponse.json({
      success: true,
      remotion: compositions,
      manim: MANIM_TEMPLATES,
      aiPresets: ALO_PROMPT_PRESETS,
      talkingHead: TALKING_HEAD_USE_CASES,
      n8nWorkflows: N8N_VIDEO_WORKFLOW_TEMPLATES,
      count: compositions.length,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
