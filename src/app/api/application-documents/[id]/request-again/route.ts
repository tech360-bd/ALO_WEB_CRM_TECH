import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canReview = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.review_documents');
  if (!canReview) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const existing = await db.applicationDocument.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

  const updated = await db.applicationDocument.update({
    where: { id: params.id },
    data: { status: 'REQUEST_AGAIN', reviewerId: auth.userId, reviewerNote: body.reviewerNote || 'Please re-upload', version: existing.version + 1 },
  });

  await db.application.update({
    where: { id: existing.applicationId },
    data: { documentStatus: 'INCOMPLETE', safeStatus: 'DOCUMENTS_REQUIRED' },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: existing.applicationId,
      oldStatus: existing.status,
      newStatus: 'REQUEST_AGAIN',
      safeStatus: 'DOCUMENTS_REQUIRED',
      changedBy: auth.userId,
      visibility: 'public_safe',
      note: `Document ${existing.documentType} requested again: ${body.reviewerNote || ''}`,
    },
  });

  await logAuditAction(auth, 'REQUEST_DOCUMENT_AGAIN', 'ApplicationDocument', params.id);
  await db.auditLog.create({
    data: { userId: auth.userId, action: 'REQUEST_DOCUMENT_AGAIN', resource: 'ApplicationDocument', resourceId: params.id, details: JSON.stringify({ documentType: existing.documentType }), actorRole: auth.roles[0] || '' },
  });

  return NextResponse.json({ success: true, data: updated, message: 'Document requested again — student notified' });
});
