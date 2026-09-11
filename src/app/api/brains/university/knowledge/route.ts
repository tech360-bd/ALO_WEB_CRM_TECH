import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createKnowledgeObject,
  getKnowledgeObjects,
} from "@/lib/brains/university-research-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/knowledge?entityType=University&entitySlug=oxford
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const entityType = sp.get("entityType");
    const entitySlug = sp.get("entitySlug");
    if (!entityType || !entitySlug) {
      return NextResponse.json(
        { error: "entityType and entitySlug are required" },
        { status: 400 }
      );
    }
    const objects = await getKnowledgeObjects(entityType, entitySlug);
    return NextResponse.json({ items: objects, count: objects.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/brains/university/knowledge — create a new knowledge object.
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
    const { entityType, entitySlug, fieldName, fieldValue, sourceUrl, sourceTitle, contentHash, confidence, verificationStatus } = body;
    if (!entityType || !entitySlug || !fieldName || fieldValue === undefined) {
      return NextResponse.json(
        { error: "entityType, entitySlug, fieldName, and fieldValue are required" },
        { status: 400 }
      );
    }

    const obj = await createKnowledgeObject({
      entityType,
      entitySlug,
      fieldName,
      fieldValue,
      sourceUrl,
      sourceTitle,
      contentHash,
      confidence,
      verificationStatus,
      approvedBy: (session.user as any).id,
    });
    return NextResponse.json({ success: true, knowledgeObject: obj });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
