import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const counselorId = req.nextUrl.searchParams.get("counselorId");
  const students = await db.student.findMany({
    where: counselorId ? { counselorId } : {},
    include: { counselor: true, applications: { take: 1, orderBy: { updatedAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ students });
}
