import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin"]);
const PARTNER_ROLES = new Set(["PARTNER", "partner"]);

function isAdmin(auth: { userType: string; roles: string[] }) {
  return ADMIN_ROLES.has(auth.userType) || auth.roles.some((role) => ADMIN_ROLES.has(role));
}
function isPartner(auth: { userType: string; roles: string[] }) {
  return PARTNER_ROLES.has(auth.userType) || auth.roles.some((role) => PARTNER_ROLES.has(role));
}

// GET — list extra quota requests
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const admin = isAdmin(auth);
  if (!admin && !isPartner(auth)) return NextResponse.json({ error: "Partner or admin access required" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  if (!admin) where.partnerId = auth.userId;
  const requests = await db.extraQuotaRequest.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ requests });
}

// POST — partner requests extra quota
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdmin(auth) && !isPartner(auth)) return NextResponse.json({ error: "Partner or admin access required" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { partnerId, requestType, currentLimit, requestedLimit, reason } = body;
  if (!partnerId || !requestType || requestedLimit === undefined) return NextResponse.json({ error: "partnerId, requestType and requestedLimit are required" }, { status: 400 });
  if (!isAdmin(auth) && partnerId !== auth.userId) return NextResponse.json({ error: "You can only request quota for your own partner account" }, { status: 403 });

  const request = await db.extraQuotaRequest.create({ data: { partnerId, requestType, currentLimit, requestedLimit, reason, status: "PENDING" } });
  return NextResponse.json({ request, message: "Extra quota request submitted. ALO Super Admin will review." });
}

// PATCH — approve/reject extra quota request (admin only)
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdmin(auth)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, status, reviewNote } = body;
  if (!id || !["APPROVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "id and APPROVED or REJECTED status are required" }, { status: 400 });
  const request = await db.extraQuotaRequest.update({ where: { id }, data: { status, reviewedBy: auth.userId, reviewNote } });

  if (status === "APPROVED") {
    const featureMap: Record<string, string> = { EXTRA_IMAGE_QUOTA: "marketing.image.generate", EXTRA_VIDEO_QUOTA: "marketing.video.generate", EXTRA_MOCK_VOUCHER: "partner.student.benefit" };
    const featureKey = featureMap[request.requestType];
    if (featureKey) await db.featureAccessRule.updateMany({ where: { ownerType: "PARTNER", ownerId: request.partnerId, featureKey }, data: { limitValue: request.requestedLimit } });
  }

  await db.auditLog.create({ data: { userId: auth.userId, action: "PERMISSION_CHANGE", resource: "ExtraQuotaRequest", resourceId: id, details: JSON.stringify({ status, requestType: request.requestType }) } });
  return NextResponse.json({ request, message: `Request ${status.toLowerCase()}.` });
}
