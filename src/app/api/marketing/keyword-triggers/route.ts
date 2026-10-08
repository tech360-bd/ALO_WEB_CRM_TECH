import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// GET — keyword triggers.
// Returns every configured rule (not only ACTIVE ones) so callers can report an
// accurate active/total split. Clients filter on `status` where they need to.
// Optional ?status=ACTIVE narrows the result server-side.
export const GET = withAuth(async (req: Request, _auth: AuthContext) => {
  const status = new URL(req.url).searchParams.get("status");
  const triggers = await db.keywordTrigger.findMany({
    where: status ? { status } : {},
    orderBy: { triggerCount: "desc" },
  });
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

// DELETE — remove a trigger. Id comes from ?id= so the client needs no body.
export const DELETE = withAuth(async (req: Request, _auth: AuthContext) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing trigger id." }, { status: 400 } as any);

  const existing = await db.keywordTrigger.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Keyword trigger not found." }, { status: 404 } as any);

  await db.keywordTrigger.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      action: "DATA_IMPORT",
      resource: "KeywordTrigger",
      resourceId: id,
      details: JSON.stringify({ deletedKeyword: existing.keyword }),
    },
  });

  return NextResponse.json({ success: true, message: "Keyword trigger deleted." } as any);
}, MARKETING_AUTH);
