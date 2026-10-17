import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/twin?universitySlug=
// Returns the existing digital twin (if any).
// POST /api/brains/university/twin  Body: { universitySlug }
//   Builds (or rebuilds) the digital twin for a university.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const universitySlug = req.nextUrl.searchParams.get("universitySlug");
    if (!universitySlug) {
      return NextResponse.json({ error: "universitySlug query param is required" }, { status: 400 });
    }

    const { getUniversityDigitalTwin } = await import("@/lib/brains/university-research-brain");
    const twin = await getUniversityDigitalTwin(universitySlug);
    return NextResponse.json({ universitySlug, twin });
  } catch (err: any) {
    console.error("[brains/university/twin GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load twin" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const universitySlug = body?.universitySlug as string;
    if (!universitySlug) {
      return NextResponse.json({ error: "universitySlug is required" }, { status: 400 });
    }

    const { buildUniversityDigitalTwin } = await import("@/lib/brains/university-research-brain");
    const result = await buildUniversityDigitalTwin(universitySlug);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[brains/university/twin POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to build twin" }, { status: 500 });
  }
}
