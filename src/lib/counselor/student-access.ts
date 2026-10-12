import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import type { Prisma } from '@prisma/client';
import { safeStudentSelect } from '@/lib/student/public-profile';
export { safeStudentSelect } from '@/lib/student/public-profile';
import { canViewUccB2B } from '@/lib/ucc/document-access';

/** Student.counselorId is a User ID, never an inferred PortalUser identity. */
export async function requireCanonicalCounselor(request: Request) {
  // authenticateRequest re-loads the current User/status for NextAuth sessions.
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!auth.userId || auth.identityDomain !== 'user' || !['ADMIN','SUPER_ADMIN','COUNSELOR','BRANCH_MANAGER'].includes(auth.userType.toUpperCase())) {
    return NextResponse.json({ error: 'Canonical User counselor access required.' }, { status: 403 });
  }
  return auth;
}
export function counselorStudentScope(auth: AuthContext): Prisma.StudentWhereInput {
  return ['ADMIN','SUPER_ADMIN'].includes(auth.userType.toUpperCase()) ? {} : { counselorId: auth.userId };
}
export async function visibleCounselorStudent(tx: Prisma.TransactionClient, auth: AuthContext, id: string) {
  const student = await tx.student.findFirst({ where: { AND: [{ id }, counselorStudentScope(auth)] }, select: safeStudentSelect });
  if (!student) return null;
  // Student-wide detail contains communications/notes that cannot be reliably
  // separated by application. Hide the whole record without B2B permission.
  if (!canViewUccB2B(auth) && await tx.application.findFirst({ where: { studentId:id, isB2bConfidential:true }, select: { id:true } })) return null;
  return student;
}
