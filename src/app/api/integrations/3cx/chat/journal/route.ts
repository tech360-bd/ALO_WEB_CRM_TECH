import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { journalChat } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/chat/journal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    providerEventId,
    direction,
    fromUser,
    toUser,
    messageText,
    channel,
    studentId,
    leadId,
    partnerId,
    employeeId,
    provider,
  } = body;

  if (!providerEventId || !fromUser || !toUser || !messageText) {
    return NextResponse.json(
      { error: "providerEventId, fromUser, toUser, messageText are required" },
      { status: 400 }
    );
  }

  try {
    const result = await journalChat({
      provider,
      providerEventId,
      direction,
      fromUser,
      toUser,
      messageText,
      channel,
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
