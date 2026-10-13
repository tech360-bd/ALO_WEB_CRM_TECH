import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — lead outreach records
export async function GET() {
  const outreach = await db.leadOutreach.findMany({ include: { lead: { select: { leadId: true, fullName: true, phone: true, email: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ outreach });
}

// POST — record outreach + handle opt-out/stop commands
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, sourceName, sourceType, channel, message, result } = body;

  // Check for opt-out commands (STOP, UNSUBSCRIBE, BLOCK)
  const lowerMsg = (message || "").toLowerCase();
  const isOptOut = /^(stop|unsubscribe|block|opt.?out|unsub)/.test(lowerMsg);

  if (isOptOut) {
    // Update lead outreach status to OPTED_OUT
    const updated = await db.leadOutreach.updateMany({
      where: { leadId },
      data: { consentStatus: "OPTED_OUT", optOutDate: new Date(), status: "OPTED_OUT" },
    });
    await db.auditLog.create({
      data: { action: "MESSAGE_ACTION", resource: "LeadOutreach", details: JSON.stringify({ leadId, action: "opt_out", channel }) },
    });
    return NextResponse.json({ message: "User has been opted out. No further messages will be sent.", optedOut: true });
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

  return NextResponse.json({ outreach, message: "Outreach recorded." });
}
