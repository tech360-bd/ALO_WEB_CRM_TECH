import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { publishLearningResource } from "@/lib/employee-learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/employee-learning/resources/[id]/publish
// Body: { publisherId? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const publisherId = body?.publisherId || (session.user as any)?.id || "system";

  try {
    const result = await publishLearningResource(id, publisherId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Publish failed" },
      { status: 400 }
    );
  }
}
