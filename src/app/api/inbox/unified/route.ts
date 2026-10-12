import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Unified inbox — all channels (WhatsApp, SMS, email, social, portal)
export async function GET(req: NextRequest) {
  const counselorId = req.nextUrl.searchParams.get("counselorId");
  const channel = req.nextUrl.searchParams.get("channel");
  const where: any = {};
  if (counselorId) where.counselorId = counselorId;
  if (channel && channel !== "ALL") where.channel = channel;

  const messages = await db.communicationMessage.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  // Fetch student info for messages with studentId
  const studentIds = Array.from(new Set(messages.map((m) => m.studentId).filter(Boolean))) as string[];
  const students = studentIds.length > 0 ? await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, studentId: true, fullName: true } }) : [];
  const studentMap: Record<string, any> = {};
  for (const s of students) studentMap[s.id] = s;

  // Group by conversation (student + channel)
  const conversations: Record<string, any> = {};
  for (const m of messages) {
    const key = `${m.studentId || m.fromPhone || m.fromEmail || "unknown"}-${m.channel}`;
    if (!conversations[key]) {
      const stu = m.studentId ? studentMap[m.studentId] : null;
      conversations[key] = {
        key,
        channel: m.channel,
        studentId: m.studentId,
        studentName: stu?.fullName || m.fromName,
        fromPhone: m.fromPhone,
        fromEmail: m.fromEmail,
        messages: [],
        unread: 0,
        lastMessageAt: m.receivedAt,
      };
    }
    conversations[key].messages.push(m);
    if (m.direction === "INBOUND" && !m.read) conversations[key].unread++;
    if (new Date(m.receivedAt) > new Date(conversations[key].lastMessageAt)) conversations[key].lastMessageAt = m.receivedAt;
  }

  const conversationList = Object.values(conversations).sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  // SLA stats
  const slaStats = await db.slaEvent.groupBy({ by: ["status"], _count: true });

  return NextResponse.json({ conversations: conversationList, slaStats, totalMessages: messages.length });
}

// Send reply
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { channel, toPhone, toEmail, body: msgBody, studentId, counselorId, aiAssisted, humanApproved } = body;
  const msg = await db.communicationMessage.create({
    data: { channel, direction: "OUTBOUND", toPhone, toEmail, body: msgBody, studentId, counselorId, aiAssisted: aiAssisted || false, humanApproved: humanApproved ?? true, read: true, sentAt: new Date() },
  });
  if (studentId) {
    await db.timelineEvent.create({ data: { studentId, userId: counselorId, type: "MESSAGE_SENT", title: `${channel} reply sent`, description: msgBody.slice(0, 100) } });
  }
  return NextResponse.json({ message: msg });
}
