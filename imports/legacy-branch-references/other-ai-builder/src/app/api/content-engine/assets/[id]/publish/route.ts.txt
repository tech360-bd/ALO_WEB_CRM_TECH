import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/publish
// Publish an approved content asset to a platform. Auth: admin only.
// Body: { platform, publishedUrl? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "asset id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.platform) {
      return NextResponse.json({ error: "platform is required" }, { status: 400 });
    }

    const { publishContent } = await import("@/lib/content-engine");
    const result = await publishContent(id, body.platform, body.publishedUrl);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[content-engine/assets/[id]/publish] error", err);
    return NextResponse.json({ error: err?.message || "Publish failed" }, { status: 500 });
  }
}
