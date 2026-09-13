import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { currentPassword, newPassword } = body;
      
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: "Current and new password required" }, { status: 400 });
      }
      
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
      }
      
      const user = await db.portalUser.findUnique({ where: { id: auth.userId } });
      if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash || "");
      if (!isValid) return NextResponse.json({ success: false, error: "Current password incorrect" }, { status: 400 });
      
      const hashed = await bcrypt.hash(newPassword, 12);
      await db.portalUser.update({ where: { id: auth.userId }, data: { passwordHash: hashed, firstLoginRequired: false } });
      
      // Revoke other sessions
      await db.portalSession.updateMany({ where: { userId: auth.userId, id: { not: auth.sessionId } }, data: { revokedAt: new Date() } }).catch(() => null);
      
      return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 });
    }
  })(request);
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, message: "Use POST to change password", requirements: { minLength: 8, requireUppercase: false, requireNumber: true } });
  })(request);
}

