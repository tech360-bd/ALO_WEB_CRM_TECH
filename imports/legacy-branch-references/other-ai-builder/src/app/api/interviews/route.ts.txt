import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessions = await db.interviewSession.findMany({
    include: { student: true },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({ sessions });
}
