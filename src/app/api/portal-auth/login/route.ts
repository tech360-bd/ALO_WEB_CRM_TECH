import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
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

function pageSessionRole(userType: string, crmRole: string | null): string {
  if (userType === 'SUPER_ADMIN' || userType === 'ADMIN' || userType === 'PARTNER' || userType === 'STUDENT') {
    return userType;
  }
  return crmRole ? crmRole.toUpperCase() : 'EMPLOYEE';
}

async function setPageSessionCookie(response: NextResponse, user: { id: string; email: string; name: string; userType: string; status: string }, crmRole: string | null) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('NEXTAUTH_SECRET must be configured (32+ characters) before portal login');

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: pageSessionRole(user.userType, crmRole),
      status: 'ACTIVE',
    },
    secret,
    maxAge: 7 * 24 * 60 * 60,
  });
  const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
  response.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ success: false, error: 'Portal authentication is not configured.' }, { status: 503 });
    }
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const portalType = typeof body?.portalType === 'string' ? body.portalType : '';

    if (!email || !password || !portalType) {
      return NextResponse.json(
        { success: false, error: "Email, password, and portalType are required." },
        { status: 400 }
      );
    }

    // Capture real client IP
    const ipAddress = (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown').slice(0, 191);
    const normalizedEmail = email.toLowerCase().trim();
    const failureCount = await db.loginAttempt.count({
      where: {
        success: false,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        OR: [{ email: normalizedEmail }, ...(ipAddress === 'unknown' ? [] : [{ ipAddress }])],
      },
    });
    if (failureCount >= 5) {
      return NextResponse.json({ success: false, error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const user = await db.portalUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await db.loginAttempt.create({
        data: {
          email: normalizedEmail,
          ipAddress,
          success: false,
          failureReason: "user_not_found",
        },
      });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Normalize legacy status casing before applying fail-closed state checks.
    const userStatus = user.status.toLowerCase();

    // Check account status
    if (userStatus === "suspended") {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
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

    if (userStatus === "pending_verification" || !user.emailVerified) {
      await db.loginAttempt.create({ data: { userId: user.id, email: user.email, ipAddress, success: false, failureReason: 'email_not_verified' } });
      return NextResponse.json({ success: false, error: 'email_verification_required', message: 'Verify your email before signing in.' }, { status: 403 });
    }

    if (userStatus === "pending") {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
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
      userStatus === "blocked" ||
      userStatus === "resigned" ||
      userStatus === "terminated"
    ) {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
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

    if (userStatus !== 'active') {
      await db.loginAttempt.create({ data: { userId: user.id, email: user.email, ipAddress, success: false, failureReason: 'account_inactive' } });
      return NextResponse.json({ success: false, error: 'account_pending', message: 'Your account is not active.' }, { status: 403 });
    }

    // Compare password using bcrypt
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
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
        ipAddress,
        success: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        crmRole,
        department,
        branch: crmRole ? 'Dhanmondi HQ' : null,
      },
    });
    const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
    response.cookies.set('alo_portal_session', sessionToken, {
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60,
    });
    return setPageSessionCookie(response, updatedUser, crmRole);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}