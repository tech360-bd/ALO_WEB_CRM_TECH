import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { createVisaOfficerNote, listVisaOfficerNotes, VisaNoteError } from '@/lib/visa/notes';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const caseId = new URL(req.url).searchParams.get('caseId');
    if (!caseId) return NextResponse.json({ success: false, error: 'caseId is required.' }, { status: 400 });
    const result = await listVisaOfficerNotes(auth, caseId);
    return NextResponse.json({ success: true, data: result.notes, notes: result.notes, viewScope: result.viewScope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch (error) {
    if (error instanceof VisaNoteError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    return NextResponse.json({ success: false, error: 'Notes could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const note = await createVisaOfficerNote(auth, await req.json().catch(() => null));
    return NextResponse.json({ success: true, data: note }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof VisaNoteError) return NextResponse.json({ success: false, error: error.message, details: error.details }, { status: error.status });
    return NextResponse.json({ success: false, error: 'Note could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
