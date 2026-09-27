import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkQuotaBeforeAction, recordUsage } from "@/lib/access-control";
import { authenticateRequest } from "@/lib/auth-middleware";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin"]);

async function authorizeOwner(req: Request, ownerId: string) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const isAdmin = ADMIN_ROLES.has(auth.userType) || auth.roles.some((role) => ADMIN_ROLES.has(role));
  if (!isAdmin && auth.userId !== ownerId) return NextResponse.json({ error: "You can only access your own quota" }, { status: 403 });
  return auth;
}

// GET — quota usage for a partner/employee
export async function GET(req: NextRequest) {
  const ownerType = req.nextUrl.searchParams.get("ownerType") || "PARTNER";
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });
  const auth = await authorizeOwner(req, ownerId);
  if (auth instanceof NextResponse) return auth;

  const rules = await db.featureAccessRule.findMany({ where: { ownerType, ownerId } });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageWithQuota = await Promise.all(
    rules.filter((r) => r.limitValue !== null).map(async (r) => {
      const used = await db.featureUsageLog.count({ where: { ownerType, ownerId, featureKey: r.featureKey, createdAt: { gte: monthStart } } });
      return { featureKey: r.featureKey, limit: r.limitValue, used, remaining: Math.max(0, (r.limitValue || 0) - used), percentage: r.limitValue ? Math.round((used / r.limitValue) * 100) : 0 };
    }),
  );

  return NextResponse.json({ usage: usageWithQuota });
}

// POST — record usage (before performing an action, check quota)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { ownerType, ownerId, featureKey, action, metadata } = body as {
    ownerType?: string;
    ownerId?: string;
    featureKey?: string;
    action?: string;
    metadata?: unknown;
  };
  if (!ownerType || !ownerId || !featureKey || !action) return NextResponse.json({ error: "ownerType, ownerId, featureKey and action are required" }, { status: 400 });
  const auth = await authorizeOwner(req, ownerId);
  if (auth instanceof NextResponse) return auth;

  const quotaCheck = await checkQuotaBeforeAction(ownerType, ownerId, featureKey);
  if (!quotaCheck.allowed) {
    return NextResponse.json({ allowed: false, reason: `Quota exceeded. Limit: ${quotaCheck.limit}, Used: ${quotaCheck.limit - quotaCheck.remaining}` }, { status: 403 });
  }

  await recordUsage(ownerType, ownerId, featureKey, action, metadata);
  return NextResponse.json({ allowed: true, remaining: quotaCheck.remaining - 1, message: "Usage recorded." });
}
