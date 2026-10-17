import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/next-action?studentId=
// Returns the recommended next action for a student.
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

    const { recommendNextAction } = await import("@/lib/brains/student-intelligence-brain");
    const action = await recommendNextAction(studentId);
    return NextResponse.json(action);
  } catch (err: any) {
    console.error("[brains/student/next-action] error", err);
    return NextResponse.json({ error: err?.message || "Failed to recommend next action" }, { status: 500 });
  }
}
