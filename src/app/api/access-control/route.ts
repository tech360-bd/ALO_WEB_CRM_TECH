import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FEATURE_DEFINITIONS } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const auth = await (await import('@/lib/auth-middleware')).authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  // RBAC: only staff roles may enumerate employees/packages/rules
  if (!auth.roles.some((r: string) => ['super_admin','admin','hr_manager','branch_manager','SUPER_ADMIN','ADMIN','HR_MANAGER'].includes(r))) {
    return NextResponse.json({ error: 'Forbidden: insufficient role for access-control read' }, { status: 403 });
  }
  const [employees, partners, packages, featureRules, quotaRequests, usageLogs] = await Promise.all([
    db.employee.findMany({ select: { id: true, employeeId: true, name: true, designation: true, department: true, status: true } }),
    db.employee.findMany({ where: { role: "PARTNER" }, select: { id: true, employeeId: true, name: true, designation: true } }),
    db.partnerPackage.findMany(),
    db.featureAccessRule.findMany(),
    db.extraQuotaRequest.findMany({ orderBy: { createdAt: "desc" } }),
    db.featureUsageLog.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({
    employees, partners, packages, featureRules, featureDefinitions: FEATURE_DEFINITIONS, quotaRequests, usageLogs,
    summary: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.status.toUpperCase() === "ACTIVE").length,
      pendingProfiles: employees.filter((employee) => employee.status.toUpperCase() === "PENDING").length,
      totalPartners: partners.length,
      totalPackages: packages.length,
      pendingQuotaRequests: quotaRequests.filter((request) => request.status.toUpperCase() === "PENDING").length,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await (await import('@/lib/auth-middleware')).authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.roles.some((r: string) => ['super_admin','admin','hr_manager','SUPER_ADMIN','ADMIN'].includes(r))) {
    return NextResponse.json({ error: 'Forbidden: admin/hr required for access-control write' }, { status: 403 });
  }
  const body = await req.json();
  const { ownerType, ownerId, featureKey, isEnabled, limitValue, requiresApproval } = body;
  const updatedBy = auth.actorUserId || auth.userId;
  if (!ownerType || !ownerId || !featureKey) return NextResponse.json({ error: "ownerType, ownerId and featureKey are required" }, { status: 400 });
  const existing = await db.featureAccessRule.findFirst({ where: { ownerType, ownerId, featureKey } });
  const rule = existing
    ? await db.featureAccessRule.update({ where: { id: existing.id }, data: { isEnabled, limitValue, requiresApproval, updatedBy } })
    : await db.featureAccessRule.create({ data: { ownerType, ownerId, featureKey, isEnabled, limitValue, requiresApproval, createdBy: updatedBy || "", updatedBy: updatedBy || "" } });
  await db.auditLog.create({ data: { userId: updatedBy, action: "PERMISSION_CHANGE", resource: "FeatureAccessRule", resourceId: rule.id, details: JSON.stringify({ ownerType, ownerId, featureKey, isEnabled, limitValue }) } });
  return NextResponse.json({ rule });
}
