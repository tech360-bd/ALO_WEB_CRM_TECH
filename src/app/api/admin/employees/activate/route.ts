// ============================================================
// /api/admin/employees/activate
// POST — Activate employee account (set password from activation link)
// No auth required — uses token from activation link
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { db } from '@/lib/db';

// ------------------------------------------------------------
// Hash password using PBKDF2 (Node.js crypto)
// Format: salt:hash
// ------------------------------------------------------------
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// ------------------------------------------------------------
// POST: Activate employee account
// Input: { token, password }
// ------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // --- Validate required fields ---
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // --- Validate password strength ---
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    // --- Hash the provided token to find match ---
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // --- Find valid (active) token ---
    const activation = await db.employeeActivationToken.findFirst({
      where: {
        tokenHash,
        status: 'active',
      },
    });

    if (!activation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired activation link' },
        { status: 400 }
      );
    }

    // --- Check expiry ---
    if (new Date() > activation.expiresAt) {
      await db.employeeActivationToken.update({
        where: { id: activation.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { success: false, error: 'Activation link has expired. Contact HR for a new link.' },
        { status: 400 }
      );
    }

    // --- Verify employee exists ---
    const employee = await db.portalUser.findUnique({
      where: { id: activation.employeeId },
      include: { employeeProfile: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee account not found' },
        { status: 404 }
      );
    }

    // --- Hash the new password ---
    const passwordHash = hashPassword(password);

    // --- Update user and token in a transaction ---
    await db.$transaction(async (tx) => {
      // 1. Update user — set password, activate account
      await tx.portalUser.update({
        where: { id: activation.employeeId },
        data: {
          passwordHash,
          firstLoginRequired: false,
          status: 'active',
          emailVerified: true,
        },
      });

      // 2. Mark token as used
      await tx.employeeActivationToken.update({
        where: { id: activation.id },
        data: {
          status: 'used',
          usedAt: new Date(),
        },
      });

      // 3. Create employee profile if it doesn't exist (edge case safety)
      if (!employee.employeeProfile) {
        await tx.employeeProfile.create({
          data: {
            userId: activation.employeeId,
            employeeId: `ALO-EMP-${new Date().getFullYear()}00000`,
            designation: '',
            department: '',
            branch: '',
          },
        });
      }
    });

    // --- Audit log ---
    await db.portalAuditLog.create({
      data: {
        actorUserId: activation.employeeId,
        action: 'employee_account_activated',
        entityType: 'employee',
        entityId: activation.employeeId,
        metadata: JSON.stringify({
          activatedAt: new Date().toISOString(),
          employeeName: employee.name,
          employeeEmail: employee.email,
        }),
        ipAddress: '',
        userAgent: '',
      },
    });

    // --- Invalidate all other active tokens for this employee ---
    await db.employeeActivationToken.updateMany({
      where: {
        employeeId: activation.employeeId,
        status: 'active',
        id: { not: activation.id },
      },
      data: { status: 'expired' },
    });

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully. You can now login.',
    });
  } catch (error: any) {
    console.error('Employee activation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Activation failed' },
      { status: 500 }
    );
  }
}
