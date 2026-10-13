import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function ok(data: unknown, message = "OK") {
  return NextResponse.json({ success: true, message, data, meta: {}, errors: [] });
}

// Public projects list (only visible/public, with approved fields)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";

    const where: Record<string, unknown> = { visibility: "public" };

    if (q.length >= 2) {
      where.OR = [
        { name: { contains: q } },
        { subtitle: { contains: q } },
        { businessProblem: { contains: q } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        category: true,
        shortDescription: true,
        approvedRole: true,
        status: true,
        approvedUrl: true,
        featured: true,
        businessProblem: true,
      },
      take: q.length >= 2 ? 5 : undefined,
    });
    return ok({ projects }, "Projects fetched.");
  } catch (e) {
    console.error("[public/projects] error", e);
    return NextResponse.json(
      { success: false, message: "Internal error.", data: null, meta: {}, errors: ["server_error"] },
      { status: 500 }
    );
  }
}
