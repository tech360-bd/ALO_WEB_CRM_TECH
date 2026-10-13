import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list quick replies, filter by channel/category/active
export async function GET(req: NextRequest) {
  try {
    const channel = req.nextUrl.searchParams.get("channel");
    const category = req.nextUrl.searchParams.get("category");
    const isActive = req.nextUrl.searchParams.get("isActive");

    const where: any = {};
    if (channel) where.channel = channel;
    if (category) where.category = category;
    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const replies = await db.quickReply.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ quickReplies: replies });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch quick replies" }, { status: 500 });
  }
}

// POST — create quick reply
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: replyBody, category, channel, shortcut, sortOrder, isActive, createdBy } = body;

    if (!title || !replyBody) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const reply = await db.quickReply.create({
      data: {
        title,
        body: replyBody,
        category: category || "GENERAL",
        channel: channel || "ALL",
        shortcut,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
        createdBy,
      },
    });
    return NextResponse.json({ quickReply: reply }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create quick reply" }, { status: 500 });
  }
}
