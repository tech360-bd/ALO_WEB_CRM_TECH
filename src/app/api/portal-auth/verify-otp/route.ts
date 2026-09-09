import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, otp, type } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const user = await db.portalUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired code." },
        { status: 400 }
      );
    }

    const otpRecord = await db.otpCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: type || "account_activation",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired code." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // If account activation OTP, activate the user
    if (type === "account_activation" && user.status === "pending") {
      await db.portalUser.update({
        where: { id: user.id },
        data: { status: "active" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful.",
      userStatus: user.status,
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
