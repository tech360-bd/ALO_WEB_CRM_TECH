import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/employee-learning/resources?department=&role=
// Lists published employee-learning resources targeted at the caller.
// Auth: any logged-in user.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const department = req.nextUrl.searchParams.get("department") || undefined;
    const role = req.nextUrl.searchParams.get("role") || undefined;

    const { getEmployeeLearningResources } = await import("@/lib/employee-learning");
    const resources = await getEmployeeLearningResources(department, role);
    return NextResponse.json({ resources });
  } catch (err: any) {
    console.error("[employee-learning/resources GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load resources" }, { status: 500 });
  }
}

// POST /api/employee-learning/resources
// Create a new learning resource — either from a source change or a content asset.
// Auth: any logged-in user (typically admin / HR).
// Body: { sourceType: "SOURCE_CHANGE" | "CONTENT_ASSET", sourceId, resourceType? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sourceType = body?.sourceType as string;
    const sourceId = body?.sourceId as string;
    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "sourceType (SOURCE_CHANGE | CONTENT_ASSET) and sourceId are required" },
        { status: 400 }
      );
    }

    const { createLearningResourceFromChange, createLearningResourceFromContent } =
      await import("@/lib/employee-learning");

    let result: { resourceId: string };
    if (sourceType === "SOURCE_CHANGE") {
      result = await createLearningResourceFromChange(sourceId);
    } else if (sourceType === "CONTENT_ASSET") {
      result = await createLearningResourceFromContent(sourceId, body?.resourceType);
    } else {
      return NextResponse.json({ error: `Unknown sourceType: ${sourceType}` }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[employee-learning/resources POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create resource" }, { status: 500 });
  }
}
