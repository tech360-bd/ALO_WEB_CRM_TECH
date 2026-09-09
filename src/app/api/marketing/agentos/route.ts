import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── GET: List agent jobs or memory ───────────────────────────────────────────

export const GET = withAuth(async (request: Request, _auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'jobs') {
      return handleJobs(searchParams);
    }
    if (action === 'memory') {
      return handleMemory(searchParams);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=jobs or ?action=memory' },
      { status: 400 }
    );
  } catch (error) {
    console.error('AgentOS GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load agent data' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── List Agent Jobs ──────────────────────────────────────────────────────────

async function handleJobs(searchParams: URLSearchParams) {
  const status = searchParams.get('status') || undefined;
  const agentType = searchParams.get('agentType') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (agentType) where.agentType = agentType;

  const [jobs, total] = await Promise.all([
    db.marketingAgentJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.marketingAgentJob.count({ where }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─── List Agent Memory ────────────────────────────────────────────────────────

async function handleMemory(searchParams: URLSearchParams) {
  const agentName = searchParams.get('agentName') || undefined;
  const category = searchParams.get('category') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (agentName) where.agentName = agentName;
  if (category) where.category = category;

  const [memories, total] = await Promise.all([
    db.marketingAgentMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.marketingAgentMemory.count({ where }),
  ]);

  return NextResponse.json({
    memories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─── POST: Pause a job ────────────────────────────────────────────────────────

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'pause') {
      return handlePause(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=pause' },
      { status: 400 }
    );
  } catch (error) {
    console.error('AgentOS POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── Pause Job ────────────────────────────────────────────────────────────────

interface PauseInput {
  jobId: string;
}

async function handlePause(body: PauseInput, auth: AuthContext) {
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId is required' },
      { status: 400 }
    );
  }

  const job = await db.marketingAgentJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  if (job.status !== 'running') {
    return NextResponse.json(
      { error: `Cannot pause a job with status: ${job.status}` },
      { status: 400 }
    );
  }

  const updatedJob = await db.marketingAgentJob.update({
    where: { id: jobId },
    data: { status: 'paused' },
  });

  await createAuditLog({
    userId: auth.userId,
    role: auth.roles[0] || 'marketing',
    action: 'agentos.pause_job',
    resource: 'MarketingAgentJob',
    resourceId: jobId,
    details: { agentName: job.agentName, agentType: job.agentType },
  });

  return NextResponse.json({ job: updatedJob });
}
