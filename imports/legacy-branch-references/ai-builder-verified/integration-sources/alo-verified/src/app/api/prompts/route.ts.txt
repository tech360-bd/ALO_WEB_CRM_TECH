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
    const agentType = searchParams.get('agentType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (agentType) where.agentType = agentType;

    const [versions, total] = await Promise.all([
      db.promptVersion.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ agentType: 'asc' }, { version: 'desc' }],
      }),
      db.promptVersion.count({ where }),
    ]);

    // Get unique agent types
    const agentTypes = await db.promptVersion.findMany({
      select: { agentType: true },
      distinct: ['agentType'],
    });

    return NextResponse.json({ versions, total, page, limit, agentTypes: agentTypes.map(a => a.agentType) });
  } catch (error) {
    console.error('Prompts GET error:', error);
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
    const { agentType, prompt, changeNote, createdBy } = body;

    if (!agentType || !prompt) {
      return NextResponse.json({ error: 'Agent type and prompt are required' }, { status: 400 });
    }

    // Get current max version for this agent
    const latest = await db.promptVersion.findFirst({
      where: { agentType },
      orderBy: { version: 'desc' },
    });

    const version = (latest?.version || 0) + 1;

    const promptVersion = await db.promptVersion.create({
      data: {
        agentType,
        prompt,
        version,
        changeNote: changeNote || `Version ${version}`,
        createdBy: createdBy || 'admin',
      }
    });

    // Also update the AiAgent prompt
    try {
      await db.aiAgent.updateMany({
        where: { agentType },
        data: { prompt },
      });
    } catch {}

    return NextResponse.json({ success: true, promptVersion });
  } catch (error) {
    console.error('Prompts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action } = body;

    if (action === 'rollback' && id) {
      const version = await db.promptVersion.findUnique({ where: { id } });
      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      // Create a new version with the old prompt
      const latest = await db.promptVersion.findFirst({
        where: { agentType: version.agentType },
        orderBy: { version: 'desc' },
      });
      const newVersion = (latest?.version || 0) + 1;

      const promptVersion = await db.promptVersion.create({
        data: {
          agentType: version.agentType,
          prompt: version.prompt,
          version: newVersion,
          changeNote: `Rollback to version ${version.version}`,
          createdBy: 'admin',
        }
      });

      // Also update the AiAgent prompt
      try {
        await db.aiAgent.updateMany({
          where: { agentType: version.agentType },
          data: { prompt: version.prompt },
        });
      } catch {}

      return NextResponse.json({ success: true, promptVersion });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Prompts PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
