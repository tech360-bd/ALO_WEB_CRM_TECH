import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewField, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { encryptSensitive } from '@/lib/hrms/encryption';
import { writePortalAudit } from '@/lib/transactional-audit';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { canViewEmployeePrivateProfileEngine } from '@/lib/employee-access-engine';

const ProfileInput = z.object({
  employeeId: z.string().min(1).max(191).optional(), fullName: z.string().trim().max(120).optional(),
  dob: z.string().max(10).refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString().slice(0, 10) === value)).optional(), gender: z.string().max(40).optional(), maritalStatus: z.string().max(40).optional(), nationality: z.string().max(80).optional(), religion: z.string().max(80).optional(), bloodGroup: z.string().max(10).optional(),
  presentAddress: z.string().max(1000).optional(), permanentAddress: z.string().max(1000).optional(), nidNumber: z.string().max(20).regex(/^[0-9০-৯ -]*$/).optional(), passportNumber: z.string().max(30).regex(/^[a-zA-Z0-9 -]*$/).optional(), photo: z.string().max(191).optional(),
  education: z.array(z.object({ degree: z.string().trim().min(1).max(160), institution: z.string().trim().min(1).max(191), passingYear: z.union([z.string().regex(/^(?:\d{4})?$/), z.number().int().min(1900).max(2100)]).optional(), result: z.string().max(80).optional() }).strict()).max(25).optional(),
  emergencyContact: z.object({ name: z.string().trim().min(1).max(120), relation: z.string().max(80).optional(), phone: z.string().min(3).max(40), address: z.string().max(191).optional() }).strict().optional(),
}).strict().refine(value => Object.keys(value).some(key => key !== 'employeeId'));
const LifecycleInput = z.object({ employeeId: z.string().min(1).max(191).optional(), status: z.enum(['SUSPENDED','INACTIVE','TERMINATED','ACTIVE','REJECTED','suspended','inactive','terminated','active','rejected']), reason: z.string().trim().min(8).max(500) }).strict();

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const targetId = req.nextUrl.searchParams.get('employeeId') || auth.userId;
    const employee = await db.employee.findFirst({ where: { OR: [{ id: targetId }, { userId: targetId }] } });
    if (!employee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    if (!await canViewEmployeePrivateProfileEngine(auth.userId, auth.roles, employee.id)) return NextResponse.json({ success: false, error: 'Private employee profile permission required.' }, { status: 403 });
    const own = employee.userId === auth.userId;
    const [salaryAllowed, bankAllowed, nidAllowed] = await Promise.all([
      own ? Promise.resolve(false) : canViewField(auth.userId, [], 'salary', employee.id),
      canViewField(auth.userId, [], 'bankAccount', employee.id), canViewField(auth.userId, [], 'nid', employee.id),
    ]);
    const [user, education, emergency, salary, documents] = await Promise.all([
      db.portalUser.findUnique({ where: { id: employee.userId }, include: { employeeProfile: true } }),
      db.employeeEducation.findMany({ where: { employeeId: employee.id } }),
      db.employeeEmergencyContact.findMany({ where: { employeeId: employee.id } }),
      salaryAllowed ? db.employeeSalary.findMany({ where: { employeeId: employee.id } }) : Promise.resolve([]),
      db.employeeDocument.findMany({ where: { employeeId: employee.id }, select: { id: true, documentType: true, status: true, fileName: true } }),
    ]);
    if (!user || user.userType.toUpperCase() !== 'EMPLOYEE') return NextResponse.json({ success: false, error: 'Employee login account not found.' }, { status: 404 });
    const profile = user.employeeProfile;
    const sanitizedProfile = profile ? { id: profile.id, userId: profile.userId, employeeId: profile.employeeId, department: profile.department, designation: profile.designation, branch: profile.branch, joinDate: profile.joinDate, emergencyContact: profile.emergencyContact, bloodGroup: profile.bloodGroup, createdAt: profile.createdAt, updatedAt: profile.updatedAt,
      salary: salaryAllowed ? profile.salary : null, bankName: bankAllowed ? profile.bankName : null, bankAccount: bankAllowed ? profile.bankAccount : null, bankRouting: bankAllowed ? profile.bankRouting : null, nidNumber: nidAllowed ? profile.nidNumber : null } : null;
    await db.$transaction(async tx => { await writePortalAudit(tx, auth, 'PROFILE_VIEWED', 'EmployeeProfile', employee.id, { salaryIncluded: salaryAllowed, bankIncluded: bankAllowed, nidIncluded: nidAllowed }, req); });
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, status: user.status, userType: user.userType }, profile: sanitizedProfile, education, emergencyContacts: emergency, salary, documents,
      privateVisibility: 'Centrally authorized private profile with separate salary, bank and NID controls.',
      fieldSecurity: own ? 'Final approved payslips are available through the employee salary page.' : 'Sensitive fields require their own permissions and audit.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Private employee profile is unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const parsed = ProfileInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid personal profile fields or unsupported employment changes.' }, { status: 400 });
    const body = parsed.data;

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
    const values = Object.fromEntries(allowed.filter(key => typeof body[key as keyof typeof body] === 'string').map(key => [key, body[key as keyof typeof body]]));
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
    return NextResponse.json({ success: true, data: profile, message: 'Profile draft saved.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee profile change could not be saved and audited.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const parsed = LifecycleInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid employee lifecycle request or reason.' }, { status: 400 });
    const body = parsed.data;
    const { employeeId, status, reason } = body;
    const targetEmployee = await db.employee.findFirst({ where: { OR: [{ id: employeeId || auth.userId }, { userId: employeeId || auth.userId }] } });
    if (!targetEmployee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    const targetId = targetEmployee.userId;
    const targetUser = await db.portalUser.findUnique({ where: { id: targetId } });
    if (!targetUser || targetUser.userType.toUpperCase() !== 'EMPLOYEE') return NextResponse.json({ success: false, error: 'Employee login account not found.' }, { status: 404 });

    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.lifecycle', 'approve', { ownerId: targetId, branchId: targetEmployee.branch, departmentId: targetEmployee.department });
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Employee lifecycle approval permission required' }, { status: 403 });

    // Cannot approve own if separation enforced
    if (targetId === auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot approve own profile — separation of duties MAKER→REVIEWER→APPROVER' }, { status: 403 });
    }

    const nextStatus = String(status || '').toLowerCase();
    if (!['suspended', 'inactive', 'terminated', 'active', 'rejected'].includes(nextStatus) || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Valid lifecycle status and reason required' }, { status: 400 });
    }
    if (nextStatus === 'active' && (targetUser.firstLoginRequired || !targetUser.emailVerified || !targetUser.passwordHash || ['terminated', 'resigned', 'blocked'].includes(targetUser.status.toLowerCase()))) return NextResponse.json({ success: false, error: 'Activation and lifecycle review must be completed before reactivation.' }, { status: 409 });
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
  } catch {
    return NextResponse.json({ success: false, error: 'Employee profile change could not be saved and audited.' }, { status: 503 });
  }
}
