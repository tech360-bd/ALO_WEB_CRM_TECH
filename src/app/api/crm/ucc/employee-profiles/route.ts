// ============================================================
// /api/crm/ucc/employee-profiles
// GET  — Fetch employee communication profiles (scoped by role)
// POST — Create or update employee communication profile (ADMIN+)
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'];

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    // Non-managers can only view their own profile
    if (!MANAGER_ROLES.includes(primaryRole)) {
      const profile = await db.employeeCommunicationProfile.findUnique({
        where: { employeeId: auth.userId },
      });
      return NextResponse.json({ success: true, profiles: profile ? [profile] : [] });
    }

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const profiles = await db.employeeCommunicationProfile.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!ADMIN_ROLES.includes(primaryRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — only ADMIN and SUPER_ADMIN can manage employee communication profiles.' },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      employeeId: string;
      employeeName: string;
      officialEmail?: string;
      officialPhone?: string;
      whatsappAccess?: boolean;
      facebookAccess?: boolean;
      instagramAccess?: boolean;
      emailAccess?: boolean;
      assignedBranch?: string;
      assignedDepartments?: string[];
      channelPermissions?: Record<string, boolean>;
      workingHoursStart?: string;
      workingHoursEnd?: string;
      supervisorId?: string;
      countrySpecialization?: string[];
    };

    if (!body.employeeId || !body.employeeName) {
      return NextResponse.json(
        { success: false, error: 'employeeId and employeeName are required.' },
        { status: 400 }
      );
    }

    const profileData = {
      employeeName: body.employeeName,
      officialEmail: body.officialEmail || '',
      officialPhone: body.officialPhone || '',
      whatsappAccess: body.whatsappAccess ?? false,
      facebookAccess: body.facebookAccess ?? false,
      instagramAccess: body.instagramAccess ?? false,
      emailAccess: body.emailAccess ?? false,
      assignedBranch: body.assignedBranch || '',
      assignedDepartments: JSON.stringify(body.assignedDepartments || []),
      channelPermissions: JSON.stringify(body.channelPermissions || {}),
      workingHoursStart: body.workingHoursStart || '10:00',
      workingHoursEnd: body.workingHoursEnd || '18:00',
      supervisorId: body.supervisorId || '',
      countrySpecialization: JSON.stringify(body.countrySpecialization || []),
    };

    const profile = await db.employeeCommunicationProfile.upsert({
      where: { employeeId: body.employeeId },
      update: profileData,
      create: { employeeId: body.employeeId, ...profileData },
    });

    await logAuditAction(auth, 'EMPLOYEE_COMM_PROFILE_UPDATED', 'EmployeeCommunicationProfile', profile.id, {
      employeeId: body.employeeId,
      channelAccess: {
        whatsapp: body.whatsappAccess,
        facebook: body.facebookAccess,
        instagram: body.instagramAccess,
        email: body.emailAccess,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
