import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const counselorId = searchParams.get("counselorId") || auth.userId;
    const channel = searchParams.get("channel");
    const studentId = searchParams.get("studentId");

    // Build where for threads
    const threadWhere: any = {};
    if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin')) {
      threadWhere.assignedToId = auth.userId;
    }
    if (channel && channel !== 'ALL') threadWhere.channel = channel;
    if (studentId) threadWhere.studentId = studentId;

    const threads = await db.communicationThread.findMany({
      where: threadWhere,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }).catch(() => []);

    // Also UccConversation for omnichannel
    const uccWhere: any = {};
    if (channel && channel !== 'ALL') uccWhere.channel = channel;
    if (studentId) uccWhere.studentId = studentId;
    const uccThreads = await db.uccConversation.findMany({
      where: uccWhere,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    }).catch(() => []);

    // Student map
    const allStudentIds = [...new Set([...threads.map((t: any) => t.studentId), ...uccThreads.map((t: any) => t.studentId)].filter(Boolean))];
    const students = allStudentIds.length ? await db.student.findMany({ where: { id: { in: allStudentIds } }, select: { id: true, studentId: true, name: true } }).catch(() => []) : [];
    const studentMap: Record<string, any> = {};
    for (const s of students) studentMap[s.id] = s;

    const conversationList = [
      ...threads.map((t: any) => ({
        id: t.id,
        channel: t.channel,
        studentId: t.studentId,
        studentName: studentMap[t.studentId]?.name || t.subject || 'Unknown',
        lastMessage: t.lastMessagePreview || t.messages?.[0]?.content || '',
        lastMessageAt: t.lastMessageAt,
        unread: t.unreadCount || 0,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedToName,
        slaStatus: t.slaStatus,
        source: 'communication_thread',
      })),
      ...uccThreads.map((t: any) => ({
        id: t.id,
        channel: t.channel,
        studentId: t.studentId,
        studentName: t.participantName || studentMap[t.studentId]?.name || 'Unknown',
        lastMessage: t.lastMessageText || '',
        lastMessageAt: t.lastMessageAt,
        unread: t.unreadCount || 0,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedToUserId,
        slaStatus: 'none',
        source: 'ucc_conversation',
      })),
    ].sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    const slaStats = await db.slaEvent.groupBy({ by: ["eventType"], _count: true }).catch(() => []);

    return NextResponse.json({ success: true, conversations: conversationList, slaStats, total: conversationList.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { threadId, channel, content, toPhone, studentId } = body;
    if (!threadId && !studentId) return NextResponse.json({ success: false, error: 'threadId or studentId required' }, { status: 400 });

    let finalThreadId = threadId;
    if (!finalThreadId && studentId) {
      const thread = await db.communicationThread.findFirst({ where: { studentId }, orderBy: { lastMessageAt: 'desc' } });
      finalThreadId = thread?.id;
    }

    if (!finalThreadId) return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });

    const msg = await db.communicationMessage.create({
      data: {
        threadId: finalThreadId,
        channel: channel || 'whatsapp',
        direction: 'outbound',
        senderType: 'employee',
        senderId: auth.userId,
        content: content || body.body || '',
        isRead: true,
      },
    });

    await db.communicationThread.update({ where: { id: finalThreadId }, data: { lastMessageAt: new Date(), lastMessagePreview: (content || '').slice(0,100) } }).catch(() => {});

    if (studentId) {
      await db.timelineEvent.create({
        data: {
          studentId,
          stage: 'MESSAGE_SENT',
          title: `${channel || 'whatsapp'} reply sent`,
          description: (content || '').slice(0,100),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
