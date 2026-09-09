import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

const crmRoleMap: Record<string, string> = {
  'admin@alo.edu.bd': 'super_admin',
  'ceo@alo.edu.bd': 'ceo',
  'bm@alo.edu.bd': 'branch_manager',
  'counselor@alo.edu.bd': 'counselor',
  'app@alo.edu.bd': 'application_team',
  'visa@alo.edu.bd': 'visa_officer',
  'finance@alo.edu.bd': 'finance',
  'marketing@alo.edu.bd': 'marketing_manager',
  'frontdesk@alo.edu.bd': 'front_desk',
  'hr@alo.edu.bd': 'hr',
  'partner@alo.edu.bd': 'partner_manager',
  'doc@alo.edu.bd': 'document_officer',
  'data@alo.edu.bd': 'data_manager',
  'support@alo.edu.bd': 'support_agent',
  'ai@alo.edu.bd': 'ai_manager',
};

const crmDepartmentMap: Record<string, string> = {
  super_admin: 'Administration',
  ceo: 'Executive',
  branch_manager: 'Operations',
  counselor: 'Counseling',
  application_team: 'Applications',
  visa_officer: 'Visa',
  finance: 'Finance',
  marketing_manager: 'Marketing',
  front_desk: 'Operations',
  hr: 'Human Resources',
  partner_manager: 'Partnerships',
  document_officer: 'Documentation',
  data_manager: 'Data & Analytics',
  support_agent: 'Support',
  ai_manager: 'AI & Technology',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, portalType } = body;

    if (!email || !password || !portalType) {
      return NextResponse.json(
        { success: false, error: "Email, password, and portalType are required." },
        { status: 400 }
      );
    }

    // Capture real client IP
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const user = await db.portalUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      await db.loginAttempt.create({
        data: {
          email: email.toLowerCase().trim(),
          success: false,
          failureReason: "user_not_found",
        },
      });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === "suspended") {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          success: false,
          failureReason: "account_suspended",
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: "account_suspended",
          message: "Your account has been suspended. Contact support.",
        },
        { status: 403 }
      );
    }

    if (user.status === "pending") {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          success: false,
          failureReason: "account_pending",
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: "account_pending",
          message: "Your account is pending approval.",
        },
        { status: 403 }
      );
    }

    if (
      user.status === "blocked" ||
      user.status === "resigned" ||
      user.status === "terminated"
    ) {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          success: false,
          failureReason: `account_${user.status}`,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: "account_suspended",
          message: "Account access denied.",
        },
        { status: 403 }
      );
    }

    // Compare password using bcrypt
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          success: false,
          failureReason: "wrong_password",
        },
      });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check portal type matches user type.
    // Staff users may have userType "EMPLOYEE" or "ADMIN" (legacy/permission
    // category) — both should be able to authenticate via the employee portal.
    // The "admin" portal is restricted to SUPER_ADMIN users.
    const isStaffUser =
      user.userType === 'EMPLOYEE' || user.userType === 'ADMIN';

    let portalMatches = false;
    if (portalType === 'student' && user.userType === 'STUDENT') {
      portalMatches = true;
    } else if (portalType === 'partner' && user.userType === 'PARTNER') {
      portalMatches = true;
    } else if (portalType === 'employee' && isStaffUser) {
      portalMatches = true;
    } else if (portalType === 'admin' && user.userType === 'SUPER_ADMIN') {
      portalMatches = true;
    }

    if (!portalMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "unauthorized",
          message: "Please use the correct portal.",
        },
        { status: 403 }
      );
    }

    // Resolve CRM role from email
    const crmRole = crmRoleMap[user.email] || null;
    const department = crmRole ? (crmDepartmentMap[crmRole] || null) : null;

    // Create a session token
    const crypto = await import('crypto');
    const sessionToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day session

    // Store session in the database
    await db.portalSession.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        deviceName: request.headers.get('user-agent') || '',
        ipAddress,
        userAgent: request.headers.get('user-agent') || '',
      },
    });

    // Update last login
    const updatedUser = await db.portalUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        status: true,
        firstLoginRequired: true,
      },
    });

    // Create login attempt record for audit
    await db.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email,
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        ...updatedUser,
        crmRole,
        department,
        branch: crmRole ? 'Dhanmondi HQ' : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}