import { NextRequest, NextResponse } from "next/server";
import { getDepartments } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const activeOnly = req.nextUrl.searchParams.get("all") !== "true";
    const departments = await getDepartments(activeOnly);
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
