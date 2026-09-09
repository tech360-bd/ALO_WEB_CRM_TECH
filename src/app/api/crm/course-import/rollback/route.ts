import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    const batch = await db.crmImportBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch.status === 'rolled_back') {
      return NextResponse.json({ error: 'Batch already rolled back' }, { status: 400 });
    }

    if (!batch.rollbackAvailable) {
      return NextResponse.json({ error: 'Rollback not available for this batch' }, { status: 400 });
    }

    let rowsDeleted = 0;

    // Delete commissions created in this batch
    const deletedCommissions = await db.crmCommission.deleteMany({
      where: { batchId },
    });
    rowsDeleted += deletedCommissions.count;

    // Delete scholarships created in this batch
    const deletedScholarships = await db.crmScholarship.deleteMany({
      where: { batchId },
    });
    rowsDeleted += deletedScholarships.count;

    // Delete requirements created in this batch
    const deletedRequirements = await db.crmCourseRequirement.deleteMany({
      where: { batchId },
    });
    rowsDeleted += deletedRequirements.count;

    // Delete intake fees created in this batch
    const deletedIntakes = await db.crmCourseIntakeFee.deleteMany({
      where: { batchId },
    });
    rowsDeleted += deletedIntakes.count;

    // Delete import errors for this batch
    await db.crmImportError.deleteMany({
      where: { batchId },
    });

    // Update batch status
    await db.crmImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'rolled_back',
        rollbackAvailable: false,
      },
    });

    // Create audit log
    await db.crmAuditLog.create({
      data: {
        actorUserId: '',
        actorRole: 'system',
        action: 'import_batch_rolled_back',
        targetCollection: 'CrmImportBatch',
        targetId: batchId,
        batchId,
        beforeData: JSON.stringify({
          rowsImported: batch.rowsImported,
          status: batch.status,
        }),
        afterData: JSON.stringify({
          rowsDeleted,
          status: 'rolled_back',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      rowsDeleted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}