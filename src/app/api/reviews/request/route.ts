import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/request
// Create a review request (invitation). Auth: any staff member.
// Body: CreateReviewRequestInput
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.studentName) {
      return NextResponse.json({ error: "studentName is required" }, { status: 400 });
    }

    const { createReviewRequest } = await import("@/lib/review-engine");
    const result = await createReviewRequest(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[reviews/request] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create review request" }, { status: 500 });
  }
}
