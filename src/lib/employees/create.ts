import { createHash, randomBytes, randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { writePortalAudit } from '@/lib/transactional-audit';
import { sendActivationEmail } from '@/lib/email-service';
import type { AuthContext } from '@/lib/auth-middleware';

const ROLE_MAP: Record<string, string | null> = {
  STAFF: null,
  EMPLOYEE: null,
  HR_MANAGER: 'hr_manager',
  FINANCE: 'finance',
  COUNSELOR: 'counselor',
  APPLICATION_TEAM: 'application_team',
  VISA_OFFICER: 'visa_officer',
  MARKETING_MANAGER: 'marketing_manager',
  MARKETING: 'marketing',
  FRONT_DESK: 'front_desk',
  BRANCH_MANAGER: 'branch_manager',
  SUPPORT_STAFF: 'support_staff',
};

export type CreateEmployeeResult =
  | { success: true; status: 201; data: Record<string, unknown>; emailSent: boolean; emailError?: string }
  | { success: false; status: number; error: string };

export async function createEmployeeAccount(
  input: Record<string, unknown>,
  auth: AuthContext,
  request: Request,
): Promise<CreateEmployeeResult> {
  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const companyEmail = typeof input.companyEmail === 'string' ? input.companyEmail.trim().toLowerCase() : '';
  const designation = typeof input.designation === 'string' ? input.designation.trim() : '';
  const department = typeof input.department === 'string' ? input.department.trim() : '';
  const office = typeof input.office === 'string' ? input.office.trim() : typeof input.branch === 'string' ? input.branch.trim() : '';
  const roleCode = (typeof input.role === 'string' ? input.role : 'STAFF').trim().toUpperCase();
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const joinDate = typeof input.joinDate === 'string' ? input.joinDate : typeof input.joiningDate === 'string' ? input.joiningDate : '';
  const emergencyContact = typeof input.emergencyContact === 'string' ? input.emergencyContact.trim() : '';

  if (!fullName || fullName.length > 191 || !companyEmail || companyEmail.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail) || !designation || designation.length > 191) {
    return { success: false, status: 400, error: 'Valid full name, company email, and designation are required.' };
  }
  if (department.length > 191 || office.length > 191 || phone.length > 50 || emergencyContact.length > 191) {
    return { success: false, status: 400, error: 'One or more employee fields exceed their maximum length.' };
  }
  if (!Object.prototype.hasOwnProperty.call(ROLE_MAP, roleCode)) {
    return { success: false, status: 400, error: 'This role cannot be assigned through employee creation.' };
  }
  if (await db.portalUser.findUnique({ where: { email: companyEmail }, select: { id: true } }) ||
      await db.user.findUnique({ where: { email: companyEmail }, select: { id: true } })) {
    return { success: false, status: 409, error: 'An account with this email already exists.' };
  }

  const year = new Date().getFullYear();
  const tokenRaw = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(tokenRaw).digest('hex');
  let result: { user: { id: string; email: string; name: string; status: string; createdAt: Date }; employeeCode: string } | undefined;

  for (let attempt = 0; attempt < 8 && !result; attempt += 1) {
    const employeeCode = `ALO-EMP-${year}${String(randomInt(0, 1000000)).padStart(6, '0')}`;
    try {
      result = await db.$transaction(async (tx) => {
        if (await tx.portalUser.findUnique({ where: { email: companyEmail }, select: { id: true } })) {
          throw Object.assign(new Error('EMAIL_EXISTS'), { code: 'EMAIL_EXISTS' });
        }
        const user = await tx.portalUser.create({
          data: {
            email: companyEmail,
            name: fullName,
            phone,
            userType: 'EMPLOYEE',
            status: 'pending_activation',
            firstLoginRequired: true,
            emailVerified: false,
          },
          select: { id: true, email: true, name: true, status: true, createdAt: true },
        });
        const roleName = ROLE_MAP[roleCode];
        if (roleName) {
          const portalRole = await tx.portalRole.findUnique({ where: { name: roleName }, select: { id: true } });
          if (!portalRole) throw Object.assign(new Error('ROLE_NOT_CONFIGURED'), { code: 'ROLE_NOT_CONFIGURED' });
          await tx.portalUserRole.create({ data: { userId: user.id, roleId: portalRole.id, assignedBy: auth.userId } });
        }
        await tx.employeeProfile.create({
          data: {
            userId: user.id,
            employeeId: employeeCode,
            designation,
            department,
            branch: office,
            joinDate,
            emergencyContact,
          },
        });
        await tx.employee.create({
          data: {
            userId: user.id,
            employeeId: employeeCode,
            name: fullName,
            email: companyEmail,
            phone,
            department,
            branch: office,
            designation,
            role: roleCode.toLowerCase(),
            status: 'pending_activation',
          },
        });
        await tx.employeeActivationToken.create({
          data: { employeeId: user.id, tokenHash, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), status: 'active' },
        });
        await writePortalAudit(tx, auth, 'employee_account_created', 'employee', user.id, {
          employeeCode,
          designation,
          department,
          office,
          role: roleCode,
          activationEmailStatus: 'pending',
        }, request);
        return { user, employeeCode };
      });
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
      if (code === 'EMAIL_EXISTS') return { success: false, status: 409, error: 'An account with this email already exists.' };
      if (code === 'ROLE_NOT_CONFIGURED') return { success: false, status: 503, error: 'The selected employee role is not configured.' };
      if (code === 'P2002' && attempt < 7) continue;
      throw error;
    }
  }

  if (!result) return { success: false, status: 503, error: 'A unique employee code could not be allocated.' };

  const delivery = await sendActivationEmail(companyEmail, fullName, result.employeeCode, tokenRaw, {
    designation,
    companyEmail,
    expiryHours: 48,
  }).catch(() => ({ success: false, error: 'ACTIVATION_EMAIL_FAILED' }));
  return {
    success: true,
    status: 201,
    data: {
      id: result.user.id,
      employeeCode: result.employeeCode,
      companyEmail: result.user.email,
      fullName: result.user.name,
      designation,
      department,
      office,
      role: roleCode,
      status: result.user.status,
      createdAt: result.user.createdAt,
    },
    emailSent: delivery.success,
    ...(!delivery.success && { emailError: delivery.error || 'SMTP delivery failed' }),
  };
}
