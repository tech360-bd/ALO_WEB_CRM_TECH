import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";

const MANAGER_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin", "MARKETING_MANAGER", "marketing_manager"]);

async function requireManager(req: Request) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const allowed = MANAGER_ROLES.has(auth.userType) || auth.roles.some((role) => MANAGER_ROLES.has(role));
  if (!allowed) return NextResponse.json({ error: "Marketing manager access required" }, { status: 403 });
  return auth;
}

// GET — marketing user access (3 approved + manager)
export async function GET(req: NextRequest) {
  const auth = await requireManager(req);
  if (auth instanceof NextResponse) return auth;

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
  const auth = await requireManager(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const { userId, accessLevel, permissions } = body as {
    userId?: string;
    accessLevel?: string;
    permissions?: unknown;
  };
  if (!userId || !accessLevel || !["FULL", "LIMITED"].includes(accessLevel)) {
    return NextResponse.json({ error: "userId and a valid accessLevel are required" }, { status: 400 });
  }

  // Check if 3 limited users already exist
  if (accessLevel === "LIMITED") {
    const count = await db.marketingUserAccess.count({ where: { accessLevel: "LIMITED", status: "ACTIVE" } });
    if (count >= 3) {
      return NextResponse.json({ error: "Maximum 3 approved marketing users allowed. Revoke an existing user first." }, { status: 400 });
    }
  }

  const access = await db.marketingUserAccess.upsert({
    where: { userId },
    update: { accessLevel, status: "ACTIVE", permissions: JSON.stringify(permissions || []), approvedBy: auth.userId, approvedAt: new Date() },
    create: { userId, accessLevel, status: "ACTIVE", permissions: JSON.stringify(permissions || []), approvedBy: auth.userId, approvedAt: new Date() },
  });

  await db.auditLog.create({
    data: { userId: auth.userId, action: "PERMISSION_CHANGE", resource: "MarketingUserAccess", resourceId: access.id, details: JSON.stringify({ userId, accessLevel }) },
  });

  return NextResponse.json({ access, message: `Marketing user ${accessLevel === "FULL" ? "manager" : "approved user"} access granted.` });
}

// PATCH — revoke access
export async function PATCH(req: NextRequest) {
  const auth = await requireManager(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };
  if (!id || !["ACTIVE", "REVOKED", "SUSPENDED"].includes(status || "")) {
    return NextResponse.json({ error: "id and a valid status are required" }, { status: 400 });
  }
  const access = await db.marketingUserAccess.update({ where: { id }, data: { status } });
  return NextResponse.json({ access, message: `Access ${status === "ACTIVE" ? "restored" : "revoked"}.` });
}
