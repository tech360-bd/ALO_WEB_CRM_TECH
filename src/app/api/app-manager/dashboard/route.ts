import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [applications, b2bApplications, b2bProviders, comments, documents, deadlines, tasks, statusLogs] = await Promise.all([
    db.application.findMany({ orderBy: { updatedAt: "desc" } }),
    db.b2bApplication.findMany({ orderBy: { createdAt: "desc" } }),
    db.b2bProvider.findMany({ orderBy: { name: "asc" } }),
    db.applicationComment.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.applicationDocument.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.applicationDeadline.findMany({ where: { status: "PENDING" }, orderBy: { deadlineDate: "asc" } }),
    db.applicationTask.findMany({ where: { status: "PENDING" }, orderBy: { dueDate: "asc" } }),
    db.applicationStatusLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const studentIds = Array.from(new Set(applications.map((application) => application.studentId)));
  const students = await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, studentId: true, name: true, email: true, phone: true } });
  const studentMap = Object.fromEntries(students.map((student) => [student.id, student]));
  const enrichedApplications = applications.map((application) => ({ ...application, student: studentMap[application.studentId] || null }));
  const kpis = {
    totalApplications: applications.length,
    newToday: applications.filter((application) => new Date(application.createdAt).toDateString() === new Date().toDateString()).length,
    direct: applications.filter((application) => !application.appTeamOfficerId).length,
    partner: applications.filter((application) => application.isB2b).length,
    b2b: b2bApplications.length,
    submitted: applications.filter((application) => application.stage === "APPLICATION_SUBMITTED").length,
    decisionPending: applications.filter((application) => ["APPLICATION_SUBMITTED", "CONDITIONAL_OFFFER"].includes(application.stage)).length,
    conditionalOffers: applications.filter((application) => application.stage === "CONDITIONAL_OFFFER").length,
    unconditionalOffers: applications.filter((application) => application.stage === "UNCONDITIONAL_OFFER").length,
    rejected: applications.filter((application) => application.stage === "VISA_REFUSED").length,
    documentsPending: documents.filter((document) => ["MISSING", "UNDER_REVIEW"].includes(document.status)).length,
    casPending: applications.filter((application) => ["CAS_PENDING", "CAS_INTERVIEW"].includes(application.stage)).length,
    b2bConfidential: b2bApplications.length,
    urgentDeadlines: deadlines.filter((deadline) => new Date(deadline.deadlineDate) <= new Date(Date.now() + 3 * 86400000)).length,
    pendingTasks: tasks.length,
  };
  return NextResponse.json({ kpis, applications: enrichedApplications.slice(0, 20), b2bApplications, b2bProviders, comments, documents, deadlines, tasks, statusLogs });
}
