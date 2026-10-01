import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUnified, type UnifiedAuthContext } from "@/lib/unified-auth";

// Portal authentication includes STUDENT users too; a portal session is not
// staff authority. Keep dedicated StudentSession and portal student ownership
// equivalent, without remapping historical identifiers or broadening staff scope.
function isStudentActor(auth: UnifiedAuthContext): boolean {
  return auth.type === 'student' || auth.data.userType.toUpperCase() === 'STUDENT' || auth.data.roles.some(role => role.toUpperCase() === 'STUDENT');
}
async function ownStudentId(auth: UnifiedAuthContext): Promise<string | null> {
  if (auth.type === 'student') return auth.data.studentId;
  const student = await db.student.findFirst({ where: { userId: auth.data.userId }, select: { id: true } });
  return student?.id || null;
}

function reviewerId(auth: any): string | null {
  return auth.type === "portal" ? auth.data.userId : null;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  const studentId = req.nextUrl.searchParams.get("studentId");
  const where: { studentId?: string } = {};
  if (isStudentActor(auth)) {
    const ownId = await ownStudentId(auth);
    if (!ownId) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    if (studentId && studentId !== ownId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    where.studentId = ownId;
  } else if (studentId) where.studentId = studentId;
  const docs = await db.document.findMany({ where, include: { student: true }, orderBy: [{ studentId: "asc" }, { category: "asc" }] });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  let studentId = String(body.studentId || '');
  if (isStudentActor(auth)) {
    const ownId = await ownStudentId(auth);
    if (!ownId) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    if (studentId && studentId !== ownId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    studentId = ownId;
  }
  const { category, name, fileName, fileType, fileSize, required } = body;
  if (!studentId || !category) return NextResponse.json({ error: "studentId and category are required" }, { status: 400 });
  const actorId = reviewerId(auth);
  const doc = await db.document.create({
    data: {
      studentId, category, name: name || category, required: required ?? true,
      fileName: fileName || "", fileType: fileType || "application/octet-stream", fileSize: Number(fileSize || 0),
      storagePath: `/private/docs/${studentId}/${category.toLowerCase()}/${Date.now()}-${fileName || category}`,
      status: "UPLOADED", uploadedAt: new Date(), reviewedById: actorId,
    },
  });
  await db.timelineEvent.create({ data: { studentId, stage: "document_uploaded", title: `${name || category} uploaded`, description: `Document ${name || category} was uploaded`, actor: actorId || "student" } });
  await db.auditLog.create({ data: { userId: actorId || "", action: "DOC_UPLOAD", resource: "Document", resourceId: doc.id, details: JSON.stringify({ category, studentId }) } });
  return NextResponse.json({ document: doc, message: "Document uploaded. Under review by application team." });
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  if (isStudentActor(auth)) return NextResponse.json({ error: "Only staff can review documents" }, { status: 403 });
  const body = await req.json();
  const { id, status, rejectionReason } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const actorId = reviewerId(auth);
  const updated = await db.document.update({ where: { id }, data: { status, rejectionReason: status === "REJECTED" ? rejectionReason || "" : "", reviewedById: actorId, reviewedAt: new Date() } });
  await db.timelineEvent.create({ data: { studentId: doc.studentId, stage: status === "APPROVED" ? "document_approved" : "document_rejected", title: `${doc.name} ${String(status).toLowerCase()}`, description: status === "REJECTED" ? rejectionReason || "Document requires changes" : "Document approved by application team", actor: actorId || "application-team" } });
  await db.auditLog.create({ data: { userId: actorId || "", action: status === "APPROVED" ? "DOC_APPROVE" : "DOC_REJECT", resource: "Document", resourceId: id, details: JSON.stringify({ status, rejectionReason }) } });
  return NextResponse.json({ document: updated });
}
