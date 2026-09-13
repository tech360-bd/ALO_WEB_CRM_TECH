import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const mockTests = await db.mockTest.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ mockTests });
}
