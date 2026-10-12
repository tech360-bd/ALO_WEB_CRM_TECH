import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const student = await db.student.findUnique({ where: { id: studentId }, include: { documents: true, applications: { take: 1, orderBy: { createdAt: "desc" } } } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  let nextAction = "Complete your profile to get started";
  let actionUrl = "student-profile";
  let priority = "HIGH";

  if (student.profileCompletion < 50) {
    nextAction = "Complete your profile — add your education, passport, and English test information";
    actionUrl = "student-profile";
  } else if (student.profileCompletion < 100) {
    nextAction = "Your profile is almost complete. Add the remaining information to unlock course matching.";
    actionUrl = "student-profile";
  } else {
    const pendingDocs = student.documents.filter(d => d.status === "PENDING" || d.status === "PENDING_REVIEW");
    if (pendingDocs.length > 0) {
      nextAction = `${pendingDocs.length} document(s) pending review. Check back soon for approval status.`;
      actionUrl = "document-hub";
    } else if (student.applications.length === 0) {
      nextAction = "Your profile is complete! Use Course Finder to find and apply to your preferred courses.";
      actionUrl = "student-course-finder";
    } else {
      const latestApp = student.applications[0];
      const stage = latestApp.stage;
      if (stage === "COUNSELING" || stage === "ELIGIBILITY_CHECKED") {
        nextAction = "Upload your documents to progress your application";
        actionUrl = "document-hub";
      } else if (stage === "DOCUMENTS_PENDING" || stage === "DOCUMENTS_RECEIVED") {
        nextAction = "Your documents are being reviewed. Your application will be submitted soon.";
        actionUrl = "applications";
      } else if (stage === "APPLICATION_SUBMITTED") {
        nextAction = "Your application has been submitted. Waiting for university response.";
        actionUrl = "applications";
      } else if (stage === "CONDITIONAL_OFFFER" || stage === "UNCONDITIONAL_OFFER") {
        nextAction = "Offer received! Pay your deposit to confirm your seat.";
        actionUrl = "finance-dashboard";
      } else if (stage === "DEPOSIT_PENDING" || stage === "CAS_PENDING" || stage === "CAS_ISSUED") {
        nextAction = "Prepare for your visa application. Complete the visa checklist.";
        actionUrl = "visa";
      } else if (stage === "VISA_SUBMITTED" || stage === "VISA_DECISION_PENDING") {
        nextAction = "Visa application submitted. Waiting for decision.";
        actionUrl = "visa";
      } else if (stage === "VISA_APPROVED") {
        nextAction = "Visa approved! Complete your pre-departure checklist.";
        actionUrl = "student-dashboard";
      } else {
        nextAction = "Check your application status and next steps";
        actionUrl = "applications";
      }
    }
  }
  return NextResponse.json({ nextAction, actionUrl, priority, profileCompletion: student.profileCompletion });
}
