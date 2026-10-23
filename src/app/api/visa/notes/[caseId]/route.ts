import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { listVisaOfficerNotes, VisaNoteError } from '@/lib/visa/notes';

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const result = await listVisaOfficerNotes(auth, caseId);
    return NextResponse.json({ success: true, data: result.notes, notes: result.notes, viewScope: result.viewScope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch (error) {
    if (error instanceof VisaNoteError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    return NextResponse.json({ success: false, error: 'Notes could not be loaded.' }, { status: 503 });
  }
});
