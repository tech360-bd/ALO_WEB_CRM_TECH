import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — List student notifications
export async function GET(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  // Students can only see their own notifications
  if (user!.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student || student.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const notifications = await db.studentNotification.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unread = await db.studentNotification.count({ where: { studentId, isRead: false } });
  return NextResponse.json({ notifications, unread });
}

// PATCH — Mark notification as read
export async function PATCH(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { notificationId, markAllRead, studentId } = body;

  if (markAllRead && studentId) {
    // Mark all notifications as read for a student
    if (user!.role === "STUDENT") {
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student || student.userId !== user!.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    await db.studentNotification.updateMany({
      where: { studentId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ message: "All notifications marked as read" });
  }

  if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

  const notification = await db.studentNotification.findUnique({ where: { id: notificationId } });
  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  // Students can only mark their own notifications
  if (user!.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { id: notification.studentId } });
    if (!student || student.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await db.studentNotification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
  return NextResponse.json({ notification: updated });
}
