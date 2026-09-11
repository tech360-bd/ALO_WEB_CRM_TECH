import { NextRequest, NextResponse } from "next/server";
import { recommendNextAction } from "@/lib/brains/student-intelligence-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/next-action?studentId=...
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }
    const recommendation = await recommendNextAction(studentId);
    if (!recommendation) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ studentId, ...recommendation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
