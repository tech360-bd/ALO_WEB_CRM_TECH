import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/content/opportunities/[id]/advance
// Advance (or rewind) an opportunity to a new status.
// Body: { newStatus }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "opportunity id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const newStatus = body?.newStatus as string;
    if (!newStatus) {
      return NextResponse.json({ error: "newStatus is required" }, { status: 400 });
    }

    const { advanceOpportunityStatus } = await import("@/lib/brains/content-brain");
    const result = await advanceOpportunityStatus(id, newStatus as any);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[brains/content/opportunities/[id]/advance] error", err);
    return NextResponse.json({ error: err?.message || "Failed to advance opportunity" }, { status: 500 });
  }
}
