import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list templates, filter by channel/category/status
export async function GET(req: NextRequest) {
  try {
    const channel = req.nextUrl.searchParams.get("channel");
    const category = req.nextUrl.searchParams.get("category");
    const status = req.nextUrl.searchParams.get("status");
    const language = req.nextUrl.searchParams.get("language");

    const where: any = {};
    if (channel) where.channel = channel;
    if (category) where.category = category;
    if (status) where.status = status;
    if (language) where.language = language;

    const templates = await db.communicationTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch templates" }, { status: 500 });
  }
}

// POST — create template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, name, category, channel, language, subject, body: tplBody, variables, createdBy } = body;

    if (!templateId || !name || !category || !channel || !tplBody) {
      return NextResponse.json({ error: "templateId, name, category, channel, body are required" }, { status: 400 });
    }

    const existing = await db.communicationTemplate.findUnique({ where: { templateId } });
    if (existing) {
      return NextResponse.json({ error: "templateId already exists" }, { status: 400 });
    }

    const template = await db.communicationTemplate.create({
      data: {
        templateId,
        name,
        category,
        channel,
        language: language || "en",
        subject,
        body: tplBody,
        variables: typeof variables === "string" ? variables : JSON.stringify(variables || []),
        status: "DRAFT",
        isLocked: false,
        createdBy,
      },
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create template" }, { status: 500 });
  }
}
