import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTasks, getTaskStats, createTask } from "@/lib/agentos";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  if (sp.get("stats") === "true") return NextResponse.json(await getTaskStats());
  const tasks = await getTasks({ status: sp.get("status") || undefined, limit: sp.get("limit") ? parseInt(sp.get("limit")!) : 50 });
  return NextResponse.json({ tasks });
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const task = await createTask(body);
  return NextResponse.json({ task }, { status: 201 });
}
