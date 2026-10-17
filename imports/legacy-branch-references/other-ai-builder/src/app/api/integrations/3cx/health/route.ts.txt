import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/health
// Returns the active 3CX integration status. Auth: any staff member.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getActive3cxIntegration } = await import("@/lib/threecx-integration");
    const integration = await getActive3cxIntegration();
    if (!integration) {
      return NextResponse.json({ configured: false, status: "NOT_CONFIGURED" });
    }
    return NextResponse.json({
      configured: true,
      id: integration.id,
      baseUrl: integration.baseUrl,
      status: integration.status,
      lastSync: integration.lastSync,
    });
  } catch (err: any) {
    console.error("[3cx/health] error", err);
    return NextResponse.json({ error: err?.message || "Failed to read 3CX health" }, { status: 500 });
  }
}
