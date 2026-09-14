import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN", "COUNSELOR"] };

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { operation, videoUrl, options, targetResolution, model, prompt, subtitleArea } = body;
    if (!operation || !videoUrl) return NextResponse.json({ success: false, error: "operation and videoUrl required" }, { status: 400 });

    const engine = getVideoEngine();
    const result = await engine.editVideo({
      operation,
      videoUrl,
      options,
      targetResolution,
      model,
      prompt,
      subtitleArea,
    } as any);

    return NextResponse.json({ success: true, result, operation });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
