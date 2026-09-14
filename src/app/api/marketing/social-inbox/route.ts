import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — unified social inbox (Facebook, Instagram, Messenger, WhatsApp, Email, SMS, Website chat)
export const GET = withAuth(async (req: Request, _auth: AuthContext) => {
  const platform = new URL(req.url).searchParams.get("platform");
  const unreadOnly = new URL(req.url).searchParams.get("unread") === "true";
  const where: any = {};
  if (platform && platform !== "ALL") where.platform = platform;
  if (unreadOnly) where.isRead = false;

  const messages = await db.socialInboxMessage.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  // Group by conversation
  const conversations: Record<string, any> = {};
  for (const m of messages) {
    const key = m.conversationId || `${m.platform}-${m.senderId}`;
    if (!conversations[key]) {
      conversations[key] = {
        conversationId: key,
        platform: m.platform,
        senderName: m.senderName,
        senderId: m.senderId,
        lastMessage: m.messageText,
        lastMessageAt: m.receivedAt,
        unread: 0,
        aiHandled: m.aiHandled,
        messages: [],
      };
    }
    conversations[key].messages.push(m);
    if (m.direction === "INBOUND" && !m.isRead) conversations[key].unread++;
    if (new Date(m.receivedAt) > new Date(conversations[key].lastMessageAt)) {
      conversations[key].lastMessage = m.messageText;
      conversations[key].lastMessageAt = m.receivedAt;
    }
  }

  const conversationList = Object.values(conversations).sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  // Stats per platform
  const platformStats: Record<string, number> = {};
  for (const m of messages) {
    platformStats[m.platform] = (platformStats[m.platform] || 0) + 1;
  }

  return NextResponse.json({
    conversations: conversationList,
    totalMessages: messages.length,
    unreadCount: messages.filter((m) => !m.isRead && m.direction === "INBOUND").length,
    aiHandledCount: messages.filter((m) => m.aiHandled).length,
    platformStats,
  } as any);
}, MARKETING_AUTH);

// POST — send reply from social inbox
export const POST = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { platform, conversationId, senderId, messageText, employeeId, aiDraftUsed } = body;

  const message = await db.socialInboxMessage.create({
    data: {
      platform,
      direction: "OUTBOUND",
      senderName: "ALO Education",
      recipientId: senderId,
      messageText,
      conversationId,
      employeeId,
      aiHandled: aiDraftUsed || false,
      humanApproved: true,
      isRead: true,
      sentAt: new Date(),
    },
  });

  // Mark the inbound message as read
  await db.socialInboxMessage.updateMany({
    where: { conversationId, direction: "INBOUND", isRead: false },
    data: { isRead: true },
  });

  // Audit log
  await db.auditLog.create({
    data: { userId: employeeId, action: "MESSAGE_ACTION", resource: "SocialInboxMessage", resourceId: message.id, details: JSON.stringify({ platform, conversationId, aiDraftUsed }) },
  });

  return NextResponse.json({ message, success: true } as any);
}, MARKETING_AUTH);
