import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — Application Manager dashboard
export async function GET() {
  const [applications, b2bApplications, b2bProviders, comments, documents, deadlines, tasks, statusLogs] = await Promise.all([
    db.application.findMany({ include: { student: { select: { studentId: true, fullName: true, email: true, mobile: true } } }, orderBy: { updatedAt: "desc" } }),
    db.b2bApplication.findMany({ include: { b2bProvider: true }, orderBy: { createdAt: "desc" } }),
    db.b2bProvider.findMany({ orderBy: { name: "asc" } }),
    db.applicationComment.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.applicationDocument.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.applicationDeadline.findMany({ where: { status: "PENDING" }, orderBy: { deadlineDate: "asc" } }),
    db.applicationTask.findMany({ where: { status: "PENDING" }, orderBy: { dueDate: "asc" } }),
    db.applicationStatusLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  // KPIs
  const kpis = {
    totalApplications: applications.length,
    newToday: applications.filter((a) => new Date(a.createdAt).toDateString() === new Date().toDateString()).length,
    direct: applications.filter((a) => !a.appTeamOfficerId).length,
    partner: applications.filter((a) => a.student?.email?.includes("partner")).length,
    b2b: b2bApplications.length,
    submitted: applications.filter((a) => a.stage === "APPLICATION_SUBMITTED").length,
    decisionPending: applications.filter((a) => a.stage === "APPLICATION_SUBMITTED" || a.stage === "CONDITIONAL_OFFFER").length,
    conditionalOffers: applications.filter((a) => a.stage === "CONDITIONAL_OFFFER").length,
    unconditionalOffers: applications.filter((a) => a.stage === "UNCONDITIONAL_OFFER").length,
    rejected: applications.filter((a) => a.stage === "VISA_REFUSED").length,
    documentsPending: documents.filter((d) => d.status === "MISSING" || d.status === "UNDER_REVIEW").length,
    casPending: applications.filter((a) => a.stage === "CAS_PENDING" || a.stage === "CAS_INTERVIEW").length,
    b2bConfidential: b2bApplications.length,
    urgentDeadlines: deadlines.filter((d) => new Date(d.deadlineDate) <= new Date(Date.now() + 3 * 86400000)).length,
    pendingTasks: tasks.length,
  };

  return NextResponse.json({
    kpis,
    applications: applications.slice(0, 20),
    b2bApplications,
    b2bProviders,
    comments,
    documents,
    deadlines,
    tasks,
    statusLogs,
  });
}
