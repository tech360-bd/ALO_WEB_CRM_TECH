import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCanonicalCounselor, counselorStudentScope, safeStudentSelect } from '@/lib/counselor/student-access';
import { canViewUccB2B } from '@/lib/ucc/document-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIORITY_WEIGHT: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

/**
 * CRM AI Command Center feed (spec §58/§59).
 *
 * Read-only aggregation over the caller's *authorized* student scope. It never
 * reaches for the admin-only AI endpoints (`/api/ai-command`, `/api/agentos`)
 * the way a copied dashboard would; every list is filtered by
 * `counselorStudentScope` and B2B-confidential students are removed unless the
 * caller holds the explicit B2B permission.
 *
 * Nothing here is synthesized: if the database has no rows the lists are empty
 * and the UI shows an empty state instead of a plausible-looking number.
 */
export async function GET(request: Request) {
  const auth = await requireCanonicalCounselor(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const scope = counselorStudentScope(auth);
    const students = await db.student.findMany({
      where: scope,
      select: safeStudentSelect,
      orderBy: { updatedAt: 'desc' },
      take: 300,
    });

    const b2bVisible = canViewUccB2B(auth);
    let visible = students;
    if (!b2bVisible && students.length > 0) {
      const confidential = await db.application.findMany({
        where: { studentId: { in: students.map((student) => student.id) }, isB2bConfidential: true },
        select: { studentId: true },
      });
      const hidden = new Set(confidential.map((row) => row.studentId));
      visible = students.filter((student) => !hidden.has(student.id));
    }

    const ids = visible.map((student) => student.id);
    const nameById = new Map(visible.map((student) => [student.id, { studentId: student.studentId, name: student.name }]));
    const empty = ids.length === 0;

    const [actions, documents, applications, approvals] = await Promise.all([
      empty
        ? Promise.resolve([])
        : db.studentNextBestAction.findMany({
            where: { studentId: { in: ids }, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }),
      empty
        ? Promise.resolve([])
        : db.studentDocument.findMany({
            where: { studentId: { in: ids }, isArchived: false, status: { in: ['UPLOADED', 'uploaded', 'UNDER_REVIEW', 'under_review', 'PROCESSING'] } },
            orderBy: { updatedAt: 'desc' },
            take: 50,
          }),
      empty
        ? Promise.resolve([])
        : db.application.findMany({
            where: {
              studentId: { in: ids },
              status: 'active',
              ...(b2bVisible ? {} : { isB2bConfidential: false }),
            },
            select: {
              id: true,
              applicationCode: true,
              applicationId: true,
              studentId: true,
              universityName: true,
              courseName: true,
              stage: true,
              safeStatus: true,
              documentStatus: true,
              offerStatus: true,
              paymentStatus: true,
              visaHandoverStatus: true,
              deadlineDate: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 200,
          }),
      db.approvalRequest.findMany({
        where: {
          status: 'pending',
          OR: [{ assignedToId: auth.userId }, { requestedById: auth.userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const nextBestActions = [...actions]
      .sort((a, b) => (PRIORITY_WEIGHT[b.priority?.toUpperCase()] ?? 0) - (PRIORITY_WEIGHT[a.priority?.toUpperCase()] ?? 0))
      .slice(0, 25)
      .map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        priority: action.priority,
        dueDate: action.dueDate,
        student: nameById.get(action.studentId) ?? null,
        studentRecordId: action.studentId,
      }));

    const now = Date.now();
    const deadlineHorizon = now + 30 * 86_400_000;
    const upcomingDeadlines = applications
      .filter((application) => application.deadlineDate && new Date(application.deadlineDate).getTime() <= deadlineHorizon)
      .sort((a, b) => new Date(a.deadlineDate as Date).getTime() - new Date(b.deadlineDate as Date).getTime())
      .slice(0, 25)
      .map((application) => ({
        applicationRecordId: application.id,
        applicationCode: application.applicationCode,
        applicationSerial: application.applicationId,
        universityName: application.universityName,
        courseName: application.courseName,
        deadlineDate: application.deadlineDate,
        stage: application.stage,
        student: nameById.get(application.studentId) ?? null,
      }));

    const documentsAwaitingReview = documents.slice(0, 25).map((document) => ({
      id: document.id,
      category: document.category,
      fileName: document.fileName,
      status: document.status,
      version: document.version,
      uploadedAt: document.createdAt,
      student: nameById.get(document.studentId) ?? null,
      studentRecordId: document.studentId,
    }));

    const pendingApprovals = approvals.map((approval) => ({
      id: approval.id,
      type: approval.type,
      title: approval.title,
      entityType: approval.entityType,
      entityId: approval.entityId,
      priority: approval.priority,
      createdAt: approval.createdAt,
      deadline: approval.deadline,
      assignedToMe: approval.assignedToId === auth.userId,
    }));

    return NextResponse.json(
      {
        viewer: { userId: auth.userId, name: auth.name, userType: auth.userType },
        scope: { mode: ids.length === students.length ? 'ALL' : 'OWN', b2bVisible, studentCount: visible.length },
        generatedAt: new Date().toISOString(),
        counts: {
          students: visible.length,
          activeApplications: applications.length,
          documentsAwaitingReview: documents.length,
          pendingNextBestActions: actions.length,
          pendingApprovals: approvals.length,
          upcomingDeadlines: upcomingDeadlines.length,
          offersAwaitingVerification: applications.filter((a) => a.offerStatus === 'PENDING').length,
          paymentsOutstanding: applications.filter((a) => a.paymentStatus !== 'PAID').length,
        },
        lists: {
          nextBestActions,
          documentsAwaitingReview,
          upcomingDeadlines,
          pendingApprovals,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'The AI command center data is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
