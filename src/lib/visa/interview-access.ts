import type { AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { hasVisaPermission, isVisaSuperAdmin, visaCaseViewScope } from '@/lib/visa/access';

export type VisaInterviewAccess =
  | { ok: true; interview: any; visaCase: any }
  | { ok: false; status: 403 | 404; error: string };

export async function loadAuthorizedVisaInterview(auth: AuthContext, interviewId: string, permission: string): Promise<VisaInterviewAccess> {
  if (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, permission)) {
    return { ok: false, status: 403, error: `${permission} permission required.` };
  }
  const interview = await db.visaInterview.findUnique({ where: { id: interviewId } });
  if (!interview) return { ok: false, status: 404, error: 'Visa interview not found.' };
  const visaCase = await db.visaCase.findUnique({ where: { id: interview.caseId }, select: { id: true, studentId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
  if (!visaCase) return { ok: false, status: 404, error: 'Visa case not found.' };
  if (visaCase.studentId !== interview.studentId || visaCaseViewScope(auth, visaCase) !== 'full') {
    return { ok: false, status: 403, error: 'Interview is outside this account’s assigned visa-case scope.' };
  }
  return { ok: true, interview, visaCase };
}
