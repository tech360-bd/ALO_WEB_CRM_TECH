import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Counselor dashboard aggregate — scoped to a counselor (defaults to first COUNSELOR user)
export async function GET(req: NextRequest) {
  const counselorId = req.nextUrl.searchParams.get("counselorId");

  let counselor: Awaited<ReturnType<typeof db.user.findUnique>> = null;
  if (counselorId) {
    counselor = await db.user.findUnique({ where: { id: counselorId } });
  }
  if (!counselor) {
    counselor = await db.user.findFirst({ where: { role: "COUNSELOR" } });
  }
  if (!counselor) {
    return NextResponse.json({ error: "No counselor found" }, { status: 404 });
  }

  const hr = await db.employeeHR.findUnique({ where: { userId: counselor.id } });

  // Assigned students
  const assignedStudents = await db.student.findMany({
    where: { counselorId: counselor.id },
    include: { applications: true, documents: true },
  });

  // Assigned leads
  const assignedLeads = await db.lead.findMany({ where: { counselorId: counselor.id } });

  // Partner-referred students (those with partnerId set)
  const partnerStudents = await db.student.findMany({
    where: { partnerId: { not: null } },
    include: { counselor: true },
  });

  // Tasks
  const tasks = await db.task.findMany({ where: { assigneeId: counselor.id, status: { in: ["PENDING", "IN_PROGRESS"] } }, orderBy: { dueDate: "asc" } });

  // Appointments today/this week
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const appointments = await db.appointment.findMany({
    where: { counselorId: counselor.id, scheduledAt: { gte: now.toISOString(), lte: weekEnd.toISOString() }, status: "SCHEDULED" },
    orderBy: { scheduledAt: "asc" },
  });

  // Communication — unread
  const unreadMessages = await db.communicationMessage.findMany({
    where: { counselorId: counselor.id, direction: "INBOUND", read: false },
    orderBy: { receivedAt: "desc" },
  });

  // SLA events
  const slaEvents = await db.slaEvent.findMany({
    where: { counselorId: counselor.id, status: { in: ["PENDING", "ESCALATED_40", "ESCALATED_50"] } },
    orderBy: { receivedAt: "asc" },
  });

  // SOP drafts pending review
  const sopDrafts = await db.sopDraft.findMany({
    where: { counselorId: counselor.id, status: { in: ["DRAFT", "STUDENT_REVIEW", "COUNSELOR_REVIEW"] } },
  });

  // Performance
  const performance = await db.employeePerformance.findFirst({ where: { userId: counselor.id }, orderBy: { createdAt: "desc" } });

  // Commissions
  const commissions = await db.employeeCommission.findMany({ where: { userId: counselor.id } });

  // Compute metrics
  const activeApplications = assignedStudents.flatMap((s) => s.applications).filter((a) => !["VISA_APPROVED", "VISA_REFUSED", "ENROLLED"].includes(a.stage));
  const documentsPending = assignedStudents.flatMap((s) => s.documents).filter((d) => d.status === "PENDING").length;
  const offersReceived = assignedStudents.flatMap((s) => s.applications).filter((a) => ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage)).length;
  const casPending = assignedStudents.flatMap((s) => s.applications).filter((a) => ["CAS_PENDING", "CAS_INTERVIEW"].includes(a.stage)).length;

  // High-risk students (based on interview readiness)
  const interviews = await db.interviewSession.findMany({
    where: { student: { counselorId: counselor.id } },
    orderBy: { startedAt: "desc" },
  });
  const highRiskStudents = interviews.filter((i) => i.readiness === "high_risk" || i.readiness === "human_review_required").length;

  // Commission estimate
  const pendingCommission = commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amount, 0);
  const paidCommission = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0);

  return NextResponse.json({
    counselor,
    hr,
    metrics: {
      assignedLeads: assignedLeads.length,
      newLeadsToday: assignedLeads.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
      hotLeads: assignedLeads.filter((l) => l.status === "QUALIFIED").length,
      activeStudents: assignedStudents.length,
      partnerReferredStudents: partnerStudents.length,
      activeApplications: activeApplications.length,
      documentsPending,
      sopPending: sopDrafts.length,
      unreadWhatsApp: unreadMessages.filter((m) => m.channel === "WHATSAPP").length,
      unreadSocial: unreadMessages.filter((m) => ["FACEBOOK", "INSTAGRAM", "MESSENGER"].includes(m.channel)).length,
      slaOverdue: slaEvents.filter((e) => e.status === "ESCALATED_40" || e.status === "ESCALATED_50").length,
      followUpsDue: tasks.filter((t) => t.type === "FOLLOW_UP").length,
      offersReceived,
      casPending,
      visaReadinessPending: casPending,
      englishTestWeak: 3, // placeholder
      aiInterviewHighRisk: highRiskStudents,
      pendingCommission,
      paidCommission,
      todayAppointments: appointments.filter((a) => new Date(a.scheduledAt).toDateString() === new Date().toDateString()).length,
    },
    performance,
    tasks: tasks.slice(0, 8),
    appointments: appointments.slice(0, 5),
    unreadMessages: unreadMessages.slice(0, 6),
    slaEvents: slaEvents.slice(0, 5),
  });
}
