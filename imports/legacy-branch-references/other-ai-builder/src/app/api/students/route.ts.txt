import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const student = await db.student.findUnique({
      where: { id },
      include: {
        counselor: true,
        documents: { orderBy: { category: "asc" } },
        applications: true,
        visaCases: true,
        interviews: { orderBy: { startedAt: "desc" } },
        mockTests: { orderBy: { createdAt: "desc" } },
        payments: true,
        timelineEvents: { orderBy: { createdAt: "desc" }, take: 20, include: { user: true } },
      },
    });
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ student });
  }
  const students = await db.student.findMany({
    include: { counselor: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ students });
}
