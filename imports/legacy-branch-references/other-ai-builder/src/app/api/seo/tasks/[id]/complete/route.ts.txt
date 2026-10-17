import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/seo/tasks/[id]/complete
// Mark an SEO task as completed (and possibly the parent opportunity).
// Auth: any logged-in user.
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
      return NextResponse.json({ error: "task id is required" }, { status: 400 });
    }

    const { completeSeoTask } = await import("@/lib/seo-engine");
    const result = await completeSeoTask(id, (session.user as any).id || "USER");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[seo/tasks/[id]/complete] error", err);
    return NextResponse.json({ error: err?.message || "Failed to complete task" }, { status: 500 });
  }
}
