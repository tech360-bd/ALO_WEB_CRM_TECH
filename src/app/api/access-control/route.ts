import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FEATURE_DEFINITIONS } from "@/lib/access-control";

export async function GET() {
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
  const body = await req.json();
  const { ownerType, ownerId, featureKey, isEnabled, limitValue, requiresApproval, updatedBy } = body;
  if (!ownerType || !ownerId || !featureKey) return NextResponse.json({ error: "ownerType, ownerId and featureKey are required" }, { status: 400 });
  const existing = await db.featureAccessRule.findFirst({ where: { ownerType, ownerId, featureKey } });
  const rule = existing
    ? await db.featureAccessRule.update({ where: { id: existing.id }, data: { isEnabled, limitValue, requiresApproval, updatedBy } })
    : await db.featureAccessRule.create({ data: { ownerType, ownerId, featureKey, isEnabled, limitValue, requiresApproval, createdBy: updatedBy || "", updatedBy: updatedBy || "" } });
  await db.auditLog.create({ data: { userId: updatedBy, action: "PERMISSION_CHANGE", resource: "FeatureAccessRule", resourceId: rule.id, details: JSON.stringify({ ownerType, ownerId, featureKey, isEnabled, limitValue }) } });
  return NextResponse.json({ rule });
}
