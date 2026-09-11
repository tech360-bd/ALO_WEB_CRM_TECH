import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { test3cxConnection } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/test-connection
// Body: { integrationId? }  — if omitted, uses active integration
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let integrationId = body?.integrationId;

  if (!integrationId) {
    // Fall back to active integration
    const { getActive3cxIntegration } = await import("@/lib/threecx-integration");
    const active = await getActive3cxIntegration();
    if (!active) {
      return NextResponse.json(
        { success: false, error: "No active 3CX integration found." },
        { status: 404 }
      );
    }
    integrationId = active.id;
  }

  try {
    const result = await test3cxConnection(integrationId);
    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Test failed" },
      { status: 500 }
    );
  }
}
