/**
 * Shared contact-registry data scope.
 *
 * Extracted verbatim from `/api/whatsapp/contacts` so the Company Contact Hub
 * (`/crm/contacts`) and the existing WhatsApp contact API enforce exactly the
 * same branch / assignment / partner isolation. A hidden UI link is not a
 * security control; every read must carry this `where` fragment.
 */

import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { getScopeForAuth } from '@/lib/data-scope';

export function hasCompanyWideContactAccess(auth: { roles: string[]; permissions: string[] }): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return roles.includes('super_admin')
    || (auth.permissions.includes('ad2') && auth.permissions.includes('contacts.view'))
    || auth.permissions.includes('data.view_all');
}

/**
 * Build a Prisma `where` fragment restricting the caller to the rows they may
 * see. Deny-by-default: an unscoped identity gets an impossible id predicate.
 */
export async function contactScopeWhere(auth: AuthContext): Promise<Record<string, unknown>> {
  if (hasCompanyWideContactAccess(auth)) return {};
  if (auth.partnerId && auth.roles.some((role) => role.toLowerCase().includes('partner'))) {
    return { partnerId: auth.partnerId };
  }

  const scope = getScopeForAuth(auth);
  if (scope === 'ASSIGNED') {
    const [students, leads] = await Promise.all([
      db.student.findMany({ where: { counselorId: auth.userId }, select: { id: true }, take: 5000 }),
      db.lead.findMany({ where: { counselorId: auth.userId }, select: { id: true }, take: 5000 }),
    ]);
    const linked: Record<string, unknown>[] = [{ assignedCounselorId: auth.userId }];
    if (students.length) linked.push({ studentId: { in: students.map((row) => row.id) } });
    if (leads.length) linked.push({ leadId: { in: leads.map((row) => row.id) } });
    return { OR: linked };
  }

  if (scope === 'BRANCH' && auth.branch) {
    const employees = await db.employee.findMany({
      where: { branch: auth.branch, status: 'active' },
      select: { userId: true },
      take: 2000,
    });
    const counselorIds = [...new Set([auth.userId, ...employees.map((employee) => employee.userId)])];
    const [students, leads] = await Promise.all([
      db.student.findMany({ where: { counselorId: { in: counselorIds } }, select: { id: true }, take: 5000 }),
      db.lead.findMany({ where: { OR: [
        { branch: auth.branch },
        { counselorId: { in: counselorIds } },
      ] }, select: { id: true }, take: 5000 }),
    ]);
    const linked: Record<string, unknown>[] = [
      { branch: auth.branch },
      { assignedCounselorId: { in: counselorIds } },
    ];
    if (students.length) linked.push({ studentId: { in: students.map((row) => row.id) } });
    if (leads.length) linked.push({ leadId: { in: leads.map((row) => row.id) } });
    return { OR: linked };
  }

  return { id: '__NO_CONTACT_SCOPE__' };
}

/**
 * Merge a caller-supplied search filter with the scope fragment without ever
 * letting a broad `OR` search bypass the branch/assignment restriction.
 */
export function combineContactScopeAndSearch(
  scope: Record<string, unknown>,
  searchOr: Array<Record<string, unknown>>,
): Record<string, unknown> {
  if ('OR' in scope) {
    return { AND: [scope, { OR: searchOr }] };
  }
  return { ...scope, OR: searchOr };
}
