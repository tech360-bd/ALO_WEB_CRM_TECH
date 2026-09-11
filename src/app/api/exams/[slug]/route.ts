import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await db.examPage.findUnique({ where: { slug } });
  if (!exam || exam.approvalStatus !== "PUBLISHED") {
    return NextResponse.json({ error: "Exam page not found" }, { status: 404 });
  }
  return NextResponse.json({ exam });
}
