import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeoStaff } from "@/lib/seo/request-access";
import { z } from "zod";
import { createSeoTask } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/tasks
export async function GET(req: NextRequest) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;

  const status = req.nextUrl.searchParams.get("status") || "ALL";
  const taskType = req.nextUrl.searchParams.get("taskType");
  const opportunityId = req.nextUrl.searchParams.get("opportunityId");
  const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) return NextResponse.json({ error: "Invalid page limit." }, { status: 400 });

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (taskType) where.taskType = taskType;
  if (opportunityId) where.opportunityId = opportunityId;

  try {
  const [tasks, total] = await Promise.all([
    db.seoTask.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    }),
    db.seoTask.count({ where }),
  ]);

  return NextResponse.json({ tasks, total });
  } catch { return NextResponse.json({error:'SEO records unavailable.'},{status:503}); }
}

// POST /api/seo/tasks
// Body: { opportunityId?, taskType, title, description? }
export async function POST(req: NextRequest) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = z.object({ opportunityId:z.string().min(1).max(191).optional(), taskType:z.string().trim().min(1).max(100),
    title:z.string().trim().min(1).max(191), description:z.string().max(4000).optional() }).strict().safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:'Invalid bounded SEO task.'},{status:400});
  try {
    const p=parsed.data;
    const task = await createSeoTask(p.opportunityId ?? null,p.taskType,p.title,p.description ?? null);
    return NextResponse.json({task});
  } catch { return NextResponse.json({error:'SEO task could not be created.'},{status:503}); }
}
