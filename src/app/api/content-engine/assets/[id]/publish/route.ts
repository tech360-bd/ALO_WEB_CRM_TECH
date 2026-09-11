import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { publishContent } from "@/lib/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/publish
// Body: { platform, publishedUrl? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { platform, publishedUrl } = body;

  if (!platform) {
    return NextResponse.json({ error: "platform is required" }, { status: 400 });
  }

  try {
    const result = await publishContent(id, platform, publishedUrl ?? null);
    if (!result.published) {
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Publish failed" },
      { status: 400 }
    );
  }
}
