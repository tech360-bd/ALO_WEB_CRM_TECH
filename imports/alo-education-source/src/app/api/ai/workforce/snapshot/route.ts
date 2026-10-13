/**
 * GET  /api/ai/workforce/snapshot — Get latest workforce snapshot.
 * POST /api/ai/workforce/snapshot — Create or update today's workforce snapshot.
 *        Requires SUPER_ADMIN role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { updateWorkforceSnapshot } from '@/lib/ai/workforce-snapshot';

// ─── GET ──────────────────────────────────────────────────────
export async function GET() {
  try {
    let snapshot = await db.aiWorkforceSnapshot.findFirst({
      orderBy: { date: 'desc' },
    });

    // Compute on-the-fly if none exists
    if (!snapshot) {
      await updateWorkforceSnapshot();
      snapshot = await db.aiWorkforceSnapshot.findFirst({
        orderBy: { date: 'desc' },
      });
    }

    if (!snapshot) {
      return NextResponse.json({ error: 'Failed to generate snapshot' }, { status: 500 });
    }

    return NextResponse.json({ snapshot });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRole(request, ['SUPER_ADMIN']);
    if (error) return error;

    await updateWorkforceSnapshot();

    const snapshot = await db.aiWorkforceSnapshot.findFirst({
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
