import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/knowledge?entityType=&entitySlug=
//   Lists knowledge objects for a given entity.
// POST /api/brains/university/knowledge  Body: CreateKnowledgeObjectParams
//   Creates a new knowledge object.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const entityType = sp.get("entityType");
    const entitySlug = sp.get("entitySlug");
    if (!entityType || !entitySlug) {
      return NextResponse.json({ error: "entityType and entitySlug are required" }, { status: 400 });
    }

    const { getKnowledgeObjects } = await import("@/lib/brains/university-research-brain");
    const knowledge = await getKnowledgeObjects(entityType, entitySlug);
    return NextResponse.json({ knowledge });
  } catch (err: any) {
    console.error("[brains/university/knowledge GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load knowledge objects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.entityType || !body?.entitySlug || !body?.claim || !body?.sourceUrl) {
      return NextResponse.json(
        { error: "entityType, entitySlug, claim, sourceUrl are required" },
        { status: 400 }
      );
    }

    const { createKnowledgeObject } = await import("@/lib/brains/university-research-brain");
    const result = await createKnowledgeObject(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[brains/university/knowledge POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create knowledge object" }, { status: 500 });
  }
}
