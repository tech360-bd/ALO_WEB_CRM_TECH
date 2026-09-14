import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — unified audit trail for CRM (every channel, lead, campaign, assignment, SLA, publish)
export const GET = withAuth(async (req: Request, _auth: AuthContext) => {
  const resource = new URL(req.url).searchParams.get("resource");
  const action = new URL(req.url).searchParams.get("action");
  const take = Math.min(200, parseInt(new URL(req.url).searchParams.get("take") || "100", 10));

  const where: any = {};
  if (resource && resource !== "ALL") where.resource = resource;
  if (action && action !== "ALL") where.action = action;

  const [auditLogs, marketingAudit] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take }).catch(() => []),
    db.marketingAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: Math.min(take, 100) }).catch(() => []),
  ]);

  const merged = [
    ...auditLogs.map((a: any) => ({
      id: a.id,
      action: a.action,
      resource: a.resource,
      resourceId: a.resourceId,
      details: a.details,
      userId: a.userId,
      createdAt: a.createdAt,
      source: "auditLog",
    })),
    ...marketingAudit.map((m: any) => ({
      id: m.id,
      action: m.action,
      resource: m.resource,
      resourceId: m.resourceId,
      details: m.details,
      userId: m.userId,
      userName: m.userName,
      role: m.role,
      createdAt: m.createdAt,
      source: "marketingAuditLog",
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, take);

  return NextResponse.json({
    logs: merged,
    auditCount: auditLogs.length,
    marketingAuditCount: marketingAudit.length,
    total: merged.length,
  } as any);
}, MARKETING_AUTH);
