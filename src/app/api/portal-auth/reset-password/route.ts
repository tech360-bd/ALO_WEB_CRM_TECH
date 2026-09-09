import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email, OTP, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await db.portalUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Find valid OTP
    const otpRecord = await db.otpCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: "password_reset",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.portalUser.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Revoke all existing sessions
    await db.portalSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
