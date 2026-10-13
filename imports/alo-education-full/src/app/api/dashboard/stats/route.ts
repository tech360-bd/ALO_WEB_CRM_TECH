import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/* ------------------------------------------------------------------ */
/*  In-memory cache (30-second TTL)                                    */
/* ------------------------------------------------------------------ */

const cache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 30000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: Record<string, unknown>) {
  cache.set(key, { data, timestamp: Date.now() });
}

/* ------------------------------------------------------------------ */
/*  Application stage labels                                           */
/* ------------------------------------------------------------------ */

const APPLICATION_STAGES = [
  'COUNSELLING',
  'DOCUMENT_CHECK',
  'SUBMITTED',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'CAS_PENDING',
  'CAS_RECEIVED',
  'VISA_PREPARATION',
  'VISA_SUBMITTED',
  'VISA_GRANTED',
  'DEPARTURE_PREP',
  'ENROLLED',
  'WITHDRAWN',
  'REJECTED',
] as const;

/* ------------------------------------------------------------------ */
/*  GET — Dashboard stats for the authenticated user                   */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role as string;

    // Use user-specific cache key
    const cacheKey = `dashboard-stats:${userId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build role-aware where clauses
    const isStaff = !['STUDENT', 'PARTNER'].includes(userRole);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Parallel queries
    const [
      totalLeads,
      newLeads,
      totalStudents,
      totalApplications,
      applicationsByStageRaw,
      totalDocuments,
      pendingDocuments,
      pendingTasks,
      unreadMessages,
      totalUniversities,
      totalCourses,
      upcomingDeadlines,
      monthlyLeadsRaw,
      monthlyApplicationsRaw,
    ] = await Promise.all([
      // Total leads (staff sees all, student/partner sees none or own)
      isStaff
        ? db.lead.count()
        : Promise.resolve(0),

      // New leads (last 30 days)
      isStaff
        ? db.lead.count({ where: { status: 'NEW' } })
        : Promise.resolve(0),

      // Total students
      isStaff
        ? db.student.count()
        : Promise.resolve(0),

      // Total applications (staff: all, student: own studentId)
      db.application.count(
        !isStaff ? { where: { studentId: userId } } : undefined
      ),

      // Applications by stage
      db.application.groupBy({
        by: ['stage'],
        _count: { stage: true },
      }),

      // Total documents
      db.applicationDocument.count(),

      // Pending documents
      db.applicationDocument.count({
        where: { status: 'PENDING' },
      }),

      // Pending tasks (assigned to user or created by user)
      db.task.count({
        where: {
          status: 'TODO',
          OR: [
            { assignedToId: userId },
            { createdById: userId },
          ],
        },
      }),

      // Unread messages (received by user)
      db.message.count({
        where: {
          recipientId: userId,
          status: 'UNREAD',
        },
      }),

      // Total universities
      db.universityPage.count({
        where: { approvalStatus: 'PUBLISHED' },
      }),

      // Total courses
      db.coursePage.count({
        where: { approvalStatus: 'PUBLISHED' },
      }),

      // Upcoming deadlines (tasks due in next 7 days)
      db.task.count({
        where: {
          status: 'TODO',
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          OR: [
            { assignedToId: userId },
            { createdById: userId },
          ],
        },
      }),

      // Monthly leads (this year, grouped by month)
      db.$queryRaw<Array<{ month: string; count: bigint }>>(Prisma.sql`
        SELECT strftime('%m', createdAt) as month, COUNT(*) as count
        FROM Lead
        WHERE createdAt >= ${startOfYear.toISOString()}
        GROUP BY month
        ORDER BY month
      `),

      // Monthly applications (this year, grouped by month)
      db.$queryRaw<Array<{ month: string; count: bigint }>>(Prisma.sql`
        SELECT strftime('%m', createdAt) as month, COUNT(*) as count
        FROM Application
        WHERE createdAt >= ${startOfYear.toISOString()}
        GROUP BY month
        ORDER BY month
      `),
    ]);

    // Build applicationsByStage map
    const applicationsByStage: Record<string, number> = {};
    for (const stage of APPLICATION_STAGES) {
      applicationsByStage[stage] = 0;
    }
    for (const row of applicationsByStageRaw) {
      applicationsByStage[row.stage] = row._count.stage;
    }

    // Build monthly leads array (12 months, 0-indexed from Jan)
    const monthlyLeads = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const found = monthlyLeadsRaw.find((r) => r.month === m);
      return { month: i + 1, count: found ? Number(found.count) : 0 };
    });

    // Build monthly applications array
    const monthlyApplications = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const found = monthlyApplicationsRaw.find((r) => r.month === m);
      return { month: i + 1, count: found ? Number(found.count) : 0 };
    });

    const result = {
      totalLeads,
      newLeads,
      totalStudents,
      totalApplications,
      applicationsByStage,
      totalDocuments,
      pendingDocuments,
      pendingTasks,
      unreadMessages,
      totalUniversities,
      totalCourses,
      upcomingDeadlines,
      monthlyLeads,
      monthlyApplications,
    };

    setCache(cacheKey, result as unknown as Record<string, unknown>);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
