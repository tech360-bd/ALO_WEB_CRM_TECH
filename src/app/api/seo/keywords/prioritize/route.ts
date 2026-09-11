import { NextRequest, NextResponse } from "next/server";
import { prioritizeKeyword } from "@/lib/keyword-research-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/seo/keywords/prioritize — set HIGH/MEDIUM/LOW priority on a keyword.
// Body: { keywordId: string, priority: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keywordId, priority } = body;

    if (!keywordId || !priority) {
      return NextResponse.json(
        { error: "keywordId and priority are required" },
        { status: 400 }
      );
    }

    const validPriorities = ["HIGH", "MEDIUM", "LOW", "URGENT"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Valid: ${validPriorities.join(", ")}` },
        { status: 400 }
      );
    }

    const keyword = await prioritizeKeyword(keywordId, priority);
    return NextResponse.json({ success: true, keyword });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
