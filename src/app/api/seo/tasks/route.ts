import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/tasks
// Lists SeoTask records. Auth: any logged-in user.
// Query params: status?, taskType?, opportunityId?, limit?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const where: any = {};
    if (sp.get("status")) where.status = sp.get("status");
    if (sp.get("taskType")) where.taskType = sp.get("taskType");
    if (sp.get("opportunityId")) where.opportunityId = sp.get("opportunityId");
    const limit = Math.min(parseInt(sp.get("limit") || "100", 10) || 100, 500);

    const xdb = db as unknown as {
      seoTask: {
        findMany: (args: Record<string, unknown>) => Promise<any[]>;
      };
    };
    const tasks = await xdb.seoTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("[seo/tasks GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load tasks" }, { status: 500 });
  }
}

// POST /api/seo/tasks
// Create a new SEO task for an opportunity.
// Auth: any logged-in user.
// Body: { opportunityId, taskType, title, description? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.opportunityId || !body?.taskType || !body?.title) {
      return NextResponse.json(
        { error: "opportunityId, taskType, title are required" },
        { status: 400 }
      );
    }

    const { createSeoTask } = await import("@/lib/seo-engine");
    const result = await createSeoTask(
      body.opportunityId,
      body.taskType,
      body.title,
      body.description
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[seo/tasks POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create task" }, { status: 500 });
  }
}
