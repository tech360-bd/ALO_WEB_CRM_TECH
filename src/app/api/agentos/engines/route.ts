import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEngines, getEngineStats } from "@/lib/agentos";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  if (sp.get("stats") === "true") return NextResponse.json(await getEngineStats());
  const engines = await getEngines({
    status: sp.get("status") || undefined,
    type: sp.get("type") || undefined,
  });
  return NextResponse.json({ engines });
}
