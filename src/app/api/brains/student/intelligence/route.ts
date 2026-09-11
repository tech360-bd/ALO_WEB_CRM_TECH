import { NextRequest, NextResponse } from "next/server";
import { getStudentIntelligence } from "@/lib/brains/student-intelligence-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/intelligence?studentId=...
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }
    const intelligence = await getStudentIntelligence(studentId);
    if (!intelligence) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(intelligence);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
