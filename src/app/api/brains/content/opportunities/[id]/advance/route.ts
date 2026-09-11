import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { advanceOpportunityStatus } from "@/lib/brains/content-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/content/opportunities/[id]/advance — move status forward.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { newStatus } = body;
    if (!newStatus) {
      return NextResponse.json({ error: "newStatus is required" }, { status: 400 });
    }

    const opportunity = await advanceOpportunityStatus(id, newStatus);
    return NextResponse.json({ success: true, opportunity });
  } catch (err: any) {
    if (err.message?.includes("not found") || err.message?.includes("Invalid")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
