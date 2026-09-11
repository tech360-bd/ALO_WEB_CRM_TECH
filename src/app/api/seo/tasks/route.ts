import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSeoTask } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/tasks
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "ALL";
  const taskType = req.nextUrl.searchParams.get("taskType");
  const opportunityId = req.nextUrl.searchParams.get("opportunityId");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (taskType) where.taskType = taskType;
  if (opportunityId) where.opportunityId = opportunityId;

  const [tasks, total] = await Promise.all([
    db.seoTask.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    }),
    db.seoTask.count({ where }),
  ]);

  return NextResponse.json({ tasks, total });
}

// POST /api/seo/tasks
// Body: { opportunityId?, taskType, title, description? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { opportunityId, taskType, title, description } = body;

  if (!taskType || !title) {
    return NextResponse.json(
      { error: "taskType and title are required" },
      { status: 400 }
    );
  }

  const task = await createSeoTask(
    opportunityId ?? null,
    taskType,
    title,
    description ?? null
  );
  return NextResponse.json({ task });
}
