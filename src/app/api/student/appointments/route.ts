import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudentResource } from "@/lib/student-resource-auth";

import { resolveStudentAccess } from "@/lib/student-resource-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestedStudentId = req.nextUrl.searchParams.get("studentId");
  if (!requestedStudentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;

  const appointments = await db.appointment.findMany({
    where: { studentId: access.studentId },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });
  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const appointments = await db.appointment.findMany({ where: { studentId: access.studentId }, orderBy: { scheduledAt: "asc" }, take: 10 });
  return NextResponse.json({ appointments });
}
