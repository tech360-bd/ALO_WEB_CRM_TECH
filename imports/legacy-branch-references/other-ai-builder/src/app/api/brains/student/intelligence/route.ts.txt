import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/intelligence?studentId=
// Returns the StudentIntelligence record (or null).
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId query param is required" }, { status: 400 });
    }

    const { getStudentIntelligence } = await import("@/lib/brains/student-intelligence-brain");
    const intelligence = await getStudentIntelligence(studentId);
    return NextResponse.json(intelligence);
  } catch (err: any) {
    console.error("[brains/student/intelligence] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load student intelligence" }, { status: 500 });
  }
}
