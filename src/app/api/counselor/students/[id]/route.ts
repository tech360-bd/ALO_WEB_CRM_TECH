import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await db.student.findUnique({
    where: { id },
    include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { orderBy: { startedAt: "desc" } }, payments: true, studentNotifications: { take: 5 } },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [applications, visaCases, timelineEvents] = await Promise.all([
    db.application.findMany({ where: { studentId: id } }),
    db.visaCase.findMany({ where: { studentId: id } }),
    db.timelineEvent.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  // Comments
  const [internalComments, studentComments] = await Promise.all([
    db.internalComment.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" } }),
    db.studentVisibleComment.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  // SOP/CV drafts
  const sopDrafts = await db.sopDraft.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" } });
  const cvDrafts = await db.cvDraft.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" } });

  // Communications
  const communications = await db.communicationMessage.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    student: { ...student, applications, visaCases, timelineEvents },
    internalComments,
    studentComments,
    sopDrafts,
    cvDrafts,
    communications,
  });
}

// Add comment (internal or student-visible)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { type, body: commentBody, authorId, authorRole, visibility, commentType } = body;

  if (type === "internal") {
    const comment = await db.internalComment.create({
      data: { studentId: id, authorId, authorRole, content: commentBody, visibility: visibility || "INTERNAL_ONLY", commentType: commentType || "COUNSELOR_NOTE", editHistory: "[]" },
    });
    await db.auditLog.create({ data: { userId: authorId, action: "AI_ACTION", resource: "InternalComment", resourceId: comment.id, details: JSON.stringify({ visibility }) } });
    return NextResponse.json({ comment });
  } else {
    const comment = await db.studentVisibleComment.create({
      data: { studentId: id, authorId, authorRole, content: commentBody },
    });
    await db.timelineEvent.create({
      data: { studentId: id, userId: authorId, stage: "communication", type: "MESSAGE_SENT", title: "Student-visible comment added", description: commentBody.slice(0, 100) },
    });
    return NextResponse.json({ comment });
  }
}
