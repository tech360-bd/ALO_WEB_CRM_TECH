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

  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const drafts = await db.sopDraft.findMany({ where: { studentId: access.studentId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { studentId: requestedStudentId, title, content, applicationId, universityName, courseName } = body as {
    studentId?: string;
    title?: string;
    content?: string;
    applicationId?: string;
    universityName?: string;
    courseName?: string;
  };
  if (!requestedStudentId || !title) return NextResponse.json({ error: "studentId and title required" }, { status: 400 });

  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;

  const draft = await db.sopDraft.create({
    data: {
      studentId: access.studentId,
      applicationId: applicationId || "",
      universityName: universityName || title,
      courseName: courseName || "",
      content: content || "",
      status: "DRAFT",
    },
  });
  await db.timelineEvent.create({
    data: {
      studentId: access.studentId,
      stage: "application",
      type: "NOTE",
      title: "SOP draft created",
      description: title,
      meta: JSON.stringify({ sopId: draft.id }),
    },
  }).catch(() => {});
  const body = await req.json();
  const { title, content, applicationId, universityName, courseName } = body;
  const access = await resolveStudentAccess(req, body.studentId || null);
  if (access instanceof NextResponse) return access;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const draft = await db.sopDraft.create({ data: { studentId: access.studentId, applicationId: applicationId || "", universityName: universityName || title, courseName: courseName || "", content: content || "", status: "DRAFT" } });
  await db.timelineEvent.create({ data: { studentId: access.studentId, stage: "application", type: "NOTE", title: "SOP draft created", description: title, meta: JSON.stringify({ sopId: draft.id }) } }).catch(() => {});
  return NextResponse.json({ draft });
}
