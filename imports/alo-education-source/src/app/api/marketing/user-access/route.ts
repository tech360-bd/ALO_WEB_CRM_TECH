import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — marketing user access (3 approved + manager)
export async function GET() {
  const access = await db.marketingUserAccess.findMany({
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    access,
    managerCount: access.filter((a) => a.accessLevel === "FULL").length,
    approvedUserCount: access.filter((a) => a.accessLevel === "LIMITED" && a.status === "ACTIVE").length,
    maxApprovedUsers: 3,
  });
}

// POST — approve marketing user (Super Admin / Marketing Manager only)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, accessLevel, approvedBy, permissions } = body;

  // Check if 3 limited users already exist
  if (accessLevel === "LIMITED") {
    const count = await db.marketingUserAccess.count({ where: { accessLevel: "LIMITED", status: "ACTIVE" } });
    if (count >= 3) {
      return NextResponse.json({ error: "Maximum 3 approved marketing users allowed. Revoke an existing user first." }, { status: 400 });
    }
  }

  const access = await db.marketingUserAccess.upsert({
    where: { userId },
    update: { accessLevel, status: "ACTIVE", permissions: JSON.stringify(permissions || []), approvedBy, approvedAt: new Date() },
    create: { userId, accessLevel, status: "ACTIVE", permissions: JSON.stringify(permissions || []), approvedBy, approvedAt: new Date() },
  });

  await db.auditLog.create({
    data: { userId: approvedBy, action: "PERMISSION_CHANGE", resource: "MarketingUserAccess", resourceId: access.id, details: JSON.stringify({ userId, accessLevel }) },
  });

  return NextResponse.json({ access, message: `Marketing user ${accessLevel === "FULL" ? "manager" : "approved user"} access granted.` });
}

// PATCH — revoke access
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const access = await db.marketingUserAccess.update({ where: { id }, data: { status } });
  return NextResponse.json({ access, message: `Access ${status === "ACTIVE" ? "restored" : "revoked"}.` });
}
