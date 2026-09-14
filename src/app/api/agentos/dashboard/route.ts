import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/agentos/agent-service";

export async function GET(request: Request) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching agentos dashboard stats:", error);
    // Don't leak internal error text to client (SEC-13)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
