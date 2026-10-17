import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingAccess, requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Keyword triggers — auto-reply / DM / lead-capture rules.
 * - GET: any marketing access.
 * - POST/PUT/DELETE: marketing_manager / super_admin.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const triggers = await db.keywordTrigger.findMany({
      orderBy: { matchCount: 'desc' },
    });
    return NextResponse.json({ triggers });
  } catch (error) {
    console.error('Keyword triggers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    if (!body.keyword || !body.autoReplyText) {
      return NextResponse.json(
        { error: 'keyword and autoReplyText are required' },
        { status: 400 }
      );
    }

    const trigger = await db.keywordTrigger
      .create({
        data: {
          keyword: body.keyword.toLowerCase(),
          platform: body.platform || 'all',
          autoReplyText: body.autoReplyText,
          autoDmText: body.autoDmText || null,
          createLead: body.createLead !== false,
          assignCounselorId: body.assignCounselorId || null,
          status: body.status || 'active',
        },
      })
      .catch(() => null);
    if (!trigger) {
      return NextResponse.json(
        { error: 'Keyword already exists for this platform' },
        { status: 409 }
      );
    }

    await logAudit({
      userId: auth.user.id,
      action: 'keyword_trigger.created',
      module: 'marketing',
      recordId: trigger.id,
      newData: trigger,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ trigger }, { status: 201 });
  } catch (error) {
    console.error('Keyword triggers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.keywordTrigger.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Trigger not found' },
        { status: 404 }
      );
    }

    if (updateData.keyword) updateData.keyword = updateData.keyword.toLowerCase();
    const trigger = await db.keywordTrigger.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: auth.user.id,
      action: 'keyword_trigger.updated',
      module: 'marketing',
      recordId: trigger.id,
      oldData: existing,
      newData: trigger,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ trigger });
  } catch (error) {
    console.error('Keyword triggers PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await db.keywordTrigger.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Trigger not found' },
        { status: 404 }
      );
    }

    await db.keywordTrigger.delete({ where: { id } });

    await logAudit({
      userId: auth.user.id,
      action: 'keyword_trigger.deleted',
      module: 'marketing',
      recordId: id,
      oldData: existing,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Keyword triggers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
