import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function ok(data: unknown, message = "OK") {
  return NextResponse.json({ success: true, message, data, meta: {}, errors: [] });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";

    const where: Record<string, unknown> = { status: "published" };

    if (q.length >= 2) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const articles = await db.article.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        category: true,
        tags: true,
        author: true,
        readingMinutes: true,
        verificationStatus: true,
        publishedAt: true,
        featured: true,
      },
      take: q.length >= 2 ? 5 : 12,
    });
    return ok({ articles }, "Articles fetched.");
  } catch (e) {
    console.error("[public/articles] error", e);
    return NextResponse.json(
      { success: false, message: "Internal error.", data: null, meta: {}, errors: ["server_error"] },
      { status: 500 }
    );
  }
}
