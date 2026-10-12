import { db } from "@/lib/db";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const INVALID_TOKEN = "This reset link is invalid or has expired. Please request a new one.";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { success: false, error: "Reset token and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const tokenRow = await db.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!tokenRow || tokenRow.used || tokenRow.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: INVALID_TOKEN }, { status: 400 });
    }

    // Single-use: consume the token before changing the password to prevent races.
    const consumed = await db.passwordResetToken.updateMany({
      where: { id: tokenRow.id, used: false },
      data: { used: true, usedAt: new Date() },
    });
    if (consumed.count !== 1) {
      return NextResponse.json({ success: false, error: INVALID_TOKEN }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.portalUser.update({
      where: { id: tokenRow.userId },
      data: { passwordHash },
    });

    // Revoke all existing portal sessions and any other outstanding reset tokens.
    await db.portalSession.updateMany({
      where: { userId: tokenRow.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await db.passwordResetToken.updateMany({
      where: { userId: tokenRow.userId, used: false },
      data: { used: true, usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
