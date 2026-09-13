import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const where: Record<string, string> = {};
  for (const key of ["channel", "category", "status", "language"]) { const value = req.nextUrl.searchParams.get(key); if (value) where[key] = value; }
  const templates = await db.communicationTemplate.findMany({ where, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateId, name, category, channel, language, body: templateBody, variables, createdBy } = body;
  if (!templateId || !name || !category || !channel || !templateBody) return NextResponse.json({ error: "templateId, name, category, channel, body are required" }, { status: 400 });
  const existing = await db.communicationTemplate.findFirst({ where: { templateCode: templateId } });
  if (existing) return NextResponse.json({ error: "templateId already exists" }, { status: 400 });
  const template = await db.communicationTemplate.create({ data: { templateCode: templateId, templateName: name, category, channel, language: language || "en", body: templateBody, variables: typeof variables === "string" ? variables : JSON.stringify(variables || []), status: "DRAFT", isLocked: false, createdBy: createdBy || "" } });
  return NextResponse.json({ template }, { status: 201 });
}
