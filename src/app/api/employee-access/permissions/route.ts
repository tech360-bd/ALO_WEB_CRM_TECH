import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

// Granular permission matrix per spec
const PERMISSION_ACTIONS = ['VIEW','CREATE','EDIT','SUBMIT','ACCEPT','REJECT','APPROVE','VERIFY','SEND','DOWNLOAD','UPLOAD','EXPORT','ASSIGN','REASSIGN','ARCHIVE','CONFIGURE','MANAGE','ESCALATE','GENERATE','PUBLISH','DELETE'];
const MODULES = ['STUDENT','APPLICATION','DOCUMENT','VISA','FINANCE','HR','MARKETING','SOCIAL','WHATSAPP','EMAIL','PHONE','AI','REPORTS','EXPORT','ADMINISTRATION','PARTNER','B2B','INTERVIEW','COMMUNICATION','PAYROLL','ATTENDANCE','LEAVE','DEVICE','AGREEMENT'];

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin/Admin required' }, { status: 403 });

    const permissions = await db.permission.findMany().catch(() => []);
    const portalPerms = await (db as any).portalPermission.findMany().catch(() => []);
    const roles = await db.role.findMany().catch(() => []);
    const portalRoles = await (db as any).portalRole.findMany().catch(() => []);
    const packages = await (db as any).permissionPackage.findMany().catch(() => []);
    const featureRules = await (db as any).featureAccessRule.findMany({ take: 100 }).catch(() => []);

    return NextResponse.json({
      success: true,
      actions: PERMISSION_ACTIONS,
      modules: MODULES,
      permissions,
      portalPermissions: portalPerms,
      roles,
      portalRoles,
      packages,
      featureRules,
      separationOfDuties: 'MAKER → REVIEWER → APPROVER, same user cannot approve own restricted action',
      acceptanceVsApproval: 'ACCEPT = responsibility, APPROVE = authority, different permissions',
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
    const { module, feature, action, description, riskLevel, requiresApproval } = body;
    if (!module || !feature || !action) return NextResponse.json({ success: false, error: 'module, feature, action required' }, { status: 400 });

    const perm = await db.permission.create({
      data: { module, feature, action, description: description || '' },
    });

    await logAuditAction(auth, 'PERMISSION_CREATED', 'Permission', perm.id, { module, feature, action, riskLevel, requiresApproval });

    return NextResponse.json({ success: true, data: perm });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
