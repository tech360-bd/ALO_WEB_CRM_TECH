import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, logAuditAction } from "@/lib/auth-middleware";

// ============================================================
// SEC-B fix (2026-09-18): this route previously had NO authentication.
//   - GET leaked an entire student record to any anonymous caller, including
//     `password` and `otpCode` columns (returned by the `...student` spread),
//     plus documents, payments, interview sessions and INTERNAL counselor
//     notes for any student id.
//   - POST let any anonymous caller write internal/visible comments on any
//     student while supplying their own `authorId`/`authorRole`, forging both
//     the note's attribution and the audit log entry.
//
// Both handlers now require an authenticated staff (portal) session. Student
// portal tokens are deliberately NOT accepted here: this is a counselor view
// of other students' records. Authorship is taken from the verified session,
// never from the request body.
// ============================================================

const MAX_COMMENT_LENGTH = 4000;

/** Columns that must never leave the server on a student payload. */
const STUDENT_SENSITIVE_FIELDS = ["password", "otpCode", "otpExpiresAt"] as const;

function stripSensitiveStudent<T extends Record<string, unknown>>(student: T): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...student };
  for (const field of STUDENT_SENSITIVE_FIELDS) delete safe[field];
  return safe;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

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
    student: { ...stripSensitiveStudent(student as unknown as Record<string, unknown>), applications, visaCases, timelineEvents },
    internalComments,
    studentComments,
    sopDrafts,
    cvDrafts,
    communications,
  });
}

// Add comment (internal or student-visible)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, body: commentBody, visibility, commentType } = body ?? {};

  if (typeof commentBody !== "string" || commentBody.trim().length === 0) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }
  if (commentBody.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters` }, { status: 400 });
  }

  // Authorship comes from the verified session — a client-supplied
  // authorId/authorRole is ignored entirely.
  const authorId = auth.userId;
  const authorRole = auth.roles[0] ?? auth.userType;

  if (type === "internal") {
    const comment = await db.internalComment.create({
      data: { studentId: id, authorId, authorRole, content: commentBody, visibility: visibility || "INTERNAL_ONLY", commentType: commentType || "COUNSELOR_NOTE", editHistory: "[]" },
    });
    await db.auditLog.create({ data: { userId: authorId, action: "AI_ACTION", resource: "InternalComment", resourceId: comment.id, details: JSON.stringify({ visibility }) } });
    await logAuditAction(auth, "COMMENT_CREATE", "InternalComment", comment.id);
    return NextResponse.json({ comment });
  } else {
    const comment = await db.studentVisibleComment.create({
      data: { studentId: id, authorId, authorRole, content: commentBody },
    });
    await db.timelineEvent.create({
      data: { studentId: id, userId: authorId, stage: "communication", type: "MESSAGE_SENT", title: "Student-visible comment added", description: commentBody.slice(0, 100) },
    });
    await logAuditAction(auth, "COMMENT_CREATE", "StudentVisibleComment", comment.id);
    return NextResponse.json({ comment });
  }
}
