import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createLearningResourceFromChange,
  createLearningResourceFromContent,
  getEmployeeLearningResources,
} from "@/lib/employee-learning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/employee-learning/resources?department=&role=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const department = req.nextUrl.searchParams.get("department");
  const role = req.nextUrl.searchParams.get("role");

  const resources = await getEmployeeLearningResources(department, role);
  return NextResponse.json({ resources });
}

// POST /api/employee-learning/resources
// Body: { sourceChangeId? | contentAssetId?, resourceType? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sourceChangeId, contentAssetId, resourceType } = body;

  if (sourceChangeId) {
    const resource = await createLearningResourceFromChange(sourceChangeId);
    return NextResponse.json({ resource });
  }

  if (contentAssetId) {
    if (!resourceType) {
      return NextResponse.json(
        { error: "resourceType is required when creating from content asset" },
        { status: 400 }
      );
    }
    const resource = await createLearningResourceFromContent(contentAssetId, resourceType);
    return NextResponse.json({ resource });
  }

  return NextResponse.json(
    { error: "Either sourceChangeId or contentAssetId is required" },
    { status: 400 }
  );
}
