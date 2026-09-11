import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const notifications = await db.studentNotification.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 20 });
  const unread = await db.studentNotification.count({ where: { studentId, isRead: false } });
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { notificationId } = body;
  if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });
  const updated = await db.studentNotification.update({ where: { id: notificationId }, data: { isRead: true } });
  return NextResponse.json({ notification: updated });
}
