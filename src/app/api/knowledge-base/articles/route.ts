import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ingestArticle, searchArticles } from "@/lib/knowledge-base-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/knowledge-base/articles — list/search KB articles.
// Query: ?q=&country=&topic=&status=&verificationStatus=&limit=&offset=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await searchArticles({
      q: sp.get("q") || undefined,
      country: sp.get("country") || undefined,
      topic: sp.get("topic") || undefined,
      universitySlug: sp.get("universitySlug") || undefined,
      status: sp.get("status") || undefined,
      verificationStatus: sp.get("verificationStatus") || undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!) : undefined,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/knowledge-base/articles — ingest a new KB article.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      country,
      course,
      universitySlug,
      topic,
      year,
      content,
      summary,
      tags,
      sourceUrl,
      sourceTitle,
      officialUrl,
      aiGenerated,
      aiAgentId,
      status,
    } = body;

    if (!title || !topic || !content) {
      return NextResponse.json(
        { error: "title, topic, and content are required" },
        { status: 400 }
      );
    }

    const article = await ingestArticle({
      title,
      slug,
      country,
      course,
      universitySlug,
      topic,
      year,
      content,
      summary,
      tags,
      sourceUrl,
      sourceTitle,
      officialUrl,
      aiGenerated,
      aiAgentId,
      status,
    });

    return NextResponse.json({ success: true, article });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
