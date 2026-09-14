import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const agents = await db.aiAgent.findMany({ orderBy: { department: "asc" } });
  return NextResponse.json({ agents });
}
