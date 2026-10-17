import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const appointments = await db.appointment.findMany({ where: { studentId }, orderBy: { scheduledAt: "asc" }, take: 10 });
  return NextResponse.json({ appointments });
}
