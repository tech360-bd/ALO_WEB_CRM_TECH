import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = userId ? { userId } : {};

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, userType: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, email: true, userType: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.supportTicket.count({ where }),
    ]);

    return NextResponse.json({ tickets, total });
  } catch (error) {
    console.error('Support tickets GET error:', error);
    return NextResponse.json({ tickets: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const ticket = await db.supportTicket.create({
      data: {
        userId: body.userId,
        subject: body.subject || 'No Subject',
        description: body.description || '',
        category: body.category || 'general',
        priority: body.priority || 'medium',
        status: 'open',
        assignedTo: body.assignedTo || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, userType: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true, userType: true },
            },
          },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Support tickets POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
