import { db } from "@/lib/db";
import { createHash } from 'node:crypto';
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const user = await db.portalUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Rate limiting: max 5 OTP requests in last hour for this user
    if (user) {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentOtpCount = await db.otpCode.count({
        where: {
          userId: user.id,
          purpose: 'password_reset',
          createdAt: { gte: oneHourAgo },
        },
      });

      if (recentOtpCount >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please try again later.",
          },
          { status: 429 }
        );
      }
    }

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we don't reveal that
    if (user) {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry

      // Store OTP
      await db.otpCode.create({
        data: {
          userId: user.id,
          code: otp,
          type: "password_reset",
          purpose: "password_reset",
          expiresAt,
          used: false,
        },
      });

      // Create a password reset token for the reset link
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1);

      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          tokenHash: createHash('sha256').update(resetToken).digest('hex'),
          expiresAt: resetExpires,
          used: false,
        },
      });

      // Send reset email to user
      const emailResult = await sendPasswordResetEmail(email, resetToken);
      if (!emailResult.success) {
        console.error('Password reset SMTP submission failed:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists and email delivery is available, password reset instructions will be emailed.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
