import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

async function handleGet() {
  try {
    const [activeStudents, totalLeads, totalPartners, visaCases, unreadMessages] = await Promise.all([
      db.portalStudentProfile.count(),
      db.lead.count(),
      db.partnerProfile.count(),
      db.visaCase.count(),
      db.uccMessage.count({ where: { direction: 'inbound', status: { not: 'read' } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { activeStudents, totalLeads, totalPartners, visaCases, unreadMessages },
    });
  } catch (error) {
    console.error('[admin/dashboard/metrics] Database query failed.', {
      code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ success: false, error: 'Dashboard metrics are temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
