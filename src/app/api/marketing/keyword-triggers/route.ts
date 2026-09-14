import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// GET — keyword triggers
export const GET = withAuth(async (_req: Request, _auth: AuthContext) => {
  const triggers = await db.keywordTrigger.findMany({ where: { status: "ACTIVE" }, orderBy: { triggerCount: "desc" } });
  return NextResponse.json({ triggers } as any);
}, MARKETING_AUTH);

// POST — create keyword trigger
export const POST = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { keyword, keywordType, platform, autoReplyText, autoDmText, autoCreateLead, autoAssignCounselor, sendPortalLink } = body;

  const trigger = await db.keywordTrigger.create({
    data: { keyword, keywordType: keywordType || "CONTAINS", platform: platform || "ALL", autoReplyText, autoDmText, autoCreateLead: autoCreateLead ?? true, autoAssignCounselor: autoAssignCounselor ?? true, sendPortalLink: sendPortalLink ?? true, status: "ACTIVE" },
  });

  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "KeywordTrigger", resourceId: trigger.id, details: JSON.stringify({ keyword }) },
  });

  return NextResponse.json({ trigger, message: "Keyword trigger created." } as any);
}, MARKETING_AUTH);

// PATCH — toggle/update trigger
export const PATCH = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { id, status, ...data } = body;
  const trigger = await db.keywordTrigger.update({ where: { id }, data: { status, ...data } });
  return NextResponse.json({ trigger } as any);
}, MARKETING_AUTH);
