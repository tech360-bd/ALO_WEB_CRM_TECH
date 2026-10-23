import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { publishApprovedStudentFeedback, VisaFeedbackError } from '@/lib/visa/student-feedback';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.id;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId }, select: { id: true, studentId: true } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    const result = await publishApprovedStudentFeedback(auth, visaCase, await req.json().catch(() => null));
    return NextResponse.json({ success: true, data: result, externalDelivery: false }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof VisaFeedbackError) return NextResponse.json({ success: false, error: error.message, details: error.details }, { status: error.status });
    return NextResponse.json({ success: false, error: 'Feedback was not sent because the transaction or audit could not be completed.' }, { status: 503 });
  }
});
