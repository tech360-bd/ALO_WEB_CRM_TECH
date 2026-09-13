import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const packages = await (db as any).permissionPackage.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []);
    const partnerPackages = await db.partnerPackage.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      employeePackages: packages,
      partnerPackages,
      examples: ['COUNSELOR_STANDARD','COUNSELOR_SENIOR','APPLICATION_MANAGER','FINANCE_RESTRICTED','VISA_OFFICER','MARKETING_STANDARD','HR_STANDARD'],
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

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { name, description, permissions, isSystem } = body;
    if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });

    const pkg = await (db as any).permissionPackage.create({
      data: {
        name,
        description: description || '',
        permissions: JSON.stringify(permissions || []),
        isSystem: isSystem || false,
      },
    });

    await logAuditAction(auth, 'PERMISSION_PACKAGE_CREATED', 'PermissionPackage', pkg.id, { name });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
