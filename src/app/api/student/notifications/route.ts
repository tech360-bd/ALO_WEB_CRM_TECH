import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudentResource } from "@/lib/student-resource-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestedStudentId = req.nextUrl.searchParams.get("studentId");
  if (!requestedStudentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;

  const notifications = await db.studentNotification.findMany({ where: { studentId: access.studentId }, orderBy: { createdAt: "desc" }, take: 20 });
  const unread = await db.studentNotification.count({ where: { studentId: access.studentId, isRead: false } });
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { notificationId } = body as { notificationId?: string };
  if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

  const existing = await db.studentNotification.findUnique({ where: { id: notificationId }, select: { studentId: true } });
  if (!existing) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  const access = await requireStudentResource(req, existing.studentId);
  if (access instanceof NextResponse) return access;

  const updated = await db.studentNotification.update({ where: { id: notificationId }, data: { isRead: true } });
  return NextResponse.json({ notification: updated });
}
