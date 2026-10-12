import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import type { Prisma } from '@prisma/client';
import { normalizeCrmRole } from '@/lib/session-roles';

const STAFF_VISIBILITY: Record<string, string[]> = {
  COUNSELOR: ['counselor_visible'],
  APPLICATION_TEAM: ['application_team_visible'],
  APPLICATION_MANAGER: ['application_team_visible'],
  APPLICATION_OFFICER: ['application_team_visible'],
  VISA_OFFICER: ['visa_team_visible'],
  VISA_INTERVIEW_OFFICER: ['visa_team_visible'],
  FINANCE: ['finance_visible'],
  MARKETING: ['marketing_visible'],
  MARKETING_MANAGER: ['marketing_visible'],
  EMPLOYEE: [], ADMIN: [], BRANCH_MANAGER: [], HR_MANAGER: [],
  FRONT_DESK: [], SUPPORT_STAFF: [], DOCUMENT_OFFICER: [],
};
const NONE = { id: { in: [] as string[] } };

/** Scope is built from the current authenticated account and stored links only. */
export async function communicationScope(auth: AuthContext): Promise<{
  threads: Prisma.CommunicationThreadWhereInput;
  messages: Prisma.CommunicationMessageWhereInput;
  master: boolean;
  staff: boolean;
}> {
  const roles = new Set([auth.userType, ...auth.roles].map(role => normalizeCrmRole(role)));
  // A tenant user can never gain ALO-wide access from a partner role name.
  const student = auth.userType === 'STUDENT';
  const partner = auth.userType === 'PARTNER';
  const master = !student && !partner && roles.has('SUPER_ADMIN');
  if (master) return { threads: {}, messages: {}, master: true, staff: true };
  let owner: Prisma.CommunicationThreadWhereInput = NONE;
  let visibility: string[] = [];
  let staff = false;
  if (student) {
    const [profile, students] = await Promise.all([
      db.portalStudentProfile.findUnique({ where: { userId: auth.userId }, select: { studentId: true } }),
      db.student.findMany({ where: { userId: auth.userId }, select: { id: true, studentId: true } }),
    ]);
    const ids = [...new Set([profile?.studentId, ...students.flatMap(row => [row.id, row.studentId])].filter((id): id is string => !!id))];
    owner = { studentId: { in: ids } };
    visibility = ['public_safe', 'student_visible'];
  } else if (partner) {
    const profile = await db.partnerProfile.findUnique({ where: { userId: auth.userId }, select: { partnerId: true, approvalStatus: true } });
    if (profile?.partnerId && ['approved', 'active'].includes(profile.approvalStatus.toLowerCase())) owner = { partnerId: profile.partnerId };
    visibility = ['partner_visible'];
  } else {
    const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, status: true } });
    const known = [...roles].filter((role): role is string => !!role && role in STAFF_VISIBILITY);
    if (employee?.status.toLowerCase() === 'active' && known.length) {
      staff = true;
      owner = { assignedToId: { in: [auth.userId, employee.id] } };
      visibility = ['public_safe', 'student_visible', 'partner_visible', ...known.flatMap(role => STAFF_VISIBILITY[role])];
      if (known.some(role => !role.startsWith('MARKETING'))) visibility.push('internal_only');
      if (known.some(role => ['APPLICATION_TEAM', 'APPLICATION_MANAGER', 'APPLICATION_OFFICER'].includes(role)) &&
        auth.permissions.includes('communication.view_b2b_confidential')) visibility.push('b2b_confidential');
    }
  }
  const safe = { visibility: { in: [...new Set(visibility)] } };
  const b2b = visibility.includes('b2b_confidential') ? {} : { b2bProviderId: '' };
  const threads: Prisma.CommunicationThreadWhereInput = { AND: [owner, safe, b2b] };
  return {
    threads,
    messages: { AND: [{ thread: threads }, safe, b2b] },
    master: false,
    staff,
  };
}
