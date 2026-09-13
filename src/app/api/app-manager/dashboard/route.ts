import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";
import { canViewB2B, calculateKPIs, mapStageToSafeStatus } from "@/lib/application-manager/service";

// GET — Application Manager dashboard with 17 KPI cards real DB
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  // RBAC: only APPLICATION_MANAGER, APPLICATION_TEAM, SUPER_ADMIN
  const roles = auth.roles.map(r => r.toLowerCase());
  const allowed = roles.includes('super_admin') || roles.includes('admin') || roles.includes('application_manager') || roles.includes('application_team');
  if (!allowed && !auth.permissions.includes('application.view') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Application Manager access required' }, { status: 403 });
  }

  try {
    const [applications, b2bApplications, b2bProviders, comments, documents, deadlines, tasks, statusLogs] = await Promise.all([
      db.application.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
      db.b2bApplication.findMany({ include: { b2bProvider: true }, orderBy: { createdAt: "desc" }, take: 100 }),
      db.b2bProvider.findMany({ orderBy: { name: "asc" } }),
      db.applicationComment.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.applicationDocument.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      db.applicationDeadline.findMany({ where: { status: { not: "COMPLETED" } }, orderBy: { deadlineDate: "asc" }, take: 50 }),
      db.applicationTask.findMany({ where: { status: "PENDING" }, orderBy: { dueDate: "asc" }, take: 50 }),
      db.applicationStatusLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    ]);

    // KPIs 17 cards real API
    const kpis = calculateKPIs(applications, b2bApplications, documents, deadlines, tasks);

    // Pipeline stages breakdown
    const stageBreakdown = applications.reduce((acc: any, app: any) => {
      acc[app.stage] = (acc[app.stage] || 0) + 1;
      return acc;
    }, {});

    // Source performance
    const sourceBreakdown = applications.reduce((acc: any, app: any) => {
      const src = app.applicationSource || 'UNKNOWN';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});

    // Country performance
    const countryBreakdown = applications.reduce((acc: any, app: any) => {
      const c = app.country || 'Unknown';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    // University response time (simplified)
    const universityResponse = Object.entries(stageBreakdown).map(([stage, count]) => ({ stage, count }));

    // B2B confidential alerts
    const confidentialAlerts = b2bApplications.filter((b: any) => b.b2bStatus === 'SUBMITTED' || !b.nextFollowupAt || new Date(b.nextFollowupAt) <= new Date()).slice(0, 10);

    // Deadline alerts
    const now = new Date();
    const dueToday = deadlines.filter((d: any) => {
      const dd = new Date(d.deadlineDate);
      return dd.toDateString() === now.toDateString();
    });
    const overdue = deadlines.filter((d: any) => new Date(d.deadlineDate) < now);

    return NextResponse.json({
      success: true,
      kpis,
      metrics: kpis, // backward compatibility
      applications: applications.slice(0, 20),
      b2bApplications: b2bApplications.slice(0, 20),
      b2bProviders,
      comments: comments.slice(0, 20),
      documents: documents.slice(0, 20),
      deadlines,
      tasks,
      statusLogs,
      breakdowns: {
        stages: stageBreakdown,
        sources: sourceBreakdown,
        countries: countryBreakdown,
        universityResponse,
      },
      alerts: {
        confidential: confidentialAlerts,
        dueToday,
        overdue,
        urgentDeadlines: deadlines.filter((d: any) => new Date(d.deadlineDate) <= new Date(Date.now() + 3 * 86400000)),
      },
    });
  } catch (e: any) {
    console.error('Dashboard error', e);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard', details: e.message }, { status: 500 });
  }
}
