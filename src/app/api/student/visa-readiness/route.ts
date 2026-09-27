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
  const studentId = access.studentId;

  const checklist = await db.visaChecklistItem.findMany({ where: { studentId }, orderBy: { category: "asc" } });
  const assessment = await db.visaReadinessAssessment.findFirst({ where: { studentId }, orderBy: { createdAt: "desc" } });
  const docs = await db.document.findMany({ where: { studentId }, select: { category: true, status: true } });
  const approvedDocs = docs.filter(d => d.status === "APPROVED").length;
  const totalDocs = docs.length;
  const docScore = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
  const overallScore = assessment?.overallScore || Math.round((docScore + 50) / 2);
  const blockingItems = checklist.filter(c => c.isRequired && c.status !== "APPROVED");
  const riskLevel = blockingItems.length > 3 ? "HIGH_RISK" : blockingItems.length > 0 ? "NEEDS_DOCUMENT_UPDATE" : docScore > 80 ? "READY" : "HUMAN_REVIEW_REQUIRED";
  return NextResponse.json({ checklist, assessment, docScore, overallScore, riskLevel, blockingItems: blockingItems.length, totalItems: checklist.length });
}
