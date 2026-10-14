import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { authorizeStaffDocumentRead, listStudentDocumentsUnified } from '@/lib/documents/document-access-resolver';

/**
 * Staff document list for one student.
 *
 * SECURITY FIX: this route previously skipped its ownership test whenever the
 * student had no assigned counselor:
 *
 *     if (counselorId && counselorId !== auth.userId && !roles.includes(...)) → 403
 *
 * With `counselorId` empty — an unassigned student, or an id that matched no
 * student at all — the condition was falsy, no refusal was returned, and the
 * documents query ran for ANY authenticated account. Missing assignment granted
 * access instead of denying it.
 *
 * Authorization now goes through the shared policy, which denies by default and
 * additionally requires an application relationship for partner-originated
 * students. The list is also merged across both document tables so a partner or
 * portal upload is visible here (it previously was not).
 */
export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || '';

    const guard = await authorizeStaffDocumentRead({ userId: auth.userId, roles: auth.roles }, studentId);
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    const documents = await listStudentDocumentsUnified({
      studentId: guard.resolved.studentId || studentId,
      studentProfileId: guard.resolved.studentProfileId,
    });

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
      accessVia: guard.decision.via,
      canReview: guard.decision.canReview,
      canDelete: guard.decision.canDelete,
    });
  } catch (error: any) {
    console.error('[counselor.documents] list failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Could not load documents for this student.' }, { status: 500 });
  }
});
