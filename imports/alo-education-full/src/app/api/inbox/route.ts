import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN, COUNSELOR, MARKETING_MANAGER, FRONT_DESK
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER', 'FRONT_DESK'];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied.' },
      { status: 403 },
    );
  }

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);

    // Get conversations with last message
    const conversations = await db.conversation.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            senderRole: true,
            content: true,
            type: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await db.conversation.count({ where: { status: 'ACTIVE' } });

    // Get student info for conversations that have studentId
    const studentIds = conversations
      .map((c) => c.studentId)
      .filter((id): id is string => id !== null);

    const students = studentIds.length > 0
      ? await db.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, studentId: true, fullName: true, email: true, mobile: true },
        })
      : [];

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

    // Count unread messages per conversation
    const conversationIds = conversations.map((c) => c.id);
    const unreadCounts = conversationIds.length > 0
      ? await db.message.groupBy({
          by: ['conversationId'],
          where: {
            conversationId: { in: conversationIds },
            isRead: false,
            senderId: { not: auth.user.id },
          },
          _count: true,
        })
      : [];

    const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.conversationId, u._count]));

    const data = conversations.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      type: c.type,
      title: c.title,
      status: c.status,
      lastMessage: c.messages[0] || null,
      unreadCount: unreadMap[c.id] || 0,
      student: c.studentId ? studentMap[c.studentId] || null : null,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inbox.' },
      { status: 500 },
    );
  }
}
