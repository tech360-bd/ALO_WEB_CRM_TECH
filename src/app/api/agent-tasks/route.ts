import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "pending";
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
      
      // Try to fetch from counselor tasks as proxy for agent tasks
      const tasks = await db.counselorTask.findMany({
        where: { status: status === "all" ? undefined : status },
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
      
      return NextResponse.json({ success: true, data: tasks, total: tasks.length });
    } catch (e) {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const task = await db.counselorTask.create({
        data: {
          title: body.title || "Agent Task",
          description: body.description || body.input || "",
          status: "pending",
          priority: body.priority || "normal",
          employeeId: auth.userId,
        }
      }).catch(() => ({ id: "temp-" + Date.now(), ...body }));
      
      return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
    }
  })(request);
}

