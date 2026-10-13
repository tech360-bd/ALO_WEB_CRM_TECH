import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// Simple in-memory cache
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

export async function GET(req: Request) {
  try {
    const { error } = await requireAuth(req);
    if (error) return error;

    // Return cached response if still valid
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const [
      leadTotal,
      leadNew,
      leadConverted,
      leadLost,
      leadBySourceRaw,
      appByStageRaw,
      appByCountryRaw,
      offerCountsRaw,
      visaCountsRaw,
      paymentSumRaw,
      commissionSumRaw,
      docCountsRaw,
      taskCountsRaw,
      apptCountsRaw,
      taskOverdue,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { status: 'NEW' } }),
      db.lead.count({ where: { status: 'CONVERTED' } }),
      db.lead.count({ where: { status: 'LOST' } }),
      db.$queryRawUnsafe<Array<{ source: string; cnt: number }>>(
        `SELECT source, COUNT(*) as cnt FROM Lead GROUP BY source`
      ),
      db.$queryRawUnsafe<Array<{ stage: string; cnt: number }>>(
        `SELECT stage, COUNT(*) as cnt FROM Application GROUP BY stage`
      ),
      db.$queryRawUnsafe<Array<{ country: string; cnt: number }>>(
        `SELECT country, COUNT(*) as cnt FROM Application GROUP BY country`
      ),
      db.$queryRawUnsafe<Array<{ status: string; cnt: number }>>(
        `SELECT status, COUNT(*) as cnt FROM Offer GROUP BY status`
      ),
      db.$queryRawUnsafe<Array<{ decision: string; cnt: number }>>(
        `SELECT decision, COUNT(*) as cnt FROM VisaApplication GROUP BY decision`
      ),
      db.$queryRawUnsafe<Array<{ total: string }>>(
        `SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total FROM Payment WHERE status = 'COMPLETED'`
      ),
      db.$queryRawUnsafe<Array<{ total: string }>>(
        `SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total FROM Commission WHERE status IN ('PAID', 'APPROVED')`
      ),
      db.$queryRawUnsafe<Array<{ status: string; cnt: number }>>(
        `SELECT status, COUNT(*) as cnt FROM ApplicationDocument GROUP BY status`
      ),
      db.$queryRawUnsafe<Array<{ status: string; cnt: number }>>(
        `SELECT status, COUNT(*) as cnt FROM Task GROUP BY status`
      ),
      db.$queryRawUnsafe<Array<{ status: string; cnt: number }>>(
        `SELECT status, COUNT(*) as cnt FROM Appointment GROUP BY status`
      ),
      db.task.count({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);

    // Build leads bySource
    const bySource: Record<string, number> = {};
    for (const row of leadBySourceRaw) {
      bySource[row.source] = Number(row.cnt);
    }

    // Build application byStage + total
    const appByStageMap: Record<string, number> = {};
    for (const row of appByStageRaw) {
      appByStageMap[row.stage] = Number(row.cnt);
    }
    const appTotal = Object.values(appByStageMap).reduce((a, b) => a + b, 0);

    // Build application byCountry
    const appByCountryMap: Record<string, number> = {};
    for (const row of appByCountryRaw) {
      appByCountryMap[row.country] = Number(row.cnt);
    }

    // Build offer counts
    const offerMap: Record<string, number> = {};
    let offerTotal = 0;
    for (const row of offerCountsRaw) {
      offerMap[row.status] = Number(row.cnt);
      offerTotal += Number(row.cnt);
    }

    // Build visa counts
    const visaMap: Record<string, number> = {};
    let visaTotal = 0;
    for (const row of visaCountsRaw) {
      if (row.decision) {
        visaMap[row.decision] = Number(row.cnt);
      }
      visaTotal += Number(row.cnt);
    }

    // Build document counts
    const docMap: Record<string, number> = {};
    let docTotal = 0;
    for (const row of docCountsRaw) {
      docMap[row.status] = Number(row.cnt);
      docTotal += Number(row.cnt);
    }

    // Build task counts
    const taskMap: Record<string, number> = {};
    let taskTotal = 0;
    for (const row of taskCountsRaw) {
      taskMap[row.status] = Number(row.cnt);
      taskTotal += Number(row.cnt);
    }

    // Build appointment counts
    const apptMap: Record<string, number> = {};
    let apptTotal = 0;
    for (const row of apptCountsRaw) {
      apptMap[row.status] = Number(row.cnt);
      apptTotal += Number(row.cnt);
    }

    // Revenue
    const totalPayments = paymentSumRaw[0]?.total ?? '0';
    const totalCommissions = commissionSumRaw[0]?.total ?? '0';

    const data = {
      leads: {
        total: leadTotal,
        new: leadNew,
        converted: leadConverted,
        lost: leadLost,
        bySource,
      },
      applications: {
        total: appTotal,
        byStage: appByStageMap,
        byCountry: appByCountryMap,
        byMonth: [] as string[],
      },
      offers: {
        total: offerTotal,
        accepted: offerMap['ACCEPTED'] ?? 0,
        declined: offerMap['DECLINED'] ?? 0,
        expired: offerMap['EXPIRED'] ?? 0,
      },
      visa: {
        total: visaTotal,
        approved: visaMap['APPROVED'] ?? 0,
        refused: visaMap['REJECTED'] ?? 0,
        pending: visaMap['PENDING'] ?? 0,
      },
      revenue: {
        totalPayments,
        totalCommissions,
        currency: 'GBP',
      },
      documents: {
        total: docTotal,
        verified: docMap['VERIFIED'] ?? 0,
        pending: (docMap['PENDING'] ?? 0) + (docMap['UPLOADED'] ?? 0) + (docMap['UNDER_REVIEW'] ?? 0),
        rejected: docMap['REJECTED'] ?? 0,
      },
      tasks: {
        total: taskTotal,
        completed: taskMap['COMPLETED'] ?? 0,
        overdue: taskOverdue,
      },
      appointments: {
        total: apptTotal,
        completed: apptMap['COMPLETED'] ?? 0,
        cancelled: (apptMap['CANCELLED'] ?? 0) + (apptMap['NO_SHOW'] ?? 0),
      },
    };

    // Cache the result
    cache = { data, ts: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching overview report:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
