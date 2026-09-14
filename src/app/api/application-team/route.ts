import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const applications = await db.application.findMany({ orderBy: { updatedAt: "desc" } });
  const studentIds = Array.from(new Set(applications.map((application) => application.studentId)));
  const students = await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, studentId: true, name: true, email: true, phone: true } });
  const studentMap = Object.fromEntries(students.map((student) => [student.id, student]));
  const documents = await db.document.findMany({ where: { status: { in: ["UPLOADED", "UNDER_REVIEW"] } }, include: { student: { select: { studentId: true, name: true } } }, orderBy: { uploadedAt: "desc" } });
  const partnerEmails = await db.partnerEmailUpdate.findMany({ where: { parsedStatus: "PENDING" }, orderBy: { createdAt: "desc" } });
  const stageCounts: Record<string, number> = {};
  for (const application of applications) stageCounts[application.stage] = (stageCounts[application.stage] || 0) + 1;
  const enrichedApplications = applications.map((application) => ({ ...application, student: studentMap[application.studentId] || null }));
  return NextResponse.json({
    metrics: { totalApplications: applications.length, documentsToReview: documents.length, pendingPartnerEmails: partnerEmails.length, submittedToday: applications.filter((application) => new Date(application.updatedAt).toDateString() === new Date().toDateString()).length },
    stageCounts, applications: enrichedApplications.slice(0, 20), documentsToReview: documents.slice(0, 20), partnerEmailUpdates: partnerEmails,
  });
}
