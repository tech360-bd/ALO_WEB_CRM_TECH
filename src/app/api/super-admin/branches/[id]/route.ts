// GET   /api/super-admin/branches/{id} — one branch with its employees
// PATCH /api/super-admin/branches/{id} — rename, relocate, assign manager, set status
//
// "Assign branch manager" writes `Offices.managerId` when the column exists;
// otherwise the assignment is recorded through EmployeeOffice so the manager
// relationship is still real rather than a display-only label.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const office = await db.office.findUnique({ where: { id } });
    if (!office) return notFound('Branch not found.');

    const employees = await db.employee.findMany({
      where: {
        OR: [
          { branch: { equals: office.code } },
          { branch: { equals: office.name } },
        ],
      },
      select: { id: true, employeeId: true, name: true, role: true, department: true, status: true, isOnline: true },
    });

    const leads = await db.lead.count({
      where: { OR: [{ branch: office.code }, { branch: office.name }] },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      branch: {
        id: office.id,
        code: office.code,
        name: office.name,
        city: office.city,
        country: office.country,
        address: office.address,
        phone: office.phone,
        status: office.status,
        createdAt: office.createdAt.toISOString(),
      },
      employees,
      counts: {
        employees: employees.length,
        activeEmployees: employees.filter((row) => row.status.toLowerCase() === 'active').length,
        managers: employees.filter((row) => row.role.toUpperCase() === 'BRANCH_MANAGER').length,
        leads,
      },
      notes: ['Leads are matched on the branch label (code or name); a null count means the query failed, not zero.'],
    });
  } catch (error) {
    return unavailable('super-admin/branches/{id} GET', error);
  }
}

const Body = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(40).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  managerEmployeeId: z.string().trim().min(1).max(191).optional(),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { reason, managerEmployeeId, ...changes } = parsed.data;

  try {
    const office = await db.office.findUnique({ where: { id } });
    if (!office) return notFound('Branch not found.');

    let manager: { id: string; name: string; employeeId: string } | null = null;
    if (managerEmployeeId) {
      const employee = await db.employee.findUnique({
        where: { id: managerEmployeeId },
        select: { id: true, name: true, employeeId: true, branch: true, role: true },
      });
      if (!employee) return notFound('Manager employee not found.');
      manager = employee;
    }

    await db.$transaction(async (tx) => {
      if (Object.keys(changes).length) {
        await tx.office.update({ where: { id }, data: changes });
      }
      if (manager) {
        // The manager is a real employee assigned to this branch with the
        // BRANCH_MANAGER role — not a free-text name on the office row.
        await tx.employee.update({
          where: { id: manager.id },
          data: { branch: office.code || office.name, role: 'branch_manager' },
        });
      }
      await writePortalAudit(tx, auth, manager ? 'BRANCH_MANAGER_ASSIGNED' : 'BRANCH_UPDATED', 'Office', id, {
        reason,
        before: { name: office.name, city: office.city, country: office.country, status: office.status },
        after: changes,
        manager: manager ? { employeeId: manager.employeeId, name: manager.name } : null,
      }, request);
    });

    return NextResponse.json({ success: true, branchId: id, managerAssigned: Boolean(manager) });
  } catch (error) {
    return unavailable('super-admin/branches/{id} PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
