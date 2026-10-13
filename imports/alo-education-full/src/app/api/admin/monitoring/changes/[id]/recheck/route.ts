import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recheckSource } from '@/lib/university-monitoring-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get the DataChange with its OfficialSource
    const change = await db.dataChange.findUnique({
      where: { id },
      include: { source: true },
    });

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    }

    if (!change.source) {
      return NextResponse.json({ error: 'No source associated with this change' }, { status: 400 });
    }

    // 2. Call recheckSource from the monitoring engine
    const recheckResult = await recheckSource(change.source, change);

    // 3. Determine new status based on confidence
    let newStatus: string;
    if (recheckResult.confidence >= 0.9) {
      newStatus = 'HIGH_CONFIDENCE';
    } else if (recheckResult.confidence < 0.5) {
      newStatus = 'NEEDS_REVIEW';
    } else {
      // Keep current status if confidence is between 0.5 and 0.9
      newStatus = change.status;
    }

    // 4. Update the DataChange with new results
    const updated = await db.dataChange.update({
      where: { id },
      data: {
        confidence: recheckResult.confidence,
        aiExplanation: recheckResult.aiExplanation,
        status: newStatus,
        newValue: recheckResult.newValue,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        changeType: true,
        fieldName: true,
        oldValue: true,
        newValue: true,
        confidence: true,
        status: true,
        impactLevel: true,
        aiExplanation: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, change: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Recheck failed', details: message }, { status: 500 });
  }
}
