// ============================================================
// /api/admin/employees/create
// POST — Create employee account with activation token
// Requires: super_admin role
// ============================================================

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { db } from '@/lib/db';
import { authenticateRequest, withAuth, logAuditAction } from '@/lib/auth-middleware';
import { sendActivationEmail } from '@/lib/email-service';

// ------------------------------------------------------------
// Generate sequential employee code: ALO-EMP-YYYYNNNNN
// ------------------------------------------------------------
async function generateEmployeeCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.employeeProfile.count();
  const seq = String(count + 1).padStart(5, '0');
  return `ALO-EMP-${year}${seq}`;
}

// ------------------------------------------------------------
// POST: Create employee account (user + profile + activation token)
// ------------------------------------------------------------
async function handlePost(request: Request, auth: any) {
  try {
    const body = await request.json();
    const {
      fullName,
      companyEmail,
      designation,
      department,
      office,
      role,
      permissionPackageId,
      status,
      phone,
      joinDate,
      emergencyContact,
    } = body;

    // --- Validate required fields ---
    if (!fullName || !companyEmail || !designation) {
      return NextResponse.json(
        { success: false, error: 'fullName, companyEmail, and designation are required' },
        { status: 400 }
      );
    }

    // --- Check if email already exists ---
    const existingUser = await db.portalUser.findUnique({
      where: { email: companyEmail.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // --- Generate employee code ---
    const employeeCode = await generateEmployeeCode();

    // --- Generate activation token (raw + hashed) ---
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

    // --- Create everything in a transaction ---
    const result = await db.$transaction(async (tx) => {
      // 1. Create portal user
      const user = await tx.portalUser.create({
        data: {
          email: companyEmail.toLowerCase().trim(),
          name: fullName.trim(),
          phone: phone || '',
          userType: 'EMPLOYEE',
          status: status || 'pending_activation',
          firstLoginRequired: true,
          emailVerified: false,
        },
      });

      // 2. Assign role if provided
      if (role) {
        const portalRole = await tx.portalRole.findFirst({ where: { name: role } });
        if (portalRole) {
          await tx.portalUserRole.create({
            data: {
              userId: user.id,
              roleId: portalRole.id,
              assignedBy: auth.userId,
            },
          });
        }
      }

      // 3. Create employee profile
      const profile = await tx.employeeProfile.create({
        data: {
          userId: user.id,
          employeeId: employeeCode,
          designation: designation.trim(),
          department: (department || '').trim(),
          branch: (office || '').trim(),
          joinDate: joinDate || '',
          emergencyContact: emergencyContact || '',
        },
      });

      // 4. Create activation token
      const activationToken = await tx.employeeActivationToken.create({
        data: {
          employeeId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
          status: 'active',
        },
      });

      return { user, profile, activationToken };
    });

    // --- Audit log ---
    await logAuditAction(auth, 'employee_account_created', 'employee', result.user.id, {
      employeeCode,
      designation,
      department: department || '',
      office: office || '',
      role: role || '',
      createdBy: auth.name,
      activationEmailLogged: true,
    });

    // Send activation email
    await sendActivationEmail(companyEmail, fullName, employeeCode, tokenRaw);

    // --- Return employee info (DO NOT return token hash) ---
    return NextResponse.json({
      success: true,
      message: 'Employee account created. Activation email sent.',
      data: {
        id: result.user.id,
        employeeCode,
        email: result.user.email,
        name: fullName,
        designation,
        department: department || '',
        office: office || '',
        role: role || '',
        status: result.user.status,
        createdAt: result.user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Employee create error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Duplicate entry — email or employee ID may already exist.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// Route handler with auth middleware
// ------------------------------------------------------------
export const POST = withAuth(handlePost, { requireRoles: ['super_admin', 'admin'] });
