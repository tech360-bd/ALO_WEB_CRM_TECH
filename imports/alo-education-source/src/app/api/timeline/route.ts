import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const where: any = {};
  if (studentId) where.studentId = studentId;
  const events = await db.timelineEvent.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}
