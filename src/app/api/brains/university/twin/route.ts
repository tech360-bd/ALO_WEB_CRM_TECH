import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildUniversityDigitalTwin,
  getUniversityDigitalTwin,
} from "@/lib/brains/university-research-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/twin?universitySlug=oxford-university
export async function GET(req: NextRequest) {
  try {
    const universitySlug = req.nextUrl.searchParams.get("universitySlug");
    if (!universitySlug) {
      return NextResponse.json(
        { error: "universitySlug is required" },
        { status: 400 }
      );
    }
    const twin = await getUniversityDigitalTwin(universitySlug);
    if (!twin) {
      return NextResponse.json(
        { error: "Twin not yet built. POST to /api/brains/university/twin to build it." },
        { status: 404 }
      );
    }
    return NextResponse.json({ twin });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/brains/university/twin — build (or rebuild) the twin.
// Body: { universitySlug: string }
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
    const { universitySlug } = body;
    if (!universitySlug) {
      return NextResponse.json(
        { error: "universitySlug is required" },
        { status: 400 }
      );
    }

    const twin = await buildUniversityDigitalTwin(universitySlug);
    return NextResponse.json({ success: true, twin });
  } catch (err: any) {
    if (err.message?.includes("not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
