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

  const student = await db.student.findUnique({ where: { id: studentId }, select: { id: true, profileComplete: true } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  const [documents, applications] = await Promise.all([
    db.document.findMany({ where: { studentId }, select: { status: true } }),
    db.application.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 1 }),
  ]);
  let nextAction = "Complete your profile to get started";
  let actionUrl = "student-profile";
  let priority = "HIGH";
  if (student.profileComplete < 50) nextAction = "Complete your profile — add your education, passport, and English test information";
  else if (student.profileComplete < 100) nextAction = "Your profile is almost complete. Add the remaining information to unlock course matching.";
  else {
    const pendingDocs = documents.filter((document) => ["PENDING", "PENDING_REVIEW"].includes(document.status));
    if (pendingDocs.length) { nextAction = `${pendingDocs.length} document(s) pending review. Check back soon for approval status.`; actionUrl = "document-hub"; }
    else if (!applications.length) { nextAction = "Your profile is complete! Use Course Finder to find and apply to your preferred courses."; actionUrl = "student-course-finder"; }
    else {
      const stage = applications[0].stage;
      if (["COUNSELING", "ELIGIBILITY_CHECKED", "DOCUMENTS_PENDING"].includes(stage)) { nextAction = "Upload your documents to progress your application"; actionUrl = "document-hub"; }
      else if (stage === "APPLICATION_SUBMITTED") { nextAction = "Your application has been submitted. Waiting for university response."; actionUrl = "applications"; }
      else if (["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(stage)) { nextAction = "Offer received! Pay your deposit to confirm your seat."; actionUrl = "finance-dashboard"; }
      else if (["DEPOSIT_PENDING", "CAS_PENDING", "CAS_ISSUED"].includes(stage)) { nextAction = "Prepare for your visa application. Complete the visa checklist."; actionUrl = "visa"; }
      else { nextAction = "Check your application status and next steps"; actionUrl = "applications"; }
    }
  }
  return NextResponse.json({ nextAction, actionUrl, priority, profileCompletion: student.profileComplete });
}
