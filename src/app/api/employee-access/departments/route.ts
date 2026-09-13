import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const depts = await (db as any).employeeDepartment.findMany({ orderBy: { name: 'asc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      departments: depts,
      designations: ['Chairman','CEO','Director','Office Manager','Country Manager','Counselor','Senior Counselor','Application Manager','Application Team','Visa Officer','Finance','Marketing','Front Desk','HR','Support','Viewer','Custom'],
      scopeTypes: ['GLOBAL','COUNTRY','BRANCH','OFFICE','DEPARTMENT','TEAM','ASSIGNED','OWN'],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin/HR/Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { name, description, parentId, managerId } = body;
    if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });

    const dept = await (db as any).employeeDepartment.create({
      data: { name, description: description || '', parentId: parentId || null, managerId: managerId || null },
    });

    await logAuditAction(auth, 'DEPARTMENT_CREATED', 'EmployeeDepartment', dept.id, { name });

    return NextResponse.json({ success: true, data: dept });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
