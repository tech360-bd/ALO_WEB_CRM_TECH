import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// POST — Verify OTP (email verification)
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the OTP in audit log
    const auditEntry = await db.auditLog.findFirst({
      where: {
        userId: user.id,
        action: "DATA_IMPORT",
        details: { contains: "email_verification" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!auditEntry?.details) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Parse and verify OTP
    const details = JSON.parse(auditEntry.details);
    if (details.type !== "email_verification") {
      return NextResponse.json({ error: "Invalid OTP type" }, { status: 400 });
    }
    if (details.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
    if (new Date() > new Date(details.otpExpiry)) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // Mark email as verified (update status if was pending)
    if (user.status === "PENDING") {
      await db.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE" },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PROFILE_UPDATE",
        resource: "User",
        resourceId: user.id,
        details: JSON.stringify({ type: "email_verified" }),
      },
    });

    return NextResponse.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}

// PATCH — Resend OTP
export async function PATCH(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ message: "If an account exists with this email, a new OTP has been sent." });
    }

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

    return NextResponse.json({
      message: "New OTP sent to your email.",
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Failed to resend OTP. Please try again." }, { status: 500 });
  }
}
