import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewField, logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

async function getAdminEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context!.params;
    const viewerId = auth.userId;

    const emp = await db.employee.findUnique({ where: { id } });
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const user = viewerId ? await db.user.findUnique({ where: { id: viewerId } }) : null;
    const viewerRoles = user ? [user.role] : [];

    // Enforce field-level security for salary
    const canViewSalary = await canViewField(viewerId, viewerRoles, 'salary', emp.id);
    const canViewNid = await canViewField(viewerId, viewerRoles, 'nid', emp.id);

    const hrProfile = await db.employeeHRProfile.findUnique({ where: { employeeId: emp.id } });
    const salary = canViewSalary ? await db.employeeSalary.findFirst({ where: { employeeId: emp.id } }) : null;

    return NextResponse.json({
      employee: emp,
      hrProfile: hrProfile
        ? {
            ...hrProfile,
            nidNumber: canViewNid ? hrProfile.nidNumber : '********',
            bankAccount: canViewSalary ? hrProfile.bankAccount : '********',
          }
        : null,
      salary: canViewSalary ? salary : null,
      fieldPermissions: {
        canViewSalary,
        canViewNid,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error fetching employee' }, { status: 500 });
  }
}

async function updateAdminEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context!.params;
    const body = await req.json();
    const { status, designation, department, role, branch } = body;

    const access = await validateRequestAccess({ userId: auth.userId }, 'employees', 'update');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
    }

    const oldEmp = await db.employee.findUnique({ where: { id } });
    if (!oldEmp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const updated = await db.employee.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(designation && { designation }),
        ...(department && { department }),
        ...(role && { role }),
        ...(branch && { branch }),
      },
    });

    // Log security audit
    await logSecurityAudit({
      actorId: auth.userId,
      actorRole: 'Admin',
      action: status ? `EMPLOYEE_STATUS_CHANGED_${status.toUpperCase()}` : 'EMPLOYEE_PROFILE_UPDATED',
      targetType: 'Employee',
      targetId: id,
      oldValue: JSON.stringify({ status: oldEmp.status, role: oldEmp.role }),
      newValue: JSON.stringify({ status: updated.status, role: updated.role }),
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error updating employee' }, { status: 500 });
  }
}

export const GET = withAuth(getAdminEmployee, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'] });
export const PATCH = withAuth(updateAdminEmployee, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'] });
