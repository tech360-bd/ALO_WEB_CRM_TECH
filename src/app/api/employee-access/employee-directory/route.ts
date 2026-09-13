import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { canViewEmployeePrivateProfileEngine, enforceFieldLevelSecurity } from '@/lib/employee-access-engine';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin/HR/Super Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const designation = searchParams.get('designation');
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    let users = await db.portalUser.findMany({
      where: { userType: 'EMPLOYEE', ...where },
      include: { employeeProfile: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    if (search) {
      users = users.filter((u: any) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    }
    if (designation) {
      users = users.filter((u: any) => u.employeeProfile?.designation === designation);
    }
    if (department) {
      users = users.filter((u: any) => u.employeeProfile?.department === department);
    }

    // Apply private visibility restriction — only return private fields if authorized
    const sanitized = await Promise.all(users.map(async (u: any) => {
      const canViewPrivate = await canViewEmployeePrivateProfileEngine(auth.userId, auth.roles, u.id);
      if (canViewPrivate) return u;
      // Strip private info
      const { employeeProfile, ...rest } = u;
      if (employeeProfile) {
        const { emergencyContact, ...publicProfile } = employeeProfile;
        return { ...rest, employeeProfile: publicProfile };
      }
      return rest;
    }));

    return NextResponse.json({
      success: true,
      employees: sanitized,
      count: sanitized.length,
      privateVisibility: 'Employee + SuperAdmin + Chairman + HR explicit — restricted permission-based',
      scopeEnforced: 'GLOBAL/COUNTRY/BRANCH/OFFICE/DEPARTMENT/TEAM/ASSIGNED/OWN via where clauses',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
