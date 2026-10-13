import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET — SMS statistics                                                */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const [total, delivered, failed, sent, queued, undelivered] = await Promise.all([
      db.smsMessage.count(),
      db.smsMessage.count({ where: { status: 'DELIVERED' } }),
      db.smsMessage.count({ where: { status: 'FAILED' } }),
      db.smsMessage.count({ where: { status: 'SENT' } }),
      db.smsMessage.count({ where: { status: 'QUEUED' } }),
      db.smsMessage.count({ where: { status: 'UNDELIVERED' } }),
    ]);

    // By category
    const categoryStats = await db.smsMessage.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { category: { not: null } },
    });

    // By status
    const statusStats = await db.smsMessage.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Delivery rate
    const outboundTotal = total;
    const deliveryRate = outboundTotal > 0 ? ((delivered / outboundTotal) * 100).toFixed(1) : '0.0';
    const failureRate = outboundTotal > 0 ? ((failed / outboundTotal) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      stats: {
        total,
        delivered,
        sent,
        failed,
        queued,
        undelivered,
        deliveryRate: parseFloat(deliveryRate),
        failureRate: parseFloat(failureRate),
        byCategory: categoryStats.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
        byStatus: statusStats.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SMS stats' },
      { status: 500 },
    );
  }
}
