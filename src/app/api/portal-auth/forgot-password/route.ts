import { db } from "@/lib/db";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email-service";

const GENERIC_MESSAGE =
  "If an account exists and email delivery is available, password reset instructions will be emailed.";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.portalUser.findUnique({ where: { email: normalizedEmail } });

    // Rate limit: max 5 reset requests per user per hour.
    if (user) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await db.passwordResetToken.count({
        where: { userId: user.id, createdAt: { gte: oneHourAgo } },
      });
      if (recentCount >= 5) {
        return NextResponse.json(
          { success: false, error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }

    // Always return the same response to prevent email enumeration.
    if (user) {
      // 32 bytes of CSPRNG output. Only the SHA-256 hash is persisted; the raw token lives only in the emailed link.
      const resetToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(resetToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Invalidate older unused tokens so only the latest link works.
      await db.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true, usedAt: new Date() },
      });

      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: "", // legacy column: never store the raw token
          tokenHash,
          used: false,
          expiresAt,
        },
      });

      const emailResult = await sendPasswordResetEmail(normalizedEmail, resetToken);
      if (!emailResult.success) {
        console.error("Password reset SMTP submission failed:", emailResult.error);
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
