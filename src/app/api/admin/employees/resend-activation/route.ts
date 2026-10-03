// ============================================================
// /api/admin/employees/resend-activation
// POST — Resend activation email (invalidate old, create new token)
// Requires: super_admin or hr_manager role
// ============================================================

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { sendActivationEmail } from '@/lib/email-service';

// ------------------------------------------------------------
// POST: Resend activation email
// Input: { employeeId }
// ------------------------------------------------------------
async function handlePost(request: Request, auth: any) {
  try {
    const { employeeId } = await request.json();

    // --- Validate required fields ---
    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      );
    }

    // --- Verify employee exists ---
    const employee = await db.portalUser.findUnique({
      where: { id: employeeId },
      include: { employeeProfile: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (employee.userType !== 'EMPLOYEE') {
      return NextResponse.json(
        { success: false, error: 'User is not an employee' },
        { status: 400 }
      );
    }

    // --- Check if account is already active ---
    if (employee.status === 'active' && !employee.firstLoginRequired) {
      return NextResponse.json(
        { success: false, error: 'Account is already active. No activation needed.' },
        { status: 400 }
      );
    }

    // --- Generate new activation token ---
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

    // --- Invalidate old tokens and create new one in a transaction ---
    const result = await db.$transaction(async (tx) => {
      // 1. Invalidate all existing active tokens for this employee
      const invalidated = await tx.employeeActivationToken.updateMany({
        where: {
          employeeId,
          status: 'active',
        },
        data: { status: 'expired' },
      });

      // 2. Reset user status to pending_activation
      await tx.portalUser.update({
        where: { id: employeeId },
        data: {
          status: 'pending_activation',
          firstLoginRequired: true,
        },
      });

      // 3. Create new activation token (48-hour expiry)
      const newToken = await tx.employeeActivationToken.create({
        data: {
          employeeId,
          tokenHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
          status: 'active',
        },
      });

      // --- Audit log ---
      await writePortalAudit(tx, auth, 'employee_activation_resend', 'employee', employeeId, {
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeCode: employee.employeeProfile?.employeeId || 'N/A',
        oldTokensInvalidated: invalidated.count,
        newTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        resentBy: auth.name,
      }, request);

      return { invalidated, newToken };
    });

    // Send activation email
    const emailResult = await sendActivationEmail(
      employee.email,
      employee.name,
      employee.employeeProfile?.employeeId || 'ALO-EMP-ACTIVE',
      tokenRaw,
      {
        designation: employee.employeeProfile?.designation || undefined,
        companyEmail: employee.email,
        expiryHours: 48,
      }
    );

    if (!emailResult.success) {
      return NextResponse.json({ success: false, error: emailResult.error, message: 'Activation token rotated, but email was not sent. Retry after correcting SMTP.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Activation email accepted by SMTP for ${employee.email}. Old links invalidated.`,
      data: {
        employeeId,
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeCode: employee.employeeProfile?.employeeId || 'N/A',
        oldTokensInvalidated: result.invalidated.count,
        newTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Resend activation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend activation email' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// Route handler with auth middleware
// ------------------------------------------------------------
export const POST = withAuth(handlePost, { requireRoles: ['super_admin', 'hr_manager'] });
