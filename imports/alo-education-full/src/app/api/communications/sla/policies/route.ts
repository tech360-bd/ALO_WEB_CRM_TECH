import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list SLA policies
export async function GET(req: NextRequest) {
  try {
    const channel = req.nextUrl.searchParams.get("channel");
    const priority = req.nextUrl.searchParams.get("priority");
    const isActive = req.nextUrl.searchParams.get("isActive");

    const where: any = {};
    if (channel) where.channel = channel;
    if (priority) where.priority = priority;
    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const policies = await db.slaPolicy.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ policies });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch SLA policies" }, { status: 500 });
  }
}

// POST — create SLA policy
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      channel,
      priority,
      studentType,
      applicationStage,
      messageIntent,
      slaMinutes,
      warningMinutes,
      urgentMinutes,
      overdueMinutes,
      escalationMinutes,
      businessHoursOnly,
      holidayCalendar,
      isActive,
    } = body;

    if (!name || !channel) {
      return NextResponse.json({ error: "name and channel are required" }, { status: 400 });
    }

    const policy = await db.slaPolicy.create({
      data: {
        name,
        channel,
        priority: priority || "NORMAL",
        studentType: studentType || "ALL",
        applicationStage: applicationStage || "ALL",
        messageIntent: messageIntent || "ALL",
        slaMinutes: typeof slaMinutes === "number" ? slaMinutes : 30,
        warningMinutes: typeof warningMinutes === "number" ? warningMinutes : 20,
        urgentMinutes: typeof urgentMinutes === "number" ? urgentMinutes : 28,
        overdueMinutes: typeof overdueMinutes === "number" ? overdueMinutes : 30,
        escalationMinutes: typeof escalationMinutes === "number" ? escalationMinutes : 45,
        businessHoursOnly: typeof businessHoursOnly === "boolean" ? businessHoursOnly : false,
        holidayCalendar: typeof holidayCalendar === "string" ? holidayCalendar : (holidayCalendar ? JSON.stringify(holidayCalendar) : null),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json({ policy }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create SLA policy" }, { status: 500 });
  }
}
