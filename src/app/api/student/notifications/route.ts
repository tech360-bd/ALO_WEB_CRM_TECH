import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/student-resource-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const notifications = await db.studentNotification.findMany({ where: { studentId: access.studentId }, orderBy: { createdAt: "desc" }, take: 20 });
  const unread = await db.studentNotification.count({ where: { studentId: access.studentId, isRead: false } });
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { notificationId } = body;
  if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

  const notification = await db.studentNotification.findUnique({ where: { id: notificationId } });
  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  // Ownership check: caller may only mark their OWN notification as read
  // (or a privileged/assigned-counselor staff member may act on it).
  const access = await resolveStudentAccess(req, notification.studentId);
  if (access instanceof NextResponse) return access;

  const updated = await db.studentNotification.update({ where: { id: notificationId }, data: { isRead: true } });
  return NextResponse.json({ notification: updated });
}
