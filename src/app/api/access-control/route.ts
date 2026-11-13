import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { writePortalAudit } from "@/lib/transactional-audit";
import { FEATURE_DEFINITIONS } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const auth = await (await import('@/lib/auth-middleware')).authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.actingAsSessionId || auth.actorUserId !== auth.userId || ![auth.userType, ...auth.roles].some(role => role.toUpperCase() === 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'A non-acting Super Admin session is required.' }, { status: 403 });
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

const Rule = z.object({ ownerType: z.enum(['EMPLOYEE','USER','PARTNER']), ownerId: z.string().min(1).max(191), featureKey: z.string().min(1).max(191).regex(/^[a-zA-Z0-9_.-]+$/), isEnabled: z.boolean(), limitValue: z.number().int().min(0).max(2147483647), requiresApproval: z.boolean(), reason: z.string().trim().min(8).max(500) }).strict();
export async function PATCH(req: NextRequest) {
  try {
    const auth = await (await import('@/lib/auth-middleware')).authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.actingAsSessionId || auth.actorUserId !== auth.userId || ![auth.userType, ...auth.roles].some(role => role.toUpperCase() === 'SUPER_ADMIN')) return NextResponse.json({ error: 'A non-acting Super Admin session is required.' }, { status: 403 });
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(process.env.NEXTAUTH_URL || req.url).origin) return NextResponse.json({ error: 'Cross-origin mutation denied.' }, { status: 403 });
    const parsed = Rule.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid rule or missing change reason.' }, { status: 400 });
    const { reason, ...input } = parsed.data;
    const target = input.ownerType === 'PARTNER'
      ? await db.partnerProfile.findFirst({ where: { partnerId: input.ownerId } })
      : await db.employee.findFirst({ where: input.ownerType === 'EMPLOYEE' ? { id: input.ownerId } : { userId: input.ownerId } });
    if (!target) return NextResponse.json({ error: 'Permission owner not found.' }, { status: 404 });
    const rule = await db.$transaction(async tx => {
      const previous = await tx.featureAccessRule.findFirst({ where: { ownerType: input.ownerType, ownerId: input.ownerId, featureKey: input.featureKey } });
      const current = previous
        ? await tx.featureAccessRule.update({ where: { id: previous.id }, data: { ...input, updatedBy: auth.actorUserId } })
        : await tx.featureAccessRule.create({ data: { ...input, createdBy: auth.actorUserId, updatedBy: auth.actorUserId } });
      await writePortalAudit(tx, auth, input.isEnabled ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED', 'FeatureAccessRule', current.id, { reason, previous, current }, req);
      return current;
    });
    return NextResponse.json({ rule });
  } catch { return NextResponse.json({ error: 'Permission change could not be saved and audited.' }, { status: 503 }); }
}
