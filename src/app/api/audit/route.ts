import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const take = Number(req.nextUrl.searchParams.get("take") || 30);
  const logs = await db.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({ logs });
}
