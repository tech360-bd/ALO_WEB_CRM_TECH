import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get all permissions grouped by module, with role assignments
export async function GET() {
  const permissions = await db.permission.findMany({
    include: { rolePermissions: true },
    orderBy: [{ module: "asc" }, { feature: "asc" }],
  });

  // Group by module
  const byModule: Record<string, any[]> = {};
  for (const p of permissions) {
    if (!byModule[p.module]) byModule[p.module] = [];
    byModule[p.module].push({
      id: p.id,
      feature: p.feature,
      action: p.action,
      description: p.description,
      defaultRoles: JSON.parse(p.defaultRoles || "[]"),
      roles: p.rolePermissions.map((rp) => ({ role: rp.role, scope: rp.scope })),
    });
  }

  const roles = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "FINANCE", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "PARTNER", "STUDENT", "ENGLISH_TRAINER", "MOCK_TEST_ADMIN"];

  return NextResponse.json({ permissions: byModule, roles });
}

// Toggle a permission for a role
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { permissionId, role, scope, grantedBy, action: act } = body; // act: "grant" | "revoke"

  if (act === "grant") {
    const rp = await db.rolePermission.upsert({
      where: { role_permissionId: { role, permissionId } },
      update: { scope, grantedBy },
      create: { role, permissionId, scope, grantedBy },
    });
    await db.auditLog.create({ data: { userId: grantedBy, action: "PERMISSION_CHANGE", resource: "Permission", resourceId: permissionId, details: JSON.stringify({ role, scope, act: "grant" }) } });
    return NextResponse.json({ rolePermission: rp });
  } else {
    await db.rolePermission.deleteMany({ where: { role, permissionId } });
    await db.auditLog.create({ data: { userId: grantedBy, action: "PERMISSION_CHANGE", resource: "Permission", resourceId: permissionId, details: JSON.stringify({ role, act: "revoke" }) } });
    return NextResponse.json({ ok: true });
  }
}
