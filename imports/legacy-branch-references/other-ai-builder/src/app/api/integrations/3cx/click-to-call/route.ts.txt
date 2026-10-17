import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/click-to-call
// Auth: any staff member.
// Body: { extension, destination }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { extension, destination } = body || {};
    if (!extension || !destination) {
      return NextResponse.json({ error: "extension and destination are required" }, { status: 400 });
    }

    const { initiateClickToCall } = await import("@/lib/threecx-integration");
    const result = await initiateClickToCall(String(extension), String(destination));
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[3cx/click-to-call] error", err);
    return NextResponse.json({ error: err?.message || "Click-to-call failed" }, { status: 500 });
  }
}
