import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// Simple key-value settings stored in PortalAuditLog as system config
// Using a dedicated approach: settings stored in a generic model or as system entries

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      // Return system configuration summary
      const [userCount, roleCount, studentCount, employeeCount, partnerCount] = await Promise.all([
        db.portalUser.count(),
        db.portalRole.count(),
        db.portalStudentProfile.count(),
        db.employeeProfile.count(),
        db.partnerProfile.count(),
      ]);

      const settings = {
        systemInfo: {
          totalUsers: userCount,
          totalRoles: roleCount,
          totalStudents: studentCount,
          totalEmployees: employeeCount,
          totalPartners: partnerCount,
        },
        brandColors: {
          primary: '#0B5ED7',
          cta: '#F97316',
        },
        features: {
          whatsappIntegration: 'configured',
          emailIntegration: 'pending_smtp_setup',
          smsIntegration: 'pending_gateway_setup',
        },
      };

      return NextResponse.json({ success: true, data: settings });
    } catch (error) {
      console.error('Settings API error:', error);
      return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { key, value } = body;

      if (!key || value === undefined) {
        return NextResponse.json({ success: false, error: 'Key and value are required' }, { status: 400 });
      }

      await logAuditAction(auth, 'update_settings', 'SystemSettings', '', { key, value });

      return NextResponse.json({ success: true, data: { key, value }, message: 'Settings updated' });
    } catch (error) {
      console.error('Settings PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
    }
  })(request);
}
