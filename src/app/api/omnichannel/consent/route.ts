import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — consent records
export async function GET() {
  const records = await db.consentRecord.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    records,
    stats: {
      total: records.length,
      optedIn: records.filter((r) => r.consentStatus === "OPTED_IN").length,
      optedOut: records.filter((r) => r.consentStatus === "OPTED_OUT").length,
      unknown: records.filter((r) => r.consentStatus === "UNKNOWN").length,
    },
  });
}

// POST — update consent (opt-in/opt-out)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, leadId, channel, consentStatus, consentSource } = body;
  const record = await db.consentRecord.create({
    data: {
      studentId,
      leadId,
      channel,
      consentStatus,
      consentDate: consentStatus === "OPTED_IN" ? new Date() : null,
      optOutDate: consentStatus === "OPTED_OUT" ? new Date() : null,
      consentSource: consentSource || "MANUAL",
    },
  });
  await db.auditLog.create({ data: { action: "MESSAGE_ACTION", resource: "ConsentRecord", resourceId: record.id, details: JSON.stringify({ consentStatus, channel }) } });
  return NextResponse.json({ record, message: `Consent updated: ${consentStatus}` });
}
