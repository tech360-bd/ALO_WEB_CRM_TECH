import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { encryptSensitive } from '@/lib/hrms/encryption';
import { writePortalAudit } from '@/lib/transactional-audit';
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

    if (!canViewPrivate) {
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

    const canViewSalary = await enforceFieldLevelSecurity(auth.userId, auth.roles, 'salary', employeeId);
    if (sanitizedProfile && !canViewSalary) { const { salary, ...withoutSalary } = sanitizedProfile; sanitizedProfile = withoutSalary as typeof sanitizedProfile; }
    let sanitizedSalary = salary;
    if (!canViewSalary) {
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

    const employeeId = body.employeeId || auth.userId;
    const employee = await db.employee.findFirst({ where: { OR: [{ id: employeeId }, { userId: employeeId }] } });
    if (!employee?.userId) return NextResponse.json({ success: false, error: 'Provisioned employee required' }, { status: 404 });
    if (employee.userId !== auth.userId) {
      const access = await validateRequestAccess({ userId: auth.userId }, 'employee.profile.private', 'edit', { ownerId: employee.userId });
      if (!access.allowed) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }
    const existing = await db.employeeHR.findUnique({ where: { userId: employee.userId } });
    if (!existing) return NextResponse.json({ success: false, error: 'HR must provision the employment record first' }, { status: 409 });
    const allowed = ['fullName', 'dob', 'gender', 'maritalStatus', 'nationality', 'religion', 'bloodGroup', 'presentAddress', 'permanentAddress', 'nidNumber', 'passportNumber', 'photo'];
    const values = Object.fromEntries(allowed.filter(key => typeof body[key] === 'string').map(key => [key, body[key]]));
    const protectedValues = encryptSensitive(values);
    const profile = await db.$transaction(async tx => {
      const updated = await tx.employeeHR.update({ where: { userId: employee.userId! }, data: protectedValues });
      if (Array.isArray(body.education)) {
        for (const edu of body.education) await tx.employeeEducation.create({ data: { employeeId: employee.id, degree: String(edu.degree || ''), institution: String(edu.institution || ''), passingYear: String(edu.passingYear || ''), result: String(edu.result || '') } });
      }
      if (body.emergencyContact) await tx.employeeEmergencyContact.create({ data: { employeeId: employee.id, name: String(body.emergencyContact.name || ''), relation: String(body.emergencyContact.relation || ''), phone: String(body.emergencyContact.phone || ''), address: String(body.emergencyContact.address || '') } });
      await writePortalAudit(tx, auth, 'PROFILE_UPDATED', 'EmployeeHR', updated.id, { fields: Object.keys(values) }, req);
      return { id: updated.id, userId: updated.userId };
    });
    return NextResponse.json({ success: true, data: profile, message: 'Profile saved for review' });
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

    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.lifecycle', 'approve', { ownerId: targetId });
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Employee lifecycle approval permission required' }, { status: 403 });

    // Cannot approve own if separation enforced
    if (targetId === auth.userId && ['APPROVED', 'ACTIVE'].includes(String(status).toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Cannot approve own profile — separation of duties MAKER→REVIEWER→APPROVER' }, { status: 403 });
    }

    const nextStatus = String(status || '').toLowerCase();
    if (!['suspended', 'inactive', 'terminated', 'active', 'rejected'].includes(nextStatus) || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Valid lifecycle status and reason required' }, { status: 400 });
    }
    const user = await db.$transaction(async tx => {
      const previous = await tx.portalUser.findUnique({ where: { id: targetId }, select: { status: true } });
      if (!previous) throw new Error('Employee not found');
      const updated = await tx.portalUser.update({ where: { id: targetId }, data: { status: nextStatus }, select: { id: true, status: true } });
      await tx.employee.updateMany({ where: { userId: targetId }, data: { status: nextStatus } });
      if (nextStatus !== 'active') {
        await tx.portalSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
        const employees = await tx.employee.findMany({ where: { userId: targetId }, select: { id: true } });
        await tx.employeeTemporaryPermission.updateMany({ where: { employeeId: { in: [targetId, ...employees.map(e => e.id)] } }, data: { active: false, isActive: false } });
      }
      await writePortalAudit(tx, auth, `EMPLOYEE_${nextStatus.toUpperCase()}`, 'PortalUser', targetId, { oldStatus: previous.status, newStatus: nextStatus, reason }, req);
      return updated;
    });

    return NextResponse.json({ success: true, data: user, message: `Profile status → ${status} — history preserved, never permanently delete` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
