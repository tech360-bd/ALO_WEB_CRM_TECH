import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Needs update requires visa officer — documents.view/review/request/download/approve/reject/needs-update' }, { status: 403 });

    const id = context?.params?.id;
    const { reason, reviewerNote, nextAction, responsible, deadline } = await req.json();

    if (!reason) return NextResponse.json({ success: false, error: 'Reason required — must be supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees' }, { status: 400 });

    const existing = await db.studentDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    const visaCase = await db.visaCase.findFirst({ where: { studentId: existing.studentId } });
    if (visaCase) {
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot request update for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const updated = await db.studentDocument.update({
      where: { id },
      data: {
        status: 'needs_update',
        reviewerNote: reviewerNote || reason,
        rejectionReason: reason,
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      } as any,
    });

    // Create task for student
    await db.visaTask.create({
      data: {
        caseId: visaCase?.id || '',
        studentId: existing.studentId,
        taskType: 'DOCUMENT_REQUEST',
        title: `Document needs update: ${existing.fileName || existing.category}`,
        description: `Reason: ${reason} — next action ${nextAction || 'Upload corrected document'} — responsible ${responsible || 'student'} — deadline ${deadline || '3 days'} — supportive/clear/professional/actionable — student-safe feedback`,
        assignedTo: 'student',
        dueDate: deadline ? new Date(deadline) : new Date(Date.now()+3*24*60*60*1000),
        status: 'pending',
        priority: 'high',
        createdBy: auth.userId,
      } as any,
    }).catch(() => {});

    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_DOCUMENT_NEEDS_UPDATE',
        title: `Document needs update: ${existing.fileName || existing.category} by ${auth.name} — reason ${reason}`,
        description: `Needs update — supportive/clear/professional/actionable — next action ${nextAction || 'Upload corrected document'} — responsible ${responsible || 'student'} — deadline ${deadline || '3 days'} — Do not permanently delete submitted visa documents — Use replacement/version history — previous versions remain auditable officer cannot silently delete history`,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'VISA_DOCUMENT_NEEDS_UPDATE', 'StudentDocument', id, { reason, studentId: existing.studentId, nextAction, responsible, deadline });

    return NextResponse.json({ success: true, data: updated, note: 'Do not permanently delete submitted visa documents — Use replacement/version history — previous versions remain auditable officer cannot silently delete history — Request with name/reason/deadline/priority/visibility/notification — student can upload replacement' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
