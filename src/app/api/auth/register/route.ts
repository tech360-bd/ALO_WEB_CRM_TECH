import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerStudentAtomically } from "@/lib/student/canonical-student";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — Register a new user
//   - STUDENT role: delegated to registerStudentAtomically (atomic User + Student)
//   - PARTNER role: creates User only (status=PENDING) — partner onboarding needs approval
//   - Other roles: 403 (employees cannot self-register)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, role, phone } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    phone?: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const userRole = role || "STUDENT";
  const allowedSelfRegisterRoles = ["STUDENT", "PARTNER"];
  if (!allowedSelfRegisterRoles.includes(userRole)) {
    return NextResponse.json(
      { error: "This role cannot self-register. Contact ALO Education." },
      { status: 403 }
    );
  }

  // ─── STUDENT: atomic User + Student registration ──────────────────────────
  if (userRole === "STUDENT") {
    const result = await registerStudentAtomically({
      name,
      email,
      password,
      phone,
    });

    if (!result.success) {
      const status =
        result.errorCode === "EMAIL_EXISTS" ? 400 :
        result.errorCode === "STUDENT_EXISTS_DIFFERENT_OWNER" ? 409 :
        500;
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status }
      );
    }

    // Email verification OTP (stored in audit log; production sends via email/SMS)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.auditLog.create({
      data: {
        userId: result.userId,
        action: "DATA_IMPORT",
        resource: "User",
        resourceId: result.userId,
        details: JSON.stringify({ otp, otpExpiry, type: "email_verification" }),
      },
    });

    return NextResponse.json({
      user: {
        id: result.userId,
        email: email.toLowerCase(),
        name,
        role: "STUDENT",
        status: "ACTIVE",
        studentId: result.studentId,
      },
      studentId: result.studentId,
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
      message: "Registration successful. Please verify your email with the OTP sent to your email address.",
    });
  }

  // ─── PARTNER: User only (pending approval) ────────────────────────────────
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      phone,
      passwordHash,
      role: "PARTNER",
      status: "PENDING",
      mustChangePwd: false,
      permissions: JSON.stringify([]),
    },
  });

  // Email verification OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "DATA_IMPORT",
      resource: "User",
      resourceId: user.id,
      details: JSON.stringify({ otp, otpExpiry, type: "email_verification" }),
    },
  });

  // Notify SUPER_ADMIN of pending partner approval
  await db.auditLog.create({
    data: {
      action: "DATA_IMPORT",
      resource: "User",
      resourceId: user.id,
      details: JSON.stringify({ type: "partner_registration_pending", email, name }),
    },
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    otp: process.env.NODE_ENV === "development" ? otp : undefined,
    message: "Registration submitted. Your partner account is pending ALO Education approval. You will receive an email once approved.",
  });
}
