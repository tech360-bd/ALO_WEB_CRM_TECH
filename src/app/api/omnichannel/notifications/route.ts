import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — notifications
export async function GET(req: NextRequest) {
  const recipientType = req.nextUrl.searchParams.get("recipientType");
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  const where: any = {};
  if (recipientType) where.recipientType = recipientType;
  if (unreadOnly) where.isRead = false;
  const notifications = await db.notificationEngine.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ notifications });
}

// POST — create notification
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { recipientType, recipientId, channel, title, message, category, priority, actionUrl } = body;
  const notification = await db.notificationEngine.create({
    data: { recipientType, recipientId, channel: channel || "IN_APP", title, message, category: category || "SYSTEM", priority: priority || "NORMAL", isRead: false, sentAt: new Date() },
  });
  return NextResponse.json({ notification });
}

// PATCH — mark as read
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isRead } = body;
  const notification = await db.notificationEngine.update({ where: { id }, data: { isRead, readAt: isRead ? new Date() : null } });
  return NextResponse.json({ notification });
}
