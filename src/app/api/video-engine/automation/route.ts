import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getVideoEngine } from "@/lib/video-engine";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN"] };

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { type } = body;

    const engine = getVideoEngine();

    switch (type) {
      case "youtube": {
        const { url, hasRights, purpose, quality } = body;
        if (!url) return NextResponse.json({ success: false, error: "url required" }, { status: 400 });
        const result = await engine.downloadYoutube({ url, hasRights: hasRights || false, purpose: purpose || "own_content_reedit", quality });
        return NextResponse.json({ success: true, result });
      }
      case "reddit": {
        const result = await engine.createRedditVideo(body);
        return NextResponse.json({ success: true, result });
      }
      case "slideshow": {
        const result = await engine.createSlideshow(body);
        return NextResponse.json({ success: true, result });
      }
      case "animated": {
        const result = await engine.createAnimatedText(body);
        return NextResponse.json({ success: true, result });
      }
      case "claude_video": {
        const { prompt } = body;
        if (!prompt) return NextResponse.json({ success: false, error: "prompt required" }, { status: 400 });
        const result = await engine.generateViaClaudeVideo(prompt, body);
        return NextResponse.json({ success: true, result });
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown automation type ${type}. Use: youtube, reddit, slideshow, animated, claude_video` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);

export const GET = withAuth(async () => {
  try {
    const { VIDEOMAKER_REPOS } = await import("@/lib/video-engine/automation/videomaker-aggregator");
    const { TELEGRAM_BOT_COMMANDS } = await import("@/lib/video-engine/automation/telegram-bot");
    return NextResponse.json({
      success: true,
      types: ["youtube (ytdl-org/youtube-dl)", "reddit (elebumm/RedditVideoMakerBot)", "slideshow (viniciusenari/slideshow-videomaker)", "animated (shubhamdevhouse/Animated-VideoMaker)", "claude_video (bradautomates/claude-video)", "videomaker_aggregator (9 repos)", "telegram_bot (Bilal-Belli/videoMakerBOT)"],
      videomakerRepos: VIDEOMAKER_REPOS,
      telegramCommands: TELEGRAM_BOT_COMMANDS,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
