import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/whatsapp/send
// Auth: any staff member.
// Body: { to, text, leadId?, studentId? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { to, text, leadId, studentId } = body || {};
    if (!to || !text) {
      return NextResponse.json({ error: "to and text are required" }, { status: 400 });
    }

    const { sendWhatsAppMessage } = await import("@/lib/whatsapp-cloud-api");
    const result = await sendWhatsAppMessage({
      to: String(to),
      text: String(text),
      leadId,
      studentId,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[whatsapp/send] error", err);
    return NextResponse.json({ error: err?.message || "Failed to send WhatsApp message" }, { status: 500 });
  }
}
