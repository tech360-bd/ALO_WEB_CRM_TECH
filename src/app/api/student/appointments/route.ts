import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — List student appointments
export async function GET(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  // Students can only see their own appointments
  if (user!.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student || student.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const appointments = await db.appointment.findMany({
    where: { studentId },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });
  return NextResponse.json({ appointments });
}
