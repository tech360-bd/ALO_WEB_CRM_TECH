import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// POST — Verify OTP (email verification)
export async function POST(req: NextRequest) {
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
      details: { contains: otp },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!auditEntry) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  // Check expiry
  const details = JSON.parse(auditEntry.details || "{}");
  if (details.type !== "email_verification") {
    return NextResponse.json({ error: "Invalid OTP type" }, { status: 400 });
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
}

// POST — Resend OTP
export async function PATCH(req: NextRequest) {
  const { email } = await req.json();

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
}
