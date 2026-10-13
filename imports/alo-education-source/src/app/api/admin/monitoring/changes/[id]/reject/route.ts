import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get DataChange with ApprovalQueueItem
    const change = await db.dataChange.findUnique({
      where: { id },
      include: { approvalQueue: true },
    });

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    }

    if (change.status === 'REJECTED') {
      return NextResponse.json({ error: 'Change already rejected' }, { status: 400 });
    }

    const reviewNote = 'Rejected by admin';

    // 2. Update DataChange to REJECTED
    await db.dataChange.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewNote,
      },
    });

    // 3. Update ApprovalQueueItem to REJECTED
    if (change.approvalQueue) {
      await db.approvalQueueItem.update({
        where: { id: change.approvalQueue.id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewNote,
        },
      });
    }

    // 4. Create AuditLog entry
    await db.auditLog.create({
      data: {
        action: 'REJECT_CHANGE',
        resource: 'DataChange',
        resourceId: id,
        details: JSON.stringify({
          changeType: change.changeType,
          fieldName: change.fieldName,
          universitySlug: change.universitySlug,
          courseSlug: change.courseSlug,
          impactLevel: change.impactLevel,
        }),
      },
    });

    return NextResponse.json({ success: true, changeId: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to reject change', details: message }, { status: 500 });
  }
}
