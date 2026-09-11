import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const mockTests = await db.mockTest.findMany({
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ mockTests });
}
