import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { canViewEmployeeProfile, canViewSalaryDetails, isFinance, isHR, isSuperAdmin } from '@/lib/hrms/rbac';
import { decryptSensitive, encryptSensitive } from '@/lib/hrms/encryption';
import { writeHrmAudit } from '@/lib/transactional-audit';
import { mutationOriginAllowed } from '@/lib/request-origin';

const PERSONAL_FIELDS = new Set(['fullName','fatherName','motherName','gender','dob','nationality','religion','bloodGroup','maritalStatus','personalEmail','phone','presentAddress','permanentAddress','emergencyContactName','emergencyContactPhone','emergencyRelation','photo']);
const PII_FIELDS = ['fatherName','motherName','gender','dob','nationality','religion','bloodGroup','maritalStatus','nidNumber','passportNumber','passportExpiry','tinNumber','drivingLicense','personalEmail','phone','presentAddress','permanentAddress','emergencyContactName','emergencyContactPhone','emergencyRelation'];
const PAYROLL_FIELDS = ['salaryGrade','grossSalary','baseSalary','allowances','houseRent','medicalAllowance','conveyanceAllowance','taxDeduction','pfDeduction','pfRate','insurance','salaryCurrency'];
const BANK_FIELDS = ['bankName','bankAccount','bankBranch','bankRouting','mobileBankingType','mobileBankingNumber'];

async function activeActor(auth: AuthContext): Promise<boolean> {
  if (isSuperAdmin(auth)) return true;
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } });
  return Boolean(employee && employee.status.toLowerCase() === 'active');
}

async function resolveTarget(userId: string, employeeId: string) {
  const hr = employeeId
    ? await db.employeeHR.findUnique({ where: { employeeId } })
    : await db.employeeHR.findUnique({ where: { userId } });
  if (hr) return { userId: hr.userId, employeeId: hr.employeeId, hr };
  const employee = employeeId
    ? await db.employee.findFirst({ where: { OR: [{ id: employeeId }, { employeeId }] }, select: { id: true, userId: true, employeeId: true } })
    : await db.employee.findUnique({ where: { userId }, select: { id: true, userId: true, employeeId: true } });
  return employee ? { userId: employee.userId, employeeId: employee.employeeId, hr: null } : null;
}

function profileView(hr: Record<string, unknown>, auth: AuthContext, isOwner: boolean) {
  const decrypted = decryptSensitive(hr as any) as Record<string, unknown>;
  const canViewPii = isOwner || isHR(auth) || isSuperAdmin(auth);
  const canViewPayroll = canViewSalaryDetails(auth) || (isOwner && auth.permissions.includes('h6'));
  const canViewBank = isOwner || isHR(auth) || isSuperAdmin(auth) || auth.permissions.includes('ad2');
  const blocked = new Set([...PII_FIELDS, ...PAYROLL_FIELDS, ...BANK_FIELDS]);
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(hr)) if (!blocked.has(key)) safe[key] = value;
  if (canViewPii) for (const key of PII_FIELDS) if (key in decrypted) safe[key] = decrypted[key];
  if (canViewPayroll) for (const key of PAYROLL_FIELDS) if (key in decrypted) safe[key] = decrypted[key];
  if (canViewBank) for (const key of BANK_FIELDS) if (key in decrypted) safe[key] = decrypted[key];
  return { profile: safe, canViewPii, canViewPayroll, canViewBank };
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
    if (roles.has('student') || roles.has('partner')) return NextResponse.json({ success: false, error: 'HR profiles are not available to student or partner accounts.' }, { status: 403 });
    if (!await activeActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get('userId')?.trim() || auth.userId;
    const requestedEmployeeId = url.searchParams.get('employeeId')?.trim() || '';
    try {
      const target = await resolveTarget(requestedUserId, requestedEmployeeId);
      if (!target) return NextResponse.json({ success: false, error: 'Employee profile not found.' }, { status: 404 });
      if (!canViewEmployeeProfile(auth, target.userId, target.employeeId)) return NextResponse.json({ success: false, error: 'Access denied to employee profile.' }, { status: 403 });
      const isOwner = auth.userId === target.userId;
      if (!target.hr) {
        const [employee, profile] = await Promise.all([
          db.employee.findUnique({ where: { userId: target.userId }, select: { id: true, userId: true, employeeId: true, name: true, email: true, phone: true, role: true, branch: true, department: true, designation: true, status: true, joinedAt: true } }),
          db.employeeProfile.findUnique({ where: { userId: target.userId }, select: { id: true, employeeId: true, department: true, designation: true, branch: true, joinDate: true, emergencyContact: true } }),
        ]);
        if (!employee) return NextResponse.json({ success: false, error: 'Active employee profile not found.' }, { status: 404 });
        const data = { employee: { ...employee, email: isOwner || isHR(auth) || isSuperAdmin(auth) ? employee.email : '' }, profile };
        await db.$transaction(async (tx) => { await writeHrmAudit(tx, auth, 'EMPLOYEE_PROFILE_VIEWED', 'EmployeeProfile', employee.id, { targetUserId: target.userId }, req); });
        return NextResponse.json({ success: true, data, canEdit: false, isOwner }, { headers: { 'Cache-Control': 'private, no-store' } });
      }

      const base = target.hr as unknown as Record<string, unknown>;
      const view = profileView(base, auth, isOwner);
      const employeeId = String(target.hr.employeeId);
      const [education, emergency, experience, skills, languages] = await Promise.all([
        db.employeeEducation.findMany({ where: { employeeId }, select: { id: true, degree: true, institution: true, passingYear: true, result: true } }),
        view.canViewPii ? db.employeeEmergencyContact.findMany({ where: { employeeId }, select: { id: true, name: true, relation: true, phone: true, address: true } }) : Promise.resolve([]),
        db.hrmEmployeeExperience.findMany({ where: { employeeId }, select: { id: true, company: true, designation: true, fromDate: true, toDate: true } }),
        db.hrmEmployeeSkill.findMany({ where: { employeeId }, select: { id: true, name: true, level: true } }),
        db.hrmEmployeeLanguage.findMany({ where: { employeeId }, select: { id: true, name: true, speaking: true, writing: true } }),
      ]);
      await db.$transaction(async (tx) => { await writeHrmAudit(tx, auth, 'VIEW_PROFILE', 'EmployeeHR', String(base.id), { targetUserId: target.userId, canViewPii: view.canViewPii, canViewPayroll: view.canViewPayroll, canViewBank: view.canViewBank }, req); });
      return NextResponse.json({ success: true, data: { ...view.profile, education, emergencyContacts: emergency, experience, skills, languages }, canEdit: (isHR(auth) || isSuperAdmin(auth)) && !isOwner, isOwner, fieldAccess: { pii: view.canViewPii, payroll: view.canViewPayroll, bank: view.canViewBank } }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee profile is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  })(request);
}

export async function PATCH(request: Request) {
  return withAuth(async (req, auth) => {
    if ((!isHR(auth) && !isSuperAdmin(auth)) || auth.actingAsSessionId) return NextResponse.json({ success: false, error: 'HR or Super Admin access outside Acting-As is required.' }, { status: 403 });
    if (!await activeActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active HR employee account is required.' }, { status: 403 });
    if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid profile update is required.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const userId = typeof input.userId === 'string' ? input.userId.trim() : '';
    const employeeId = typeof input.employeeId === 'string' ? input.employeeId.trim() : '';
    const fields = Object.keys(input).filter((key) => !['userId', 'employeeId'].includes(key));
    if (fields.some((field) => !PERSONAL_FIELDS.has(field))) return NextResponse.json({ success: false, error: 'Only authorized personal-profile fields can be changed here. Employment, salary, bank, role, scope, and lifecycle changes require their dedicated reviewed workflows.' }, { status: 403 });
    if (!fields.length) return NextResponse.json({ success: false, error: 'No profile changes were supplied.' }, { status: 400 });
    for (const field of fields) if (typeof input[field] !== 'string' || String(input[field]).length > (field.includes('Address') ? 1000 : 500) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(String(input[field]))) return NextResponse.json({ success: false, error: `Invalid value for ${field}.` }, { status: 400 });
    if (typeof input.fullName === 'string' && !input.fullName.trim()) return NextResponse.json({ success: false, error: 'Full name cannot be empty.' }, { status: 400 });

    try {
      const target = await resolveTarget(userId || auth.userId, employeeId);
      if (!target?.hr) return NextResponse.json({ success: false, error: 'Employee HR profile not found.' }, { status: 404 });
      if (target.userId === (auth.actorUserId || auth.userId)) return NextResponse.json({ success: false, error: 'Separation of duties: HR cannot approve their own private-profile update here.' }, { status: 403 });
      const values = Object.fromEntries(fields.map((field) => [field, String(input[field]).trim()]));
      const encrypted = encryptSensitive(values);
      const updated = await db.$transaction(async (tx) => {
        const result = await tx.employeeHR.update({ where: { id: target.hr!.id }, data: { ...encrypted, version: { increment: 1 } } });
        await writeHrmAudit(tx, auth, 'EMPLOYEE_PRIVATE_PROFILE_UPDATED', 'EmployeeHR', result.id, { targetUserId: target.userId, fields }, req);
        return result;
      });
      return NextResponse.json({ success: true, data: profileView(updated as unknown as Record<string, unknown>, auth, false).profile, message: 'Employee private-profile fields saved.' });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee profile could not be updated.' }, { status: 503 });
    }
  })(request);
}
