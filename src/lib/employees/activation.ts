import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export type EmployeeActivationResult = {
  success: true;
  message: string;
} | {
  success: false;
  status: number;
  error: string;
};

export async function activateEmployeeAccount(input: {
  token: unknown;
  password: unknown;
  email?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<EmployeeActivationResult> {
  const token = typeof input.token === 'string' ? input.token.trim() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!token || token.length > 512 || !password) {
    return { success: false, status: 400, error: 'Token and password are required.' };
  }
  if (password.length < 8 || password.length > 200 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { success: false, status: 400, error: 'Password must be 8–200 characters and include an uppercase letter and a number.' };
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();
  const activation = await db.employeeActivationToken.findFirst({
    where: { tokenHash, status: 'active', expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });
  if (!activation) {
    const expired = await db.employeeActivationToken.findFirst({ where: { tokenHash, status: 'active', expiresAt: { lte: now } } });
    if (expired) await db.employeeActivationToken.updateMany({ where: { id: expired.id, status: 'active' }, data: { status: 'expired' } });
    return { success: false, status: 400, error: 'Invalid, expired, or already-used activation link.' };
  }

  const user = await db.portalUser.findUnique({
    where: { id: activation.employeeId },
    include: { employeeProfile: true },
  });
  if (!user || user.userType !== 'EMPLOYEE' || !user.employeeProfile) {
    return { success: false, status: 400, error: 'Employee account is not eligible for activation.' };
  }
  if (email && email !== user.email.toLowerCase()) {
    return { success: false, status: 400, error: 'Activation details do not match.' };
  }
  if (user.status.toLowerCase() !== 'pending_activation') {
    return { success: false, status: 403, error: 'This employee account is not eligible for activation.' };
  }
  if (!user.firstLoginRequired) {
    return { success: false, status: 400, error: 'This employee account has already been activated.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const ipAddress = (input.ipAddress || '').slice(0, 191);
  const userAgent = (input.userAgent || '').slice(0, 512);
  try {
    await db.$transaction(async (tx) => {
      // Claim the bearer token first. Conditional updates serialize competing
      // requests; a token can activate only once even under concurrent posts.
      const claimed = await tx.employeeActivationToken.updateMany({
        where: { id: activation.id, status: 'active', expiresAt: { gt: now } },
        data: { status: 'used', usedAt: now },
      });
      if (claimed.count !== 1) throw new Error('ACTIVATION_TOKEN_CONSUMED');

      const activated = await tx.portalUser.updateMany({
        where: { id: user.id, userType: 'EMPLOYEE', firstLoginRequired: true, status: user.status },
        data: { passwordHash, firstLoginRequired: false, status: 'active', emailVerified: true },
      });
      if (activated.count !== 1) throw new Error('EMPLOYEE_NOT_ACTIVATABLE');

      // Keep the legacy Employee projection synchronized when present.
      await tx.employee.updateMany({ where: { userId: user.id }, data: { status: 'active' } });
      await tx.employeeActivationToken.updateMany({
        where: { employeeId: user.id, status: 'active', id: { not: activation.id } },
        data: { status: 'expired' },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: user.id,
          action: 'employee_account_activated',
          entityType: 'employee',
          entityId: user.id,
          metadata: JSON.stringify({ activatedAt: now.toISOString(), ipAddress, userAgent }),
          ipAddress,
          userAgent,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACTIVATION_TOKEN_CONSUMED') {
      return { success: false, status: 400, error: 'Invalid, expired, or already-used activation link.' };
    }
    if (error instanceof Error && error.message === 'EMPLOYEE_NOT_ACTIVATABLE') {
      return { success: false, status: 409, error: 'Employee account has already been activated or is no longer eligible.' };
    }
    throw error;
  }

  return { success: true, message: 'Account activated. You can now sign in.' };
}
