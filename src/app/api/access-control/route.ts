import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FEATURE_DEFINITIONS, canAccessFeature, checkQuotaBeforeAction } from "@/lib/access-control";

// GET — access control center data
export async function GET(req: NextRequest) {
  const [employees, partners, packages, featureRules, quotaRequests, usageLogs] = await Promise.all([
    db.employeeHR.findMany({ select: { id: true, employeeCode: true, fullName: true, designation: true, department: { select: { name: true } }, office: { select: { name: true } }, status: true, profileStatus: true } }),
    db.employeeHR.findMany({ where: { role: "PARTNER" }, select: { id: true, employeeCode: true, fullName: true, designation: true } }),
    db.partnerPackage.findMany({ include: { _count: { select: { assignments: true } } } }),
    db.featureAccessRule.findMany({}),
    db.extraQuotaRequest.findMany({ include: { partner: { select: { fullName: true, employeeCode: true } } }, orderBy: { createdAt: "desc" } }),
    db.featureUsageLog.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    employees,
    partners,
    packages,
    featureRules,
    featureDefinitions: FEATURE_DEFINITIONS,
    quotaRequests,
    usageLogs,
    summary: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "ACTIVE").length,
      pendingProfiles: employees.filter((e) => e.profileStatus === "SUBMITTED" || e.profileStatus === "UNDER_REVIEW").length,
      totalPartners: partners.length,
      totalPackages: packages.length,
      pendingQuotaRequests: quotaRequests.filter((q) => q.status === "PENDING").length,
    },
  });
}

// PATCH — toggle feature access for an employee/partner
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { ownerType, ownerId, featureKey, isEnabled, limitValue, requiresApproval, updatedBy } = body;

  const rule = await db.featureAccessRule.upsert({
    where: {
      ownerType_ownerId_featureKey: { ownerType, ownerId, featureKey },
    },
    update: { isEnabled, limitValue, requiresApproval, updatedBy },
    create: { ownerType, ownerId, featureKey, isEnabled, limitValue, requiresApproval, createdBy: updatedBy, updatedBy },
  });

  await db.auditLog.create({
    data: {
      userId: updatedBy,
      action: "PERMISSION_CHANGE",
      resource: "FeatureAccessRule",
      resourceId: rule.id,
      details: JSON.stringify({ ownerType, ownerId, featureKey, isEnabled, limitValue }),
    },
  });

  return NextResponse.json({ rule });
}
