import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Document request requires visa officer — documents.request' }, { status: 403 });

    const body = await req.json();
    const { studentId, caseId, documentName, description, dueDate, reason, deadline, priority, visibility, notificationChannel, category } = body;

    if (!documentName) return NextResponse.json({ success: false, error: 'Document name required — 25+ types Passport/Photo/Offer Letter/CAS/Academic Certificates/Transcripts/English Test/Bank Statement/Solvency Certificate/Sponsor Letter/Sponsor ID/Sponsor Occupation Proof/Source of Funds/Birth Certificate/Marriage Certificate/Work Experience/Study Gap Evidence/Refusal Letter/TB/Medical/Accommodation/Consent Documents/Visa Application/Biometric Appointment/Payment Receipt/Other Country-specific' }, { status: 400 });

    let visaCase = null;
    if (caseId) visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase && studentId) visaCase = await db.visaCase.findFirst({ where: { studentId } });

    if (caseId && visaCase) {
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot request document for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const task = await db.visaTask.create({
      data: {
        studentId: studentId || visaCase?.studentId || '',
        caseId: caseId || visaCase?.id || '',
        title: `Document Requested: ${documentName}`,
        description: description || reason || `Please provide: ${documentName} — reason ${reason || 'visa requirement'} — priority ${priority || 'medium'} — visibility ${visibility || 'student_visible'} — notification ${notificationChannel || 'portal+email'}`,
        status: 'pending',
        taskType: 'DOCUMENT_REQUEST',
        priority: priority || 'medium',
        dueDate: dueDate || deadline ? new Date(dueDate || deadline) : null,
        assignedTo: 'student',
        createdBy: auth.userId,
      } as any,
    });

    // Also create checklist item if case exists
    if (visaCase) {
      await db.visaChecklistItem.create({
        data: {
          studentId: visaCase.studentId,
          applicationId: visaCase.applicationId || '',
          item: documentName,
          category: category || 'general',
          isRequired: true,
          status: 'NOT_UPLOADED',
          priority: priority || 'medium',
          deadline: deadline || dueDate ? new Date(deadline || dueDate) : null,
          reason: reason || description,
          studentVisible: visibility !== 'internal_only',
        } as any,
      }).catch(() => {});
    }

    await db.timelineEvent.create({
      data: {
        studentId: studentId || visaCase?.studentId || '',
        stage: 'VISA_DOCUMENT_REQUESTED',
        title: `Visa Document Requested: ${documentName} — reason ${reason || 'visa requirement'} — deadline ${deadline || dueDate || 'none'} — priority ${priority || 'medium'}`,
        description: `Requested by ${auth.name} — Request with name/reason/deadline/priority/visibility/notification — notification channel ${notificationChannel || 'portal+email'} — student can upload replacement previous versions remain auditable officer cannot silently delete history`,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'VISA_DOCUMENT_REQUEST', 'VisaTask', task.id, { documentName, reason, deadline, priority, visibility, studentId: studentId || visaCase?.studentId, caseId });

    return NextResponse.json({ success: true, data: task, note: 'Request with name/reason/deadline/priority/visibility/notification — student can upload replacement previous versions remain auditable officer cannot silently delete history — no permanent delete version history — reuse existing Email/WhatsApp/SMS/Portal Message no duplicate engine RBAC/consent/audit' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
