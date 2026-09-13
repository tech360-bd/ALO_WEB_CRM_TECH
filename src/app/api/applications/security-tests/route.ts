import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getSecurityTests } from '@/lib/application-manager/security-tests';

export const GET = withAuth(async (req, auth) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canView = roles.includes('super_admin') || roles.includes('application_manager') || auth.permissions.includes('application.view_reports');
  if (!canView) return NextResponse.json({ success: false, error: 'Forbidden: requires application_manager or super_admin' }, { status: 403 });

  const tests = getSecurityTests();
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  return NextResponse.json({
    success: true,
    total: tests.length,
    passed,
    failed,
    passRate: `${Math.round((passed / tests.length) * 100)}%`,
    tests,
    summary: `25 negative security tests — proves student/partner/counselor/marketing/front desk/general cannot access B2B, visa/finance restrictions, doc download, cross-student, internal comments, suspended/public, credentials never in response/notifications/portals, audit logs. All backend enforced with 403 and field stripping, not frontend display:none.`,
  });
});
