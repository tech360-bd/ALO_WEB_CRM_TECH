/** SLA policy configuration — session-bound, RBAC-guarded, same-origin writes. */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import type { AuthContext } from "@/lib/auth-middleware";
import { STAFF_POLICIES, staffGuardDenied } from "@/lib/api/staff-endpoint-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const POLICY = STAFF_POLICIES.slaPolicies;
const NO_STORE = { "Cache-Control": "private, no-store" };

function safeError(error: unknown) {
  console.error("[sla-policies] request failed", error instanceof Error ? error.message : "unknown error");
  return NextResponse.json({ success: false, error: "SLA policy request could not be completed." }, { status: 503, headers: NO_STORE });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: false });
  if (denied) return denied;
  try {
    const params = new URL(req.url).searchParams;
    const where: Record<string, unknown> = {};
    const channel = params.get("channel");
    const priority = params.get("priority");
    const isActive = params.get("isActive");
    if (channel) where.channel = channel;
    if (priority) where.priority = priority;
    if (isActive) where.isActive = isActive === "true";
    const policies = await db.slaPolicy.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ policies }, { headers: NO_STORE });
  } catch (error) { return safeError(error); }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request: req });
  if (denied) return denied;
  try {
    const body = await req.json();
    const {
      name, channel, priority, studentType, applicationStage, messageIntent,
      slaMinutes, warningMinutes, urgentMinutes, overdueMinutes, escalationMinutes,
      businessHoursOnly, holidayCalendar, isActive,
    } = body;
    if (!name || !channel) {
      return NextResponse.json({ error: "name and channel are required" }, { status: 400, headers: NO_STORE });
    }
    const policy = await db.slaPolicy.create({
      data: {
        name,
        channel,
        priority: priority || "NORMAL",
        studentType: studentType || "ALL",
        applicationStage: applicationStage || "ALL",
        messageIntent: messageIntent || "ALL",
        slaMinutes: typeof slaMinutes === "number" ? slaMinutes : 30,
        warningMinutes: typeof warningMinutes === "number" ? warningMinutes : 20,
        urgentMinutes: typeof urgentMinutes === "number" ? urgentMinutes : 28,
        overdueMinutes: typeof overdueMinutes === "number" ? overdueMinutes : 30,
        escalationMinutes: typeof escalationMinutes === "number" ? escalationMinutes : 45,
        businessHoursOnly: typeof businessHoursOnly === "boolean" ? businessHoursOnly : false,
        holidayCalendar: typeof holidayCalendar === "string" ? holidayCalendar : (holidayCalendar ? JSON.stringify(holidayCalendar) : null),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: "SLA_POLICY_CREATED",
        entityType: "SlaPolicy",
        entityId: policy.id,
        metadata: JSON.stringify({ channel, actorRole: auth.roles.join(",") }),
      },
    });
    return NextResponse.json({ policy }, { status: 201, headers: NO_STORE });
  } catch (error) { return safeError(error); }
});
