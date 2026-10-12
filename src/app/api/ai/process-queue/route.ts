import { NextRequest, NextResponse } from 'next/server';
import { taskProcessor } from '@/lib/ai/task-processor';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  try {
    const queueStats = await taskProcessor.getQueueStats();
    return NextResponse.json({ success: true, data: queueStats });
  } catch (error) {
    console.error('[process-queue] Failed to get queue stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve queue stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    let body: { limit?: number; batch?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, use defaults
    }

    let result: { processed: number; completed: number; failed: number };

    if (body.batch) {
      result = await taskProcessor.processBatch();
    } else {
      result = await taskProcessor.processNext(body.limit);
    }

    const queueStats = await taskProcessor.getQueueStats();

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        completed: result.completed,
        failed: result.failed,
        queueStats,
      },
    });
  } catch (error) {
    console.error('[process-queue] Failed to process queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process queue' },
      { status: 500 }
    );
  }
}
