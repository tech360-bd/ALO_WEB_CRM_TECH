import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — lead outreach records
export const GET = withAuth(async (_req: Request, _auth: AuthContext) => {
  const outreach = await db.leadOutreach.findMany({ include: { lead: { select: { leadId: true, fullName: true, phone: true, email: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ outreach } as any);
}, MARKETING_AUTH);

// POST — record outreach + handle opt-out/stop commands
export const POST = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { leadId, sourceName, sourceType, channel, message, result } = body;

  // Check for opt-out commands (STOP, UNSUBSCRIBE, BLOCK) — respect block/stop/unsubscribe
  const lowerMsg = (message || "").toLowerCase();
  const isOptOut = /^(stop|unsubscribe|block|opt.?out|unsub)/.test(lowerMsg);

  if (isOptOut) {
    await db.leadOutreach.updateMany({
      where: { leadId },
      data: { consentStatus: "OPTED_OUT", optOutDate: new Date(), status: "OPTED_OUT" },
    });
    await db.auditLog.create({
      data: { action: "MESSAGE_ACTION", resource: "LeadOutreach", details: JSON.stringify({ leadId, action: "opt_out", channel }) },
    });
    return NextResponse.json({ message: "User has been opted out. No further messages will be sent.", optedOut: true } as any);
  }

  const outreach = await db.leadOutreach.create({
    data: {
      leadId,
      sourceName: sourceName || "Manual",
      sourceType: sourceType || "OUTREACH",
      channel: channel || "WHATSAPP",
      consentStatus: "OPTED_IN",
      outreachHistory: JSON.stringify([{ date: new Date().toISOString(), channel, message, result: result || "PENDING" }]),
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ outreach, message: "Outreach recorded." } as any);
}, MARKETING_AUTH);
