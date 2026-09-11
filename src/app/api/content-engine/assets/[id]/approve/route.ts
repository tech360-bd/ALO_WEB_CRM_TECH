import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { approveContent } from "@/lib/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/approve
// Body: { approverId? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const approverId = body?.approverId || (session.user as any)?.id || "system";

  try {
    const result = await approveContent(id, approverId);
    if (!result.approved) {
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Approval failed" },
      { status: 400 }
    );
  }
}
