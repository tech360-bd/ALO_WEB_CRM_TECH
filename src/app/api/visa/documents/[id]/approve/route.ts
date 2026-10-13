import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Document approve requires visa officer — documents.approve' }, { status: 403 });

    const id = context?.params?.id;
    const body = await req.json().catch(() => ({}));
    const { reviewerNote, reason } = body;

    const existing = await db.studentDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    // Ownership check via the visa case.
    //
    // SECURITY FIX: the original test only ran when a case existed AND it had a
    // visaOfficerId assigned. With no case, or an unassigned officer, the test was
    // skipped and any visa officer could act on ANY student's document by id.
    // Deny by default now: a non-administrator must be the assigned officer of an
    // existing case for this student.
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const visaCase = await db.visaCase.findFirst({ where: { studentId: existing.studentId } });
    if (!isSuper) {
      const assignedOfficer = visaCase?.visaOfficerId || '';
      const ownsCase = !!assignedOfficer && assignedOfficer === auth.userId;
      if (!ownsCase) {
        return NextResponse.json({
          success: false,
          error: visaCase
            ? 'Cannot approve a document for a visa case assigned to another officer.'
            : 'Cannot approve a document for a student with no visa case assigned to you.',
        }, { status: 403 });
      }
    }

    const updated = await db.studentDocument.update({
      where: { id },
      data: {
        status: 'approved',
        reviewerNote: reviewerNote || reason || '',
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      } as any,
    });

    await logAuditAction(auth, 'VISA_DOCUMENT_APPROVED', 'StudentDocument', id, { before: { status: existing.status }, after: { status: 'approved' }, studentId: existing.studentId, reviewerNote });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_DOCUMENT_APPROVED',
        title: `Document approved: ${existing.fileName || existing.category || id} by ${auth.name}`,
        description: `Approved — reviewer note ${reviewerNote || 'none'} — Do not permanently delete submitted visa documents — Use replacement/version history`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Do not permanently delete submitted visa documents — Use replacement/version history — every download/readiness/sensitive audited' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
