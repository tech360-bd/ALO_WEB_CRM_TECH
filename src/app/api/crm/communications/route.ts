import { communicationScope } from '@/lib/communication/access-scope';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const channel = searchParams.get('channel') || '';
      const senderType = searchParams.get('senderType') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const scope = await communicationScope(auth);
      const where: Record<string, unknown> = { AND: [scope.messages] };
      if (search) {
        where.OR = [
          { content: { contains: search } },
          { senderName: { contains: search } },
          { studentId: { contains: search } },
        ];
      }
      if (channel) where.channel = channel;
      if (senderType) where.senderType = senderType;

      const [total, messages] = await Promise.all([
        db.communicationMessage.count({ where }),
        db.communicationMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            thread: { select: { channel: true, status: true, assignedToName: true } },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: messages,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Communications API error:', error);
      return NextResponse.json({ success: false, error: 'Failed to load communications' }, { status: 500 });
    }
  })(request);
}
