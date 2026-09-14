import { NextRequest, NextResponse } from "next/server";
import { getEngineTypes } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const activeOnly = req.nextUrl.searchParams.get("all") !== "true";
    const engines = await getEngineTypes(activeOnly);
    return NextResponse.json(engines);
  } catch (error) {
    console.error("Error fetching engines:", error);
    return NextResponse.json({ error: "Failed to fetch engines" }, { status: 500 });
  }
}
