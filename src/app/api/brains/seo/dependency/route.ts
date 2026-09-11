import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createContentDependency } from "@/lib/brains/seo-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/dependency — register a content dependency.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const {
      sourceType,
      sourceId,
      sourceField,
      dependentAssetType,
      dependentAssetId,
      dependencyStrength,
    } = body;

    if (!sourceType || !sourceId || !dependentAssetType || !dependentAssetId) {
      return NextResponse.json(
        {
          error:
            "sourceType, sourceId, dependentAssetType, and dependentAssetId are required",
        },
        { status: 400 }
      );
    }

    const dep = await createContentDependency({
      sourceType,
      sourceId,
      sourceField,
      dependentAssetType,
      dependentAssetId,
      dependencyStrength,
    });
    return NextResponse.json({ success: true, dependency: dep });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
