import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — keyword triggers
export async function GET() {
  const triggers = await db.keywordTrigger.findMany({ where: { status: "ACTIVE" }, orderBy: { triggerCount: "desc" } });
  return NextResponse.json({ triggers });
}

// POST — create keyword trigger
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keyword, keywordType, platform, autoReplyText, autoDmText, autoCreateLead, autoAssignCounselor, sendPortalLink } = body;

  const trigger = await db.keywordTrigger.create({
    data: { keyword, keywordType: keywordType || "CONTAINS", platform: platform || "ALL", autoReplyText, autoDmText, autoCreateLead: autoCreateLead ?? true, autoAssignCounselor: autoAssignCounselor ?? true, sendPortalLink: sendPortalLink ?? true, status: "ACTIVE" },
  });

  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "KeywordTrigger", resourceId: trigger.id, details: JSON.stringify({ keyword }) },
  });

  return NextResponse.json({ trigger, message: "Keyword trigger created." });
}

// PATCH — toggle/update trigger
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, ...data } = body;
  const trigger = await db.keywordTrigger.update({ where: { id }, data: { status, ...data } });
  return NextResponse.json({ trigger });
}
