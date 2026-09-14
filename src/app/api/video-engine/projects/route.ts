import { NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";
import { db } from "@/lib/db";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN", "COUNSELOR"] };

// GET /api/video-engine/projects - list projects
export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (category) where.category = category;
    if (providerId) where.providerId = providerId;
    if (status) where.status = status;

    const projects = await (db as any).videoProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }).catch(() => []);

    return NextResponse.json({ success: true, projects, count: projects.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);

// POST /api/video-engine/projects - create project
export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { title, description, category, providerId, templateId, aspectRatio, resolution, platform, durationSec, language, script, prompt, referenceImageUrl, audioUrl, brandOverlay, subtitle } = body;

    if (!title) return NextResponse.json({ success: false, error: "title required" }, { status: 400 });

    const engine = getVideoEngine();
    const projectInput = {
      title,
      description: description || "",
      category: category || "promo",
      providerId: providerId || "remotion",
      templateId,
      aspectRatio: aspectRatio || "16:9",
      resolution: resolution || "1080p",
      platform: platform || "facebook",
      durationSec: durationSec || 30,
      language: language || "english",
      script: script || "",
      prompt: prompt || script || title,
      referenceImageUrl: referenceImageUrl || "",
      audioUrl: audioUrl || "",
      brandOverlay: brandOverlay !== false,
      subtitle: subtitle !== false,
    };

    // Create in memory + DB
    const project = await engine.createProject(projectInput as any, auth.userId);

    // Try to persist to DB
    let persisted = null;
    try {
      persisted = await (db as any).videoProject.create({
        data: {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          providerId: project.providerId,
          templateId: project.templateId || "",
          aspectRatio: project.aspectRatio,
          resolution: project.resolution,
          platform: project.platform,
          durationSec: project.durationSec,
          language: project.language,
          script: project.script,
          prompt: project.prompt || "",
          referenceImageUrl: project.referenceImageUrl || "",
          audioUrl: project.audioUrl || "",
          brandOverlay: project.brandOverlay,
          subtitle: project.subtitle,
          status: project.status,
          progress: 0,
          createdById: auth.userId,
        },
      });
    } catch (e) {
      console.warn("[VideoEngine] DB create failed, using memory:", e);
      persisted = project;
    }

    return NextResponse.json({ success: true, project: persisted || project }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
