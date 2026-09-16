import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUnified } from "@/lib/unified-auth";

function reviewerId(auth: any): string | null {
  return auth.type === "portal" ? auth.data.userId : null;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (auth.type === "student" && studentId && studentId !== ("studentId" in auth.data ? auth.data.studentId : undefined)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const where: { studentId?: string } = {};
  if (studentId || auth.type === "student") where.studentId = studentId || ("studentId" in auth.data ? auth.data.studentId : undefined);
  const docs = await db.document.findMany({ where, include: { student: true }, orderBy: [{ studentId: "asc" }, { category: "asc" }] });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const studentId = auth.type === "student" ? ("studentId" in auth.data ? auth.data.studentId : undefined) : String(body.studentId || "");
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
  if (auth.type === "student") return NextResponse.json({ error: "Only staff can review documents" }, { status: 403 });
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
