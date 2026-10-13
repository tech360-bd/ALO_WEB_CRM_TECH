import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;

    const jobs = await db.agentResearchJob.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const distributions = await db.agentKnowledgeDistribution.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ jobs, distributions });
  } catch (error) {
    console.error('Research GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { topic, sourceType, targetAgents } = body;

    const job = await db.agentResearchJob.create({
      data: {
        agentKey: 'research_agent',
        topic: topic || 'General research',
        sourceType: sourceType || 'internal',
        targetAgents: targetAgents ? JSON.stringify(targetAgents) : null,
        status: 'queued',
      }
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Research POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
