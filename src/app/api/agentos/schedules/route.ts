import { NextRequest, NextResponse } from "next/server";
import { getSchedules, createSchedule } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  try {
    const agentId = req.nextUrl.searchParams.get("agentId") || undefined;
    const schedules = await getSchedules(agentId);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, cronExpression, inputPayload, name, timezone } = body;

    if (!agentId || !cronExpression || !inputPayload || !name) {
      return NextResponse.json({ error: "agentId, cronExpression, inputPayload, and name are required" }, { status: 400 });
    }

    const schedule = await createSchedule(agentId, cronExpression, inputPayload, name, timezone);
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}
