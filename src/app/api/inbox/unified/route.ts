import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Unified inbox over the canonical communication thread/message models. */
export async function GET(req: NextRequest) {
  const assigneeId = req.nextUrl.searchParams.get("counselorId");
  const channel = req.nextUrl.searchParams.get("channel");
  const where: { assignedTo?: string; channel?: string } = {};
  if (assigneeId) where.assignedTo = assigneeId;
  if (channel && channel !== "ALL") where.channel = channel;

  const messages = await db.communicationMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  const studentIds = Array.from(new Set(messages.map((message) => message.studentId).filter(Boolean)));
  const students = studentIds.length
    ? await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, studentId: true, name: true, phone: true, email: true } })
    : [];
  const studentMap = Object.fromEntries(students.map((student) => [student.id, student]));
  const conversations: Record<string, { key: string; channel: string; studentId: string; studentName: string; contact: string; messages: typeof messages; unread: number; lastMessageAt: Date }> = {};

  for (const message of messages) {
    const key = `${message.studentId || message.threadId}-${message.channel}`;
    const student = message.studentId ? studentMap[message.studentId] : undefined;
    if (!conversations[key]) {
      conversations[key] = {
        key,
        channel: message.channel,
        studentId: message.studentId,
        studentName: student?.name || message.senderName,
        contact: student?.phone || student?.email || message.senderContact,
        messages: [],
        unread: 0,
        lastMessageAt: message.createdAt,
      };
    }
    conversations[key].messages.push(message);
    if (message.direction.toUpperCase() === "INBOUND" && !message.isRead) conversations[key].unread += 1;
    if (message.createdAt > conversations[key].lastMessageAt) conversations[key].lastMessageAt = message.createdAt;
  }

  const conversationList = Object.values(conversations).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  const slaStats = await db.slaEvent.groupBy({ by: ["eventType"], _count: true });
  return NextResponse.json({ conversations: conversationList, slaStats, totalMessages: messages.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { channel, body: messageBody, studentId, counselorId, aiAssisted, humanApproved } = body as {
    channel: string; body: string; studentId?: string; counselorId?: string; aiAssisted?: boolean; humanApproved?: boolean;
  };
  if (!channel || !messageBody?.trim()) return NextResponse.json({ error: "channel and body are required" }, { status: 400 });

  const thread = await db.communicationThread.create({
    data: {
      studentId: studentId || "",
      channel,
      assignedToId: counselorId || "",
      status: "open",
      lastMessagePreview: messageBody.slice(0, 160),
    },
  });
  const message = await db.communicationMessage.create({
    data: {
      threadId: thread.id,
      channel,
      direction: "OUTBOUND",
      studentId: studentId || "",
      assignedTo: counselorId || "",
      messageBody,
      content: messageBody,
      isAiGenerated: aiAssisted || false,
      isRead: humanApproved ?? true,
      readAt: new Date(),
      createdBy: counselorId || "system",
    },
  });
  if (studentId) {
    await db.timelineEvent.create({ data: { studentId, stage: "communication", actor: counselorId || "system", title: `${channel} reply sent`, description: messageBody.slice(0, 100) } });
  }
  return NextResponse.json({ message });
}
