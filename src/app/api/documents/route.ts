import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const where: any = {};
  if (studentId) where.studentId = studentId;
  const docs = await db.document.findMany({
    where,
    include: { student: true },
    orderBy: [{ studentId: "asc" }, { category: "asc" }],
  });
  return NextResponse.json({ documents: docs });
}

// Upload / replace a document (private storage, audit logged)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, category, name, fileName, fileType, fileSize, required, reviewedById } = body;
  if (!studentId || !category) {
    return NextResponse.json({ error: "studentId and category are required" }, { status: 400 });
  }
  const doc = await db.document.create({
    data: {
      studentId,
      category,
      name: name || category,
      required: required ?? true,
      fileName,
      fileType,
      fileSize,
      storagePath: `/private/docs/${studentId}/${category.toLowerCase()}.pdf`,
      status: "UPLOADED",
      uploadedAt: new Date(),
      reviewedById,
    },
  });
  await db.timelineEvent.create({
    data: {
      studentId,
      type: "DOC_UPLOADED",
      title: `${name || category} uploaded`,
      description: `Document ${name || category} was uploaded by student`,
    },
  });
  await db.auditLog.create({
    data: {
      userId: reviewedById,
      action: "DOC_UPLOAD",
      resource: "Document",
      resourceId: doc.id,
      details: JSON.stringify({ category, studentId }),
    },
  });
  return NextResponse.json({ document: doc, message: "Document uploaded. Under review by application team." });
}

// Update document status (approve / reject)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, rejectionReason, reviewedById } = body;
  const doc = await db.document.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
      reviewedById,
      reviewedAt: new Date(),
    },
  });
  await db.timelineEvent.create({
    data: {
      studentId: doc.studentId,
      type: status === "APPROVED" ? "DOC_APPROVED" : "DOC_REJECTED",
      title: `${doc.name} ${status.toLowerCase()}`,
      description: status === "REJECTED" ? rejectionReason : "Document approved by application team",
    },
  });
  await db.auditLog.create({
    data: {
      userId: reviewedById,
      action: status === "APPROVED" ? "DOC_APPROVE" : "DOC_REJECT",
      resource: "Document",
      resourceId: doc.id,
      details: JSON.stringify({ status, rejectionReason }),
    },
  });
  return NextResponse.json({ document: doc });
}
