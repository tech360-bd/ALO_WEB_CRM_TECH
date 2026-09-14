import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// POST — Request password reset (generates reset token)
export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Don't reveal whether email exists or not (security)
    return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
  }

  // Generate reset token (32 bytes hex)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate any existing unused tokens for this user (single active token)
  await (db as any).passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true, usedAt: new Date() },
  }).catch(() => {});

  // Store reset token securely in PasswordResetToken (not AuditLog) — SEC-04 fix
  await (db as any).passwordResetToken.create({
    data: {
      userId: user.id,
      token: '', // legacy column kept empty; hash is source of truth
      tokenHash: resetTokenHash,
      used: false,
      expiresAt,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      resource: "User",
      resourceId: user.id,
      details: JSON.stringify({ expiresAt: expiresAt.toISOString(), type: "password_reset" }),
    },
  });

  // In production: send email with reset link /reset-password?token=<resetToken>
  // Never echo raw token in production response (even dev, log server-side only)
  if (process.env.NODE_ENV === "development") {
    console.log(`[reset-password] DEV token for ${user.email}: ${resetToken} (not returned to client)`);
  }

  return NextResponse.json({
    message: "If an account exists with this email, a reset link has been sent.",
  });
}

// PATCH — Reset password with token
export async function PATCH(req: NextRequest) {
  const { token, newPassword } = await req.json();

  if (!token || !newPassword) {
    return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
  }

  // Enforce basic password policy (align with change-password route)
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Look up via PasswordResetToken (indexed, not AuditLog contains)
  const tokenRow = await (db as any).passwordResetToken.findUnique({
    where: { tokenHash: resetTokenHash },
  }).catch(() => null);

  if (!tokenRow || tokenRow.used) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  if (new Date() > new Date(tokenRow.expiresAt)) {
    return NextResponse.json({ error: "Reset token has expired. Please request a new one." }, { status: 400 });
  }

  // One-time use: mark used before password change to prevent race
  await (db as any).passwordResetToken.update({
    where: { id: tokenRow.id },
    data: { used: true, usedAt: new Date() },
  }).catch(() => {});

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user password + revoke/expire existing PortalSessions (force re-login)
  await db.user.update({
    where: { id: tokenRow.userId! },
    data: { passwordHash, mustChangePwd: false },
  });

  await (db as any).portalSession.updateMany({
    where: { userId: tokenRow.userId!, revokedAt: null },
    data: { revokedAt: new Date() },
  }).catch(() => {});

  // Invalidate any other unused tokens
  await (db as any).passwordResetToken.updateMany({
    where: { userId: tokenRow.userId!, used: false },
    data: { used: true, usedAt: new Date() },
  }).catch(() => {});

  // Audit log
  await db.auditLog.create({
    data: {
      userId: tokenRow.userId,
      action: "PASSWORD_RESET_COMPLETED",
      resource: "User",
      resourceId: tokenRow.userId!,
      details: JSON.stringify({ type: "password_reset_completed" }),
    },
  });

  return NextResponse.json({ message: "Password reset successful. You can now login with your new password." });
}
