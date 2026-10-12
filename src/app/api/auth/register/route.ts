import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Generate a human-readable student ID: ALO-S-XXXXX
function generateStudentId(): string {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ALO-S-${rand}`;
}

// POST — Register a new user (student self-register, partner needs approval)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // Role validation — students can self-register, partners need approval, employees cannot self-register
    const allowedSelfRegisterRoles = ["STUDENT", "PARTNER"];
    const userRole = role || "STUDENT";
    if (!allowedSelfRegisterRoles.includes(userRole)) {
      return NextResponse.json({ error: "This role cannot self-register. Contact ALO Education." }, { status: 403 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine initial status
    const userStatus = userRole === "PARTNER" ? "PENDING" : "ACTIVE";

    // Parse name into first/last
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Create user + student in a transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: name.trim(),
          phone: phone?.trim() || null,
          passwordHash,
          role: userRole,
          status: userStatus,
          mustChangePwd: false,
          permissions: JSON.stringify(userRole === "STUDENT" ? ["students.view_own"] : []),
        },
      });

      // If STUDENT, also create a Student record linked to this user
      let student = null;
      if (userRole === "STUDENT") {
        student = await tx.student.create({
          data: {
            studentId: generateStudentId(),
            userId: user.id,
            firstName,
            lastName,
            fullName: name.trim(),
            email: email.toLowerCase(),
            mobile: phone?.trim() || "",
            status: "ACTIVE",
            profileCompletion: 10, // basic info filled
          },
        });
      }

      return { user, student };
    });

    // Generate OTP for email verification (6-digit code)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in audit log (in production: send via email/SMS)
    await db.auditLog.create({
      data: {
        userId: result.user.id,
        action: "DATA_IMPORT",
        resource: "User",
        resourceId: result.user.id,
        details: JSON.stringify({ otp, otpExpiry, type: "email_verification" }),
      },
    });

    // If partner, create notification for ALO Super Admin
    if (userRole === "PARTNER") {
      await db.auditLog.create({
        data: {
          action: "DATA_IMPORT",
          resource: "User",
          resourceId: result.user.id,
          details: JSON.stringify({ type: "partner_registration_pending", email, name }),
        },
      });
    }

    return NextResponse.json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role, status: result.user.status },
      student: result.student ? { id: result.student.id, studentId: result.student.studentId } : null,
      otp: process.env.NODE_ENV === "development" ? otp : undefined, // Only return OTP in dev
      message: userRole === "PARTNER"
        ? "Registration submitted. Your partner account is pending ALO Education approval. You will receive an email once approved."
        : "Registration successful. Please verify your email with the OTP sent to your email address.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
