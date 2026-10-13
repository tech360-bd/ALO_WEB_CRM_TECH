import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  GET — Get a single SMS message                                      */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const message = await db.smsMessage.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, fullName: true, mobile: true } },
        lead: { select: { id: true, fullName: true, phone: true } },
        sentBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'SMS message not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SMS message' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update status / delivery receipt                            */
/* ------------------------------------------------------------------ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireAuth(req);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, errorReason } = body;

    const existing = await db.smsMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SMS message not found' },
        { status: 404 },
      );
    }

    const allowedStatuses = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'SENT') updateData.sentAt = new Date();
      if (status === 'DELIVERED') updateData.deliveredAt = new Date();
      if (status === 'FAILED' || status === 'UNDELIVERED') {
        updateData.failedAt = new Date();
        if (errorReason) updateData.errorReason = errorReason;
      }
    }

    const updated = await db.smsMessage.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, fullName: true, mobile: true } },
        lead: { select: { id: true, fullName: true, phone: true } },
        sentBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'SMS updated',
      sms: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update SMS message' },
      { status: 500 },
    );
  }
}
