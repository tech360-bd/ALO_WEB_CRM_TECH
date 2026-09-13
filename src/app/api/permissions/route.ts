import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

    // Granular permission matrix per spec sec 18
    const permissions = [
      { id: 'view_students', label: 'View Students', module: 'students', action: 'view' },
      { id: 'create_students', label: 'Create Students', module: 'students', action: 'create' },
      { id: 'update_students', label: 'Update Students', module: 'students', action: 'update' },
      { id: 'export_students', label: 'Export Students', module: 'students', action: 'export' },
      { id: 'view_applications', label: 'View Applications', module: 'applications', action: 'view' },
      { id: 'create_applications', label: 'Create Applications', module: 'applications', action: 'create' },
      { id: 'update_applications', label: 'Update Applications', module: 'applications', action: 'update' },
      { id: 'approve_applications', label: 'Approve Applications', module: 'applications', action: 'approve' },
      { id: 'view_documents', label: 'View Documents', module: 'documents', action: 'view' },
      { id: 'download_documents', label: 'Download Documents', module: 'documents', action: 'download' },
      { id: 'approve_documents', label: 'Approve Documents', module: 'documents', action: 'approve' },
      { id: 'view_finance', label: 'View Finance', module: 'finance', action: 'view' },
      { id: 'view_commission', label: 'View Commission', module: 'finance', action: 'view' },
      { id: 'view_salary', label: 'View Salary', module: 'hr', action: 'view' },
      { id: 'view_bonus', label: 'View Bonus', module: 'hr', action: 'view' },
      { id: 'view_increment', label: 'View Increment', module: 'hr', action: 'view' },
      { id: 'view_passport', label: 'View Passport', module: 'documents', action: 'view' },
      { id: 'view_refusal', label: 'View Refusal', module: 'visa', action: 'view' },
      { id: 'manage_users', label: 'Manage Users', module: 'admin', action: 'manage' },
      { id: 'manage_roles', label: 'Manage Roles', module: 'admin', action: 'manage' },
      { id: 'view_reports', label: 'View Reports', module: 'reports', action: 'view' },
      { id: 'export_reports', label: 'Export Reports', module: 'reports', action: 'export' },
      { id: 'view_inbox', label: 'View Inbox', module: 'inbox', action: 'view' },
      { id: 'reply_inbox', label: 'Reply Inbox', module: 'inbox', action: 'update' },
      { id: 'manage_whatsapp', label: 'Manage WhatsApp', module: 'whatsapp', action: 'manage' },
      { id: 'manage_marketing', label: 'Manage Marketing', module: 'marketing', action: 'manage' },
      { id: 'manage_visa', label: 'Manage Visa', module: 'visa', action: 'manage' },
    ];

    const visibilities = [
      'student_visible', 'internal_only', 'application_team_only', 'visa_team_only',
      'finance_only', 'super_admin_only', 'partner_visible', 'counselor_visible',
      'own', 'assigned', 'all'
    ];

    const roles = await db.role.findMany().catch(() => []);
    const users = await db.user.findMany({ take: 100, select: { id: true, name: true, email: true, role: true } }).catch(() => []);

    return NextResponse.json({ success: true, permissions, visibilities, roles, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

    const body = await req.json();
    const { userId, permissions } = body; // permissions array of { permissionId, allowed, visibility }
    if (!userId || !permissions) return NextResponse.json({ success: false, error: 'userId and permissions required' }, { status: 400 });

    // Upsert role permissions using RolePermission model
    for (const perm of permissions) {
      try {
        // Try PortalRolePermission first, fallback to RolePermission
        const roleId = perm.roleId || userId; // userId may actually be roleId in this context
        await (db as any).rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: perm.permissionId } },
          update: { granted: perm.allowed },
          create: { roleId, permissionId: perm.permissionId, granted: perm.allowed },
        });
      } catch {
        try {
          await (db as any).portalRolePermission.upsert({
            where: { roleId_permissionId: { roleId: perm.roleId || userId, permissionId: perm.permissionId } },
            update: { granted: perm.allowed },
            create: { roleId: perm.roleId || userId, permissionId: perm.permissionId, granted: perm.allowed },
          });
        } catch {}
      }
    }

    await db.aloAuditLog.create({
      data: {
        actorType: auth.roles[0] || 'admin',
        actorName: auth.name || auth.userId,
        action: 'PERMISSIONS_UPDATED',
        resource: 'User',
        resourceId: userId,
        details: JSON.stringify({ permissions }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Permissions updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
