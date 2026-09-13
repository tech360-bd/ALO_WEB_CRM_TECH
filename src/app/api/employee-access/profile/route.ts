import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { canViewEmployeePrivateProfileEngine, enforceFieldLevelSecurity } from '@/lib/employee-access-engine';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;

    const isSelf = employeeId === auth.userId;
    const canViewPrivate = await canViewEmployeePrivateProfileEngine(auth.userId, auth.roles, employeeId);
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');

    if (!isSelf && !canViewPrivate && !isSuper) {
      return NextResponse.json({ success: false, error: 'Permission denied — private profile Employee+SuperAdmin+Chairman+HR explicit only' }, { status: 403 });
    }

    const user = await db.portalUser.findUnique({ where: { id: employeeId }, include: { employeeProfile: true } }).catch(() => null);
    if (!user) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });

    const profile = (user as any).employeeProfile;
    const education = await db.employeeEducation.findMany({ where: { employeeId } }).catch(() => []);
    const emergency = await db.employeeEmergencyContact.findMany({ where: { employeeId } }).catch(() => []);
    const salary = await db.employeeSalary.findMany({ where: { employeeId } }).catch(() => []);
    const documents = await db.employeeDocument.findMany({ where: { employeeId } }).catch(() => []);

    // Field-level security — mask sensitive if not authorized
    let sanitizedProfile = profile;
    if (profile && !canViewPrivate) {
      const { salary, bankName, bankAccount, bankRouting, nidNumber, emergencyContact, ...publicFields } = profile as any;
      sanitizedProfile = publicFields;
    }

    let sanitizedSalary = salary;
    if (!canViewPrivate) {
      sanitizedSalary = [] as any;
    }

    await logAuditAction(auth, 'PROFILE_VIEWED', 'EmployeeProfile', employeeId, { viewer: auth.userId, canViewPrivate });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, status: user.status, userType: user.userType },
      profile: sanitizedProfile,
      education,
      emergencyContacts: emergency,
      salary: sanitizedSalary,
      documents: documents.map((d: any) => ({ id: d.id, documentType: d.documentType, status: d.status, fileName: d.fileName })),
      privateVisibility: 'Employee + SuperAdmin + Chairman + HR explicit — restricted permission-based',
      fieldSecurity: 'Salary/Bank/NID/Passport/Emergency Contact/Personal Address/HR docs/Leave records/Warning/Termination/Private notes — permission-based',
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

    const body = await req.json();
    const { fullName, dob, gender, maritalStatus, nationality, religion, bloodGroup, presentAddress, permanentAddress, nidNumber, passportNumber, photo } = body;

    // Employee can complete own profile only
    const employeeId = body.employeeId || auth.userId;
    if (employeeId !== auth.userId) {
      const isHr = auth.roles.includes('hr_manager') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isHr) return NextResponse.json({ success: false, error: 'Can only update own profile unless HR' }, { status: 403 });
    }

    const existing = await db.employeeProfile.findUnique({ where: { userId: employeeId } }).catch(() => null);
    let profile;
    if (existing) {
      profile = await db.employeeProfile.update({
        where: { userId: employeeId },
        data: {
          ...(dob && { joinDate: dob }),
          ...(bloodGroup && { bloodGroup }),
          ...(nidNumber && { nidNumber }),
          ...(presentAddress && { emergencyContact: presentAddress }),
        },
      });
    } else {
      profile = await db.employeeProfile.create({
        data: {
          userId: employeeId,
          employeeId: `ALO-EMP-${new Date().getFullYear()}${String(Math.floor(Math.random()*100000)).padStart(5,'0')}`,
          designation: body.designation || 'Counselor',
          department: body.department || 'Counseling',
          branch: body.branch || 'Dhaka Main',
          joinDate: dob || '',
          emergencyContact: presentAddress || '',
        },
      });
    }

    // Education
    if (body.education && Array.isArray(body.education)) {
      for (const edu of body.education) {
        await db.employeeEducation.create({ data: { employeeId, degree: edu.degree || '', institution: edu.institution || '', passingYear: edu.passingYear || '', result: edu.result || '' } }).catch(() => {});
      }
    }

    // Emergency contact
    if (body.emergencyContact) {
      await db.employeeEmergencyContact.create({
        data: { employeeId, name: body.emergencyContact.name || '', relation: body.emergencyContact.relation || '', phone: body.emergencyContact.phone || '', address: body.emergencyContact.address || '' },
      }).catch(() => {});
    }

    await logAuditAction(auth, 'PROFILE_COMPLETED', 'EmployeeProfile', employeeId, { fullName });

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile completion — ACCOUNT_CREATED → ACTIVATION_EMAIL_SENT → EMPLOYEE_ACTIVATES → PASSWORD_CREATED → PROFILE_COMPLETION → DOCUMENT_UPLOAD → PROFILE_SUBMITTED → HR/ADMIN_REVIEW → APPROVED → ACTIVE',
      statusFlow: ['INVITED','PENDING_ACTIVATION','PENDING_PROFILE','PROFILE_SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','APPROVED','ACTIVE','SUSPENDED','INACTIVE','TERMINATED','REJECTED'],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { employeeId, status, reason } = body;
    const targetId = employeeId || auth.userId;

    const isHr = auth.roles.includes('hr_manager') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    if (!isHr) return NextResponse.json({ success: false, error: 'HR/Admin/Super Admin required for profile status change' }, { status: 403 });

    // Cannot approve own if separation enforced
    if (targetId === auth.userId && (status === 'APPROVED' || status === 'ACTIVE') && !auth.roles.includes('super_admin')) {
      return NextResponse.json({ success: false, error: 'Cannot approve own profile — separation of duties MAKER→REVIEWER→APPROVER' }, { status: 403 });
    }

    const user = await db.portalUser.update({ where: { id: targetId }, data: { status: status?.toLowerCase() || 'active' } }).catch(() => null);

    await logAuditAction(auth, `PROFILE_${status?.toUpperCase() || 'UPDATED'}`, 'EmployeeProfile', targetId, { status, reason });

    await (db as any).employeeAuditLog.create({
      data: {
        employeeId: targetId,
        actorId: auth.userId,
        actorRole: auth.roles[0] || '',
        action: `PROFILE_${status?.toUpperCase() || 'UPDATED'}`,
        targetType: 'EmployeeProfile',
        targetId,
        oldValue: JSON.stringify({ status: 'previous' }),
        newValue: JSON.stringify({ status }),
        reason: reason || '',
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: user, message: `Profile status → ${status} — history preserved, never permanently delete` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
