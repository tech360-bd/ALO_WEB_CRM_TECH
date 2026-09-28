import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/student-resource-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const drafts = await db.sopDraft.findMany({ where: { studentId: access.studentId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, applicationId, universityName, courseName } = body;
  const access = await resolveStudentAccess(req, body.studentId || null);
  if (access instanceof NextResponse) return access;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const draft = await db.sopDraft.create({ data: { studentId: access.studentId, applicationId: applicationId || "", universityName: universityName || title, courseName: courseName || "", content: content || "", status: "DRAFT" } });
  await db.timelineEvent.create({ data: { studentId: access.studentId, stage: "application", type: "NOTE", title: "SOP draft created", description: title, meta: JSON.stringify({ sopId: draft.id }) } }).catch(() => {});
  return NextResponse.json({ draft });
}
