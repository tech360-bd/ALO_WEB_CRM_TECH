import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN, COUNSELOR, MARKETING_MANAGER
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER'];

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
    const sp = req.nextUrl.searchParams;

    // Filters
    const channel = sp.get('channel')?.trim();
    const direction = sp.get('direction')?.trim();
    const studentId = sp.get('studentId')?.trim();
    const status = sp.get('status')?.trim();
    const search = sp.get('search')?.trim();

    const where: Record<string, unknown> = {};

    if (channel) where.channel = channel;
    if (direction) where.direction = direction;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    const [messages, total] = await Promise.all([
      db.communicationMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          studentId: true,
          leadId: true,
          applicationId: true,
          caseId: true,
          employeeId: true,
          channel: true,
          direction: true,
          senderId: true,
          recipientId: true,
          subject: true,
          content: true,
          messageType: true,
          externalId: true,
          status: true,
          error: true,
          createdAt: true,
        },
      }),
      db.communicationMessage.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: messages,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communications.' },
      { status: 500 },
    );
  }
}
