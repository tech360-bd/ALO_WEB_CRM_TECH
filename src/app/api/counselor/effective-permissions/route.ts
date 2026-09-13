import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    // Effective permissions = role permissions + user overrides
    const userRoles = await (db as any).userRole.findMany({ where: { userId: auth.userId } }).catch(() => []);
    const roleIds = userRoles.map((r: any) => r.roleId);
    const rolePerms = await (db as any).rolePermission.findMany({ where: { roleId: { in: roleIds } } }).catch(() => []);

    const portalUser = await (db as any).portalUser.findUnique({ where: { id: auth.userId } }).catch(() => null);
    const portalRoles = portalUser ? await (db as any).portalUserRole.findMany({ where: { userId: auth.userId } }).catch(() => []) : [];
    const portalRoleIds = portalRoles.map((r: any) => r.roleId);
    const portalPerms = await (db as any).portalRolePermission.findMany({ where: { roleId: { in: portalRoleIds } } }).catch(() => []);

    const allPerms = await db.permission.findMany().catch(() => []);
    const portalAllPerms = await (db as any).portalPermission.findMany().catch(() => []);

    // Build effective map
    const effective: Record<string, boolean> = {};
    for (const perm of [...rolePerms, ...portalPerms]) {
      effective[perm.permissionId] = perm.granted;
    }

    // Counselor privacy rules per spec sec 19 security
    const privacyRules = {
      hideSalary: !effective['view_salary'] && !auth.roles.includes('super_admin'),
      hideCommission: !effective['view_commission'] && !auth.roles.includes('super_admin'),
      hideBonus: !effective['view_bonus'] && !auth.roles.includes('super_admin'),
      hideIncrement: !effective['view_increment'] && !auth.roles.includes('super_admin'),
      hidePassport: !effective['view_passport'] && !auth.roles.includes('super_admin'),
      hideRefusal: !effective['view_refusal'] && !auth.roles.includes('super_admin'),
      hideFinancial: !auth.roles.includes('finance') && !auth.roles.includes('super_admin'),
      blurSensitive: true,
      pinRequired: true,
      auditReveal: true,
      privacyModeOn: true,
    };

    return NextResponse.json({
      success: true,
      userId: auth.userId,
      roles: auth.roles,
      userRoles,
      portalRoles,
      effectivePermissions: effective,
      allPermissions: [...allPerms, ...portalAllPerms],
      privacyRules,
      visibilityLevels: ['student_visible', 'internal_only', 'application_team_only', 'visa_team_only', 'finance_only', 'super_admin_only', 'partner_visible', 'counselor_visible', 'own', 'assigned', 'all'],
      note: 'Granular permission matrix tick-box UI: view/create/update/approve/export/download + visibility levels per spec sec 18-19',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
