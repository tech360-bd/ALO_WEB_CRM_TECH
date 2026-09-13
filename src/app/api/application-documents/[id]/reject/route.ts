import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canReview = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.review_documents');
  if (!canReview) return NextResponse.json({ success: false, error: 'Forbidden: review_documents permission required' }, { status: 403 });

  const body = await req.json();
  if (!body.reviewerNote) return NextResponse.json({ success: false, error: 'Rejection reason required in reviewerNote' }, { status: 400 });

  const existing = await db.applicationDocument.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

  const updated = await db.applicationDocument.update({
    where: { id: params.id },
    data: { status: 'REJECTED', reviewerId: auth.userId, reviewerNote: body.reviewerNote, version: existing.version + 1 },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: existing.applicationId,
      oldStatus: existing.status,
      newStatus: 'REJECTED',
      safeStatus: 'DOCUMENTS_REQUIRED',
      changedBy: auth.userId,
      visibility: 'internal',
      note: `Document ${existing.documentType} rejected: ${body.reviewerNote}`,
    },
  });

  await logAuditAction(auth, 'REJECT_DOCUMENT', 'ApplicationDocument', params.id, { reason: body.reviewerNote });
  await db.auditLog.create({
    data: { userId: auth.userId, action: 'REJECT_DOCUMENT', resource: 'ApplicationDocument', resourceId: params.id, details: JSON.stringify({ reason: body.reviewerNote }), actorRole: auth.roles[0] || '' },
  });

  return NextResponse.json({ success: true, data: updated, message: 'Document rejected — version audited' });
});
