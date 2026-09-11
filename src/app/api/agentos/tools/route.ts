import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTools, getToolStats } from "@/lib/agentos";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  if (sp.get("stats") === "true") return NextResponse.json(await getToolStats());
  const tools = await getTools({ category: sp.get("category") || undefined, enabled: sp.get("enabled") === "true" ? true : undefined });
  return NextResponse.json({ tools });
}
