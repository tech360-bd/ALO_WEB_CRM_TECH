import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

// ============================================================
// COUNSELOR DASHBOARD API — Real data from database
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (request, auth) => {
    try {
      // Get the employee profile for this user
      const employee = await db.employeeProfile.findFirst({
        where: { userId: auth.userId },
      });

      const employeeId = employee?.id || auth.userId;

      // Count assigned threads (inbox)
      const assignedThreads = await db.communicationThread.count({
        where: { assignedToId: employeeId, status: 'open' },
      });

      const unreadCount = await db.communicationMessage.count({
        where: { 
          senderType: 'student', 
          isRead: false,
        },
      });

      // Count tasks
      const pendingTasks = await db.counselorTask.count({
        where: { employeeId, status: 'pending' },
      });

      const overdueTasks = await db.counselorTask.count({
        where: { employeeId, status: 'pending', dueDate: { lt: new Date().toISOString().split('T')[0] } },
      });

      // Count students (threads where this counselor is assigned)
      const activeStudents = await db.communicationThread.count({
        where: { assignedToId: employeeId, status: 'open' },
      });

      // Count applications in progress
      const applicationsInProgress = await db.portalStudentApplication.count({
        where: { stage: { in: ['counseling', 'document_ready', 'submitted', 'under_review', 'offer_received'] } },
      });

      // Count documents pending review
      const documentsPending = await db.portalStudentDocument.count({
        where: { status: { in: ['pending', 'pending_review'] } },
      });

      // Get assigned threads with student info
      const threads = await db.communicationThread.findMany({
        where: { assignedToId: employeeId },
        take: 20,
        orderBy: { lastMessageAt: 'desc' },
      });

      // Get pending tasks
      const tasks = await db.counselorTask.findMany({
        where: { employeeId, status: 'pending' },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      // Get upcoming appointments (using AloAppointment for compatibility)
      const today = new Date().toISOString().split('T')[0];
      const appointments = await db.aloAppointment.findMany({
        where: { date: today, status: 'upcoming' },
        take: 5,
      });

      // ---- Real metric queries (parallelized) ----
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      weekStart.setHours(0, 0, 0, 0);

      const [
        newLeadsToday,
        hotLeads,
        partnerReferredStudents,
        sopDraftsPending,
        cvDraftsPending,
        unreadSocial,
        casPending,
        visaReadinessPending,
        englishTestWeak,
        aiInterviewHighRisk,
        weeklyLeadsTotal,
        weeklyLeadsConverted,
        commissionResult,
      ] = await Promise.all([
        db.partnerLead.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
        db.partnerLead.count({ where: { status: 'hot' } }),
        db.partnerLead.count({ where: { source: 'partner', status: { not: 'new' } } }),
        db.sopDraft.count({ where: { status: 'draft' } }),
        db.cvDraft.count({ where: { status: 'draft' } }),
        db.communicationThread.count({ where: { unreadCount: { gt: 0 }, assignedToId: employeeId } }),
        db.application.count({ where: { stage: 'cas_pending' } }),
        db.visaReadinessReport.count({ where: { overallScore: { lt: 60 } } }),
        db.studentEnglishTest.count({ where: { overallScore: { lt: 6.0 } } }),
        db.aiInterviewResult.count({ where: { visaRisk: { gt: 0.7 } } }),
        db.partnerLead.count({ where: { createdAt: { gte: weekStart } } }),
        db.partnerLead.count({ where: { createdAt: { gte: weekStart }, status: { in: ['converted', 'enrolled', 'offer_received'] } } }),
        db.employeeCommission.aggregate({ where: { employeeId, status: 'pending' }, _sum: { amount: true } }),
      ]);

      const weeklyConversionRate = weeklyLeadsTotal > 0
        ? Math.round((weeklyLeadsConverted / weeklyLeadsTotal) * 100)
        : 0;
      const commissionEstimate = commissionResult._sum.amount ?? 0;

      const data = {
        counselor: {
          name: auth.name,
          employeeId: employee?.employeeId || 'N/A',
          role: auth.roles[0] || 'counselor',
          branch: employee?.branch || 'Dhanmondi HQ',
          department: employee?.department || 'Counseling',
          isOnline: true,
          privacyModeOn: true,
        },
        metrics: {
          assignedLeads: assignedThreads,
          newLeadsToday,
          hotLeads,
          activeStudents: activeStudents,
          partnerReferredStudents,
          applicationsInProgress,
          documentsPending,
          sopCvDraftsPending: sopDraftsPending + cvDraftsPending,
          unreadWhatsApp: unreadCount,
          unreadSocial,
          slaOverdue: overdueTasks,
          followUpsDue: pendingTasks,
          offersReceived: await db.portalStudentApplication.count({ where: { stage: 'offer_received' } }),
          casPending,
          visaReadinessPending,
          englishTestWeak,
          aiInterviewHighRisk,
          weeklyConversionRate,
          commissionEstimate,
        },
        quickActions: [
          "add_lead", "search_student", "send_whatsapp", "request_documents",
          "generate_sop", "schedule_appointment", "start_ai_interview", "create_task",
          "open_inbox", "view_partner_students", "send_follow_up",
        ],
        slaAlerts: overdueTasks > 0 ? [{ threadId: '', studentId: '', student: 'Multiple', channel: 'system', eventType: 'warning', minutes: 0 }] : [],
        todayAppointments: appointments.map(a => ({
          id: a.id,
          student: a.counselor || 'Student',
          type: a.type,
          time: a.time,
          duration: parseInt(a.duration) || 30,
        })),
        recentThreads: threads.map(t => ({
          id: t.id.substring(0, 8),
          channel: t.channel,
          studentId: t.studentId || '',
          lastMessagePreview: t.lastMessagePreview,
          unread: t.unreadCount,
          status: t.status,
          lastMessageAt: t.lastMessageAt.toISOString(),
        })),
        pendingTasks: tasks.map(t => ({
          id: t.id.substring(0, 8),
          title: t.title,
          type: t.type,
          priority: t.priority,
          dueDate: t.dueDate,
          studentId: t.studentId,
        })),
      };

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('Counselor dashboard error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load counselor dashboard' },
        { status: 500 }
      );
    }
  })(request);
}
