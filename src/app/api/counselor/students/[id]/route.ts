import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCanonicalCounselor, visibleCounselorStudent } from '@/lib/counselor/student-access';
import { mutationOriginAllowed } from '@/lib/request-origin';

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCanonicalCounselor(req);
  if (auth instanceof NextResponse) return auth;

  try {
  const { id } = await params;
  const student = await visibleCounselorStudent(db, auth, id);
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const details = await db.student.findUnique({ where:{id}, select:{ documents:{orderBy:{category:'asc'}}, interviewSessions:{orderBy:{startedAt:'desc'}}, payments:true, studentNotifications:{take:5} } });
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
    student: { ...student, ...details, fullName:student.name, mobile:student.phone, profileCompletion:student.profileComplete, counselor:student.counselorId ? {id:student.counselorId, name:student.counselorName} : null, interviews:details?.interviewSessions, applications, visaCases, timelineEvents },
    internalComments: internalComments.map(c=>({...c, body:c.content})),
    studentComments: studentComments.map(c=>({...c, body:c.content})),
    sopDrafts,
    cvDrafts,
    communications,
  }, {headers:{'Cache-Control':'private, no-store'}});
  } catch { return NextResponse.json({error:'Student detail unavailable.'},{status:503}); }
}

// Add comment (internal or student-visible)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCanonicalCounselor(req);
  if (auth instanceof NextResponse) return auth;

  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({error:"Same-origin request required."},{status:403});
  const { id } = await params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, body: commentBody } = body ?? {};

  if (typeof commentBody !== "string" || commentBody.trim().length === 0) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }
  if (commentBody.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters` }, { status: 400 });
  }

  if (!['internal','student','visible'].includes(type)) return NextResponse.json({error:'Invalid comment type.'},{status:400});
  try {
    return await db.$transaction(async tx => {
      // Serializable transaction retains the assignment read lock through the
      // comment+audit write; reassignment cannot race this permission check.
      if (!await visibleCounselorStudent(tx, auth, id)) return NextResponse.json({error:'Not found'},{status:404});
      const authorId = auth.userId;
      const authorRole = auth.userType;
      const internal = type === 'internal';
      const comment = internal
        ? await tx.internalComment.create({data:{studentId:id, authorId, authorRole, content:commentBody.trim(), visibility:'INTERNAL_ONLY', commentType:'COUNSELOR_NOTE', editHistory:'[]'}})
        : await tx.studentVisibleComment.create({data:{studentId:id, authorId, authorRole, content:commentBody.trim()}});
      if (!internal) await tx.timelineEvent.create({data:{studentId:id, userId:authorId, stage:'communication', type:'MESSAGE_SENT', title:'Student-visible comment added', description:commentBody.slice(0,100)}});
      await tx.portalAuditLog.create({data:{actorUserId:auth.actorUserId, action:'COMMENT_CREATE', entityType:internal?'InternalComment':'StudentVisibleComment', entityId:comment.id, metadata:JSON.stringify({identityDomain:'user', studentId:id})}});
      return NextResponse.json({comment});
    }, { isolationLevel:'Serializable' });
  } catch { return NextResponse.json({error:'Comment could not be saved. Refresh before retrying.'},{status:503}); }
}
