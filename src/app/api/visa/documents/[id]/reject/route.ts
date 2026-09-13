import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Document reject requires visa officer — documents.reject' }, { status: 403 });

    const id = context?.params?.id;
    const { rejectionReason, reviewerNote, reason } = await req.json();

    if (!rejectionReason && !reason) return NextResponse.json({ success: false, error: 'Rejection reason required — supportive/clear/professional/actionable' }, { status: 400 });

    const existing = await db.studentDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    const visaCase = await db.visaCase.findFirst({ where: { studentId: existing.studentId } });
    if (visaCase) {
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot reject document for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const updated = await db.studentDocument.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason || reason || '',
        reviewerNote: reviewerNote || '',
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      } as any,
    });

    await logAuditAction(auth, 'VISA_DOCUMENT_REJECTED', 'StudentDocument', id, { before: { status: existing.status }, after: { status: 'rejected' }, rejectionReason: rejectionReason || reason, studentId: existing.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_DOCUMENT_REJECTED',
        title: `Document rejected: ${existing.fileName || existing.category || id} by ${auth.name} — reason ${rejectionReason || reason}`,
        description: `Rejected — must be supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism — officer must approve before sending — Do not permanently delete — Use replacement/version history`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Do not permanently delete submitted visa documents — Use replacement/version history — rejection must be supportive/clear/professional/actionable' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
