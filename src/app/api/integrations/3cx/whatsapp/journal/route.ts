import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { journalWhatsApp } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/whatsapp/journal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    providerEventId,
    direction,
    fromNumber,
    toNumber,
    messageText,
    deliveryStatus,
    studentId,
    leadId,
    partnerId,
    employeeId,
    provider,
  } = body;

  if (!providerEventId || !fromNumber || !toNumber || !messageText) {
    return NextResponse.json(
      { error: "providerEventId, fromNumber, toNumber, messageText are required" },
      { status: 400 }
    );
  }

  try {
    const result = await journalWhatsApp({
      provider,
      providerEventId,
      direction,
      fromNumber,
      toNumber,
      messageText,
      deliveryStatus,
      studentId,
      leadId,
      partnerId,
      employeeId,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Journal failed" },
      { status: 400 }
    );
  }
}
