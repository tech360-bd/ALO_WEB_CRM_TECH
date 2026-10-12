import type { AuthContext } from '@/lib/auth-middleware';
import type { Prisma } from '@prisma/client';

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'assigned', 'converted', 'lost'] as const;
export const LEAD_VIEWS = [...LEAD_STAGES, 'hot'] as const;

/** MarketingLead.createdById references User, not PortalUser. Never authorize
 * by matching IDs/emails across these two namespaces or by counselorId (no FK).
 * All PortalUser access fails closed until a verified mapping exists.
 * Non-admin team/branch access also awaits a verified ownership mapping.
 */
export function leadAccess(auth: AuthContext): { admin: boolean; writable: boolean; where: Prisma.MarketingLeadWhereInput } | null {
  const type = auth.userType.toUpperCase();
  const admin = ['ADMIN', 'SUPER_ADMIN'].includes(type);
  if (!auth.userId || auth.identityDomain !== 'user') return null;
  if (admin) return { admin, writable: true, where: {} };
  if (!['MARKETING', 'MARKETING_STAFF', 'MARKETING_MANAGER', 'EMPLOYEE', 'STAFF', 'COUNSELOR', 'SENIOR_COUNSELOR'].includes(type)) return null;
  const marketing = ['MARKETING', 'MARKETING_STAFF', 'MARKETING_MANAGER'].includes(type);
  const permitted = ['s8', 'student.leads.view_assigned'].some(p => auth.permissions.includes(p));
  if (!marketing && !permitted) return null;
  return { admin: false, writable: marketing || auth.permissions.some(p => ['s9', 'student.leads.create'].includes(p)), where: { createdById: auth.userId } };
}

export function boundedPage(raw: string | null, fallback: number, max: number): number {
  if (!raw || !/^\d+$/.test(raw)) return fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? Math.max(1, Math.min(max, value)) : fallback;
}

/** Hot is a priority flag, not a stage, and never hides terminal outcomes. */
export function leadViewWhere(view: string): Prisma.MarketingLeadWhereInput {
  if (view === 'hot') return { OR: [{ hotLead: true }, { status: 'hot' }], status: { notIn: ['converted', 'lost'] } };
  return view ? { status: view } : {};
}

export { mutationOriginAllowed as leadMutationOriginAllowed } from '@/lib/request-origin';

/** Legacy dashboards mix lead PII with unscoped student/finance records. */
export function canReadLegacyLeadDashboard(auth: AuthContext): boolean {
  return Boolean(leadAccess(auth)?.admin);
}
