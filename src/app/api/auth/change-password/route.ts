import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST — Change password (authenticated user)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify the current bcrypt password. Placeholder passwords are never valid.
  let isValid = false;
  try {
    isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Hash and save new password
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePwd: false },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PROFILE_UPDATE",
      resource: "User",
      resourceId: user.id,
      details: JSON.stringify({ type: "password_changed" }),
    },
  });

  return NextResponse.json({ message: "Password changed successfully." });
}
