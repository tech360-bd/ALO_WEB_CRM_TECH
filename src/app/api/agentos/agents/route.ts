import { NextRequest, NextResponse } from "next/server";
import { getAgents, type AgentListFilters } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const searchParams = req.nextUrl.searchParams;
    
    const filters: AgentListFilters = {
      departmentSlug: searchParams.get("departmentSlug") || undefined,
      status: searchParams.get("status") || undefined,
      engineSlug: searchParams.get("engineSlug") || undefined,
      requiresApproval: searchParams.has("requiresApproval") ? searchParams.get("requiresApproval") === "true" : undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: parseInt(searchParams.get("pageSize") || "50", 10),
    };

    const result = await getAgents(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}