import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const drafts = await db.cvDraft.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, title, content, cvType } = body;
  if (!studentId || !title) return NextResponse.json({ error: "studentId and title required" }, { status: 400 });
  const draft = await db.cvDraft.create({ data: { studentId, content: content || "", template: cvType || "STANDARD", status: "DRAFT" } });
  await db.timelineEvent.create({ data: { studentId, type: "NOTE", title: "CV draft created", description: title, meta: JSON.stringify({ cvId: draft.id }) } }).catch(() => {});
  return NextResponse.json({ draft });
}
