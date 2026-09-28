import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/student-resource-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const appointments = await db.appointment.findMany({ where: { studentId: access.studentId }, orderBy: { scheduledAt: "asc" }, take: 10 });
  return NextResponse.json({ appointments });
}
