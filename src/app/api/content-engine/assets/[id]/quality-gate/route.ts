import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runQualityGates } from "@/lib/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/quality-gate
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const result = await runQualityGates(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Quality gate failed" },
      { status: 400 }
    );
  }
}
