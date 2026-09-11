import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { completeSeoTask } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/seo/tasks/[id]/complete
// Body: { completedBy? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const completedBy = body?.completedBy || (session.user as any)?.id || "system";

  try {
    const result = await completeSeoTask(id, completedBy);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Complete failed" },
      { status: 400 }
    );
  }
}
