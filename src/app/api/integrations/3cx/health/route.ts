import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActive3cxIntegration } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/health
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integration = await getActive3cxIntegration();
  if (!integration) {
    return NextResponse.json({
      configured: false,
      status: "NOT_CONFIGURED",
      message: "No active 3CX integration found.",
    });
  }

  return NextResponse.json({
    configured: true,
    status: integration.status,
    lastTestedAt: integration.lastTestedAt,
    lastTestSuccess: integration.lastTestSuccess,
    lastError: integration.lastError,
    baseUrl: integration.baseUrl ? `${integration.baseUrl.replace(/\/$/, "")}/api/Health` : null,
    version: integration.version,
  });
}
