import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/test-connection
// Run a real HTTP health-check against the 3CX baseUrl. Auth: admin only.
// Body: { integrationId? } — defaults to the active integration.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { getActive3cxIntegration, test3cxConnection } = await import("@/lib/threecx-integration");

    let integrationId = body?.integrationId as string | undefined;
    if (!integrationId) {
      const integ = await getActive3cxIntegration();
      if (!integ) {
        return NextResponse.json({ ok: false, status: "NOT_CONFIGURED", error: "No active 3CX integration" }, { status: 404 });
      }
      integrationId = integ.id;
    }

    const result = await test3cxConnection(integrationId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[3cx/test-connection] error", err);
    return NextResponse.json({ error: err?.message || "Test connection failed" }, { status: 500 });
  }
}
