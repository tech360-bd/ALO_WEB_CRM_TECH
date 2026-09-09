import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { sendEmail } from '@/lib/email-service';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      adminId,
      fullName,
      companyEmail,
      personalEmail,
      phone,
      designation,
      department,
      branch,
      office,
      role,
      reportingManagerId,
      joiningDate,
    } = body;

    if (!adminId || !fullName || !companyEmail) {
      return NextResponse.json({ error: 'Missing required employee creation parameters.' }, { status: 400 });
    }

    // 1. Validate authorization
    const access = await validateRequestAccess({ userId: adminId }, 'employees', 'create');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
    }

    // 2. Check existing user
    const existingUser = await db.user.findFirst({
      where: { OR: [{ email: companyEmail }, { email: personalEmail || companyEmail }] },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this company or personal email already exists.' }, { status: 400 });
    }

    // 3. Create User & Employee in Database
    const newUser = await db.user.create({
      data: {
        name: fullName,
        email: companyEmail,
        role: role || 'employee',
      },
    });

    const empCode = `ALO-EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmp = await db.employee.create({
      data: {
        userId: newUser.id,
        employeeId: empCode,
        name: fullName,
        email: companyEmail,
        phone: phone || '',
        designation: designation || 'Counselor',
        department: department || 'Counseling',
        branch: branch || 'Dhaka Main',
        role: role || 'employee',
        status: 'invited',
      },
    });

    await db.employeeHRProfile.create({
      data: {
        employeeId: newEmp.id,
        officialEmail: companyEmail,
        officialPhone: phone || '',
        branch: branch || 'Dhaka Main',
        designation: designation || 'Counselor',
        department: department || 'Counseling',
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        managerId: reportingManagerId || '',
      },
    });

    // 4. Generate Cryptographically Secure One-Time Activation Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days Expiry

    await db.employeeActivationToken.create({
      data: {
        employeeId: newEmp.id,
        tokenHash,
        expiresAt,
        status: 'active',
      },
    });

    // 5. Send Activation Email
    const activationLink = `https://aloeducation.com/employee/activate?token=${rawToken}&email=${encodeURIComponent(companyEmail)}`;
    
    await sendEmail({
      to: companyEmail,
      subject: 'Activate your ALO Education employee account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #0057B8;">Welcome to ALO Education</h2>
          <p>Dear ${fullName},</p>
          <p>Your official employee account has been created with designation <strong>${designation || 'Counselor'}</strong>.</p>
          <p>Please click the button below to set your password and activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" style="background-color: #E8501A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Activate My Account →</a>
          </div>
          <p style="font-size: 12px; color: #64748B;">This link is valid for 7 days and can only be used once.</p>
        </div>
      `,
    });

    // 6. Security Audit Log
    await logSecurityAudit({
      actorId: adminId,
      actorRole: 'Admin',
      action: 'EMPLOYEE_ACCOUNT_CREATED',
      targetType: 'Employee',
      targetId: newEmp.id,
      newValue: JSON.stringify({ companyEmail, designation, empCode }),
    });

    return NextResponse.json({
      success: true,
      message: 'Employee account created and activation email dispatched.',
      employee: newEmp,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error creating employee account.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'Missing adminId parameter' }, { status: 400 });
    }

    const access = await validateRequestAccess({ userId: adminId }, 'employees', 'view');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
    }

    const employees = await db.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error fetching employees' }, { status: 500 });
  }
}
