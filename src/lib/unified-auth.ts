import { authenticateRequest as authPortal, AuthContext } from '@/lib/auth-middleware';
import { authenticateStudentRequest as authStudent, StudentAuthContext } from '@/lib/student-auth';
import { NextResponse } from 'next/server';

export type UnifiedAuthContext = { type: 'portal'; data: AuthContext } | { type: 'student'; data: StudentAuthContext };

export async function authenticateUnified(req: Request): Promise<UnifiedAuthContext | NextResponse> {
  const isPortalStr = req.headers.get('x-portal-request');
  if (isPortalStr === 'true') {
     const res = await authPortal(req);
     if (res instanceof NextResponse) return res;
     return { type: 'portal', data: res as AuthContext };
  }
  // Try student first
  const studentRes = await authStudent(req);
  if (!(studentRes instanceof NextResponse)) {
    return { type: 'student', data: studentRes };
  }
  const portalRes = await authPortal(req);
  if (!(portalRes instanceof NextResponse)) {
    return { type: 'portal', data: portalRes as AuthContext };
  }
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
