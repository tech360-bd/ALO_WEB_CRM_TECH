import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/course-finder/guide?course=<slug>&format=json|html
// PUBLIC endpoint — generates a structured study guide for a course.
//   - format=json (default): returns the StudyGuide JSON object.
//   - format=html: returns a self-contained HTML document.
export async function GET(req: NextRequest) {
  try {
    const courseSlug = req.nextUrl.searchParams.get("course");
    const format = (req.nextUrl.searchParams.get("format") || "json").toLowerCase();

    if (!courseSlug) {
      return NextResponse.json({ error: "course query param is required" }, { status: 400 });
    }

    const { generateStudyGuide, renderGuideAsHTML } = await import("@/lib/study-guide");
    const guide = await generateStudyGuide(courseSlug);

    if (format === "html") {
      const html = renderGuideAsHTML(guide);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(guide);
  } catch (err: any) {
    console.error("[course-finder/guide] error", err);
    return NextResponse.json({ error: err?.message || "Failed to generate study guide" }, { status: 500 });
  }
}
