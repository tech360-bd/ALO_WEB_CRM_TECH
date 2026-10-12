import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// POST — Request password reset (generates reset token)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't reveal whether email exists or not (security)
      return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "DATA_IMPORT",
        resource: "User",
        resourceId: user.id,
        details: JSON.stringify({ resetTokenHash, expiresAt, type: "password_reset" }),
      },
    });

    // In production: send email with reset link
    // Reset link: /reset-password?token=<resetToken>

    return NextResponse.json({
      message: "If an account exists with this email, a reset link has been sent.",
      resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Failed to process request. Please try again." }, { status: 500 });
  }
}

// PATCH — Reset password with token
export async function PATCH(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the reset token in audit log — must be type password_reset
    const auditEntry = await db.auditLog.findFirst({
      where: {
        details: { contains: "password_reset" },
        action: "DATA_IMPORT",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!auditEntry?.details) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Parse and verify
    const details = JSON.parse(auditEntry.details);
    if (details.type !== "password_reset") {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }
    if (details.resetTokenHash !== resetTokenHash) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }
    if (new Date() > new Date(details.expiresAt)) {
      return NextResponse.json({ error: "Reset token has expired. Please request a new one." }, { status: 400 });
    }

    const userId = auditEntry.userId;
    if (!userId) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePwd: false },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "PROFILE_UPDATE",
        resource: "User",
        resourceId: userId,
        details: JSON.stringify({ type: "password_reset_completed" }),
      },
    });

    return NextResponse.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
