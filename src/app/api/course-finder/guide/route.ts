import { NextRequest, NextResponse } from "next/server";
import { generateStudyGuide, renderGuideAsHTML } from "@/lib/study-guide";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/course-finder/guide?course=<slug>&format=json|html
// PUBLIC endpoint — no auth required.
export async function GET(req: NextRequest) {
  try {
    const courseSlug = req.nextUrl.searchParams.get("course");
    const format = req.nextUrl.searchParams.get("format") || "json";

    if (!courseSlug) {
      return NextResponse.json(
        { error: "course (slug) is required" },
        { status: 400 }
      );
    }

    const guide = await generateStudyGuide(courseSlug);
    if (!guide) {
      return NextResponse.json(
        { error: `Course not found: ${courseSlug}` },
        { status: 404 }
      );
    }

    if (format === "html") {
      const html = renderGuideAsHTML(guide);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return NextResponse.json({ guide });
  } catch (err: any) {
    console.error("[course-finder.guide] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
