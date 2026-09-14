import { NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN"] };

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { projectId, providerId, compositionId, inputProps, prompt, referenceImageUrl, durationSec, aspectRatio, resolution } = body;

    const engine = getVideoEngine();

    // Remotion render
    if (providerId === "remotion" || compositionId) {
      const result = await engine.renderRemotion({
        compositionId: compositionId || "UniversityPromo",
        inputProps: inputProps || { title: prompt || "ALO Education", universityName: "UK Universities" },
      });
      return NextResponse.json({ success: true, job: result, provider: "remotion" });
    }

    // AI generation (LTX, CogVideo, Hunyuan, etc)
    if (["ltx", "cogvideo", "hunyuan", "longcat", "pixelle", "comfyui"].includes(providerId)) {
      const result = await engine.generateAI({
        providerId,
        prompt: prompt || "University campus cinematic",
        durationSec: durationSec || 5,
        aspectRatio: aspectRatio || "16:9",
        resolution: resolution || "720p",
        referenceImageUrl,
      });
      return NextResponse.json({ success: true, job: result, provider: providerId });
    }

    // Generic render
    if (projectId) {
      const job = await engine.renderProject(projectId, providerId);
      return NextResponse.json({ success: true, job });
    }

    return NextResponse.json({ success: false, error: "Provide projectId or providerId + prompt/compositionId" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
