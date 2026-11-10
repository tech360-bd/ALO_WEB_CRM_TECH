import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Read-only B2B manager overview. All values are real database record counts,
 * NOT partnership performance metrics or fabricated conversions.
 *
 * Deliberately restricted to canonical administrators until the employee
 * partnership-manager permission has been mapped and independently tested.
 * Partner tenants and Acting-As sessions must not receive global counts.
 */
export const GET = withAuth(async (_request, auth) => {
  if (auth.identityDomain !== 'user' || auth.actingAsSessionId) {
    return NextResponse.json({ success: false, error: 'Canonical administrator session required' }, { status: 403 });
  }
  try {
    const [universityRecords, marketingLeadRecords, applicationRecords, studentProfileRecords] = await Promise.all([
      db.crmUniversity.count(),
      db.marketingLead.count(),
      db.portalStudentApplication.count(),
      db.portalStudentProfile.count(),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        metrics: [
          { id: 'universities', label: 'CRM university records', value: universityRecords, description: 'CrmUniversity records; not verified partnerships' },
          { id: 'leads', label: 'Marketing lead records', value: marketingLeadRecords, description: 'All MarketingLead records; not B2B referrals' },
          { id: 'applications', label: 'Student application records', value: applicationRecords, description: 'All PortalStudentApplication records; not B2B-attributed applications' },
          { id: 'profiles', label: 'Student profile records', value: studentProfileRecords, description: 'All PortalStudentProfile records; not enrollments' },
        ],
        unavailable: [
          'Verified international recruitment officers',
          'Approved university partnership agreements',
          'B2B-attributed referrals and conversions',
          'Outreach delivery and response rates',
          'Agency onboarding and commission reconciliation',
          'Communication SLA and escalation performance',
        ],
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'B2B overview unavailable' }, { status: 500 });
  }
}, { requireRoles: ['ADMIN', 'SUPER_ADMIN'] });
