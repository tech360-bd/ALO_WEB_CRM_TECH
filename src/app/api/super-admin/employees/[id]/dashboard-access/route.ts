// GET /api/super-admin/employees/{id}/dashboard-access
//
// Answers "which employee dashboards can this person reach, and does it match
// the role we think they have?". It reads the real portal navigation registry
// (`getNavForRole`) so the answer reflects the shipped product rather than a
// hand-maintained list.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { notFound, unavailable } from '@/lib/super-admin/http';
import { getNavForRole } from '@/lib/portal-nav';

export const dynamic = 'force-dynamic';

/** The employee dashboards the specification enumerates. */
const DASHBOARD_TARGETS = [
  { key: 'COUNSELOR', label: 'Counselor Dashboard' },
  { key: 'SENIOR_COUNSELOR', label: 'Senior Counselor Dashboard' },
  { key: 'MARKETING_MANAGER', label: 'Marketing Manager Dashboard' },
  { key: 'MARKETING', label: 'Marketing Dashboard' },
  { key: 'VISA_OFFICER', label: 'Visa Officer Dashboard' },
  { key: 'VISA_INTERVIEW_OFFICER', label: 'Visa Interview Officer Dashboard' },
  { key: 'APPLICATION_TEAM', label: 'Application Team Dashboard' },
  { key: 'FINANCE', label: 'Finance Dashboard' },
  { key: 'HR_MANAGER', label: 'HR Dashboard' },
  { key: 'SUPPORT_STAFF', label: 'Support Dashboard' },
  { key: 'FRONT_DESK', label: 'Front Desk Dashboard' },
  { key: 'BRANCH_MANAGER', label: 'Branch Manager Dashboard' },
  { key: 'ADMIN', label: 'Admin Dashboard' },
] as const;

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return notFound('Employee not found.');

    const user = await db.portalUser.findUnique({
      where: { id: employee.userId },
      select: {
        userType: true,
        status: true,
        roles: { select: { role: { select: { name: true, label: true } } } },
      },
    });

    const roleNames = user?.roles.map((row) => row.role.name) || [];
    const primaryRole = (roleNames[0] || employee.role || 'COUNSELOR').toUpperCase();

    let navGroups: unknown[] = [];
    try {
      navGroups = getNavForRole(primaryRole);
    } catch {
      navGroups = [];
    }

    const navItemCount = (navGroups as Array<{ items?: unknown[] }>).reduce(
      (sum, group) => sum + (Array.isArray(group.items) ? group.items.length : 0),
      0,
    );

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeCode: employee.employeeId,
        name: employee.name,
        role: employee.role,
        roles: roleNames,
        userType: user?.userType || null,
        status: employee.status,
        accountStatus: user?.status || null,
      },
      dashboardAccess: {
        primaryRole,
        navigationGroups: (navGroups as Array<{ title?: string }>).map((group) => group.title || ''),
        navigationItemCount: navItemCount,
        // The dashboards this employee can be launched into via Acting-As.
        launchableDashboards: DASHBOARD_TARGETS.map((target) => ({
          ...target,
          matchesCurrentRole: roleNames.some((name) => name.toUpperCase() === target.key)
            || employee.role.toUpperCase() === target.key,
        })),
      },
      notes: [
        'launchableDashboards lists the dashboards a Super Admin may open via Acting-As; it is not a claim that the employee themself holds every one of these roles.',
        'matchesCurrentRole marks the dashboards implied by this employee’s actual assigned roles.',
      ],
    });
  } catch (error) {
    return unavailable('super-admin/employees/{id}/dashboard-access', error);
  }
}

export const GET = withAuth(handleGet);
