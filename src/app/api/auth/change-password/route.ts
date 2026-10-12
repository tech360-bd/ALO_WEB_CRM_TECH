import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/api-auth";

// POST — Change password (authenticated user)
export async function POST(req: NextRequest) {
  const { error: authError, user } = await requireAuth(req);
  if (authError) return authError;

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
  }

  const dbUser = await db.user.findUnique({ where: { id: user!.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify current password
  let isValid = false;
  if (dbUser.passwordHash === "alo-temporary") {
    // Seeded users must use the temporary dev password
    isValid = currentPassword === "changeme";
  } else {
    isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  }

  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Hash and save new password
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: dbUser.id },
    data: { passwordHash, mustChangePwd: false },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: dbUser.id,
      action: "PROFILE_UPDATE",
      resource: "User",
      resourceId: dbUser.id,
      details: JSON.stringify({ type: "password_changed" }),
    },
  });

  return NextResponse.json({ message: "Password changed successfully." });
}
