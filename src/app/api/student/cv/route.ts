import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudentResource } from "@/lib/student-resource-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestedStudentId = req.nextUrl.searchParams.get("studentId");
  if (!requestedStudentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;

  const drafts = await db.cvDraft.findMany({ where: { studentId: access.studentId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { studentId: requestedStudentId, title, content, cvType } = body as {
    studentId?: string;
    title?: string;
    content?: string;
    cvType?: string;
  };
  if (!requestedStudentId || !title) return NextResponse.json({ error: "studentId and title required" }, { status: 400 });

  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;

  const draft = await db.cvDraft.create({
    data: { studentId: access.studentId, content: content || `CV type: ${cvType || "STANDARD"}`, status: "DRAFT" },
  });
  await db.timelineEvent.create({
    data: {
      studentId: access.studentId,
      stage: "application",
      type: "NOTE",
      title: "CV draft created",
      description: title,
      meta: JSON.stringify({ cvId: draft.id }),
    },
  }).catch(() => {});
  return NextResponse.json({ draft });
}
