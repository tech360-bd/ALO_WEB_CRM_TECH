import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const stage = req.nextUrl.searchParams.get("stage");
  const where: any = {};
  if (stage) where.stage = stage;
  const apps = await db.application.findMany({
    where,
    include: { student: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ applications: apps });
}

// Update application stage
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, stage, userId } = body;
  const app = await db.application.update({
    where: { id },
    data: { stage },
  });
  await db.timelineEvent.create({
    data: {
      studentId: app.studentId,
      userId,
      type: "APP_STATUS_CHANGED",
      title: `Application stage updated`,
      description: `${app.university} - ${app.course} moved to ${stage.replace(/_/g, " ").toLowerCase()}`,
    },
  });
  await db.auditLog.create({
    data: {
      userId,
      action: "APP_STATUS_CHANGE",
      resource: "Application",
      resourceId: app.id,
      details: JSON.stringify({ stage }),
    },
  });
  return NextResponse.json({ application: app });
}
