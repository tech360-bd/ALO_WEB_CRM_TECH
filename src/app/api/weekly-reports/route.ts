import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Weekly reports — by type, with optional recipient filter
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const where: any = {};
  if (type) where.type = type;
  const reports = await db.weeklyReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  // Parse JSON summaries
  const parsed = reports.map((r) => ({ ...r, summary: JSON.parse(r.summary || "{}") }));
  return NextResponse.json({ reports: parsed });
}
