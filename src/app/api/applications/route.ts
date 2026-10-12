import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

// GET — List applications (with optional stage filter)
export async function GET(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const stage = req.nextUrl.searchParams.get("stage");
  const studentId = req.nextUrl.searchParams.get("studentId");
  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;
  if (studentId) where.studentId = studentId;

  const apps = await db.application.findMany({
    where,
    include: { student: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ applications: apps });
}

// PATCH — Update application stage
export async function PATCH(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { id, stage } = body;

  if (!id || !stage) {
    return NextResponse.json({ error: "Application id and stage are required" }, { status: 400 });
  }

  const app = await db.application.update({
    where: { id },
    data: { stage },
  });

  // Timeline event
  await db.timelineEvent.create({
    data: {
      studentId: app.studentId,
      userId: user!.id,
      type: "APP_STATUS_CHANGED",
      title: "Application stage updated",
      description: `${app.university} - ${app.course} moved to ${stage.replace(/_/g, " ").toLowerCase()}`,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user!.id,
      action: "APP_STATUS_CHANGE",
      resource: "Application",
      resourceId: app.id,
      details: JSON.stringify({ stage }),
    },
  });

  return NextResponse.json({ application: app });
}
