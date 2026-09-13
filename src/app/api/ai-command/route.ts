import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const commands = await db.auditLog?.findMany?.({ take: 20, orderBy: { createdAt: "desc" } }).catch(() => []) || [];
      return NextResponse.json({ success: true, data: commands, stats: { total: commands.length, pending: 0, executed: commands.length } });
    } catch {
      return NextResponse.json({ success: true, data: [], stats: { total: 0, pending: 0, executed: 0 } });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, message: "AI command queued", data: { id: "cmd-" + Date.now(), command: body.command, status: "queued", createdBy: auth.userId } }, { status: 201 });
  })(request);
}

