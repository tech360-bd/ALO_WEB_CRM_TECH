import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/changes
// Returns the change queue with filters. Default: pending changes.
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "PENDING";
  const impact = req.nextUrl.searchParams.get("impact"); // LOW | MEDIUM | HIGH | CRITICAL
  const changeType = req.nextUrl.searchParams.get("changeType");
  const entityType = req.nextUrl.searchParams.get("entityType"); // UNIVERSITY | COURSE | ...
  const universitySlug = req.nextUrl.searchParams.get("university");
  const courseSlug = req.nextUrl.searchParams.get("course");
  const q = req.nextUrl.searchParams.get("q"); // free-text search
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (impact) where.impactLevel = impact;
  if (changeType) where.changeType = changeType;
  if (entityType) where.entityType = entityType;
  if (universitySlug) where.universitySlug = universitySlug;
  if (courseSlug) where.courseSlug = courseSlug;
  if (q) {
    where.OR = [
      { fieldName: { contains: q } },
      { oldValue: { contains: q } },
      { newValue: { contains: q } },
      { aiExplanation: { contains: q } },
      { sourceUrl: { contains: q } },
      { universitySlug: { contains: q } },
      { courseSlug: { contains: q } },
    ];
  }

  const [changes, total] = await Promise.all([
    db.dataChange.findMany({
      where,
      orderBy: [{ impactLevel: "desc" }, { detectedAt: "desc" }],
      take: limit,
      skip: offset,
      include: {
        source: { select: { sourceName: true, sourceType: true, priority: true } },
        values: true,
        approvals: { orderBy: { performedAt: "desc" }, take: 5 },
      },
    }),
    db.dataChange.count({ where }),
  ]);

  return NextResponse.json({ changes, total, limit, offset });
}
