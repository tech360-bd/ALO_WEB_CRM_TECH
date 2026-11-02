// GET /api/super-admin/ai/agents/registry
//
// The addressable 2000-agent registry (40 departments × 50 micro-agents).
// Unlike /api/super-admin/ai/agents (summary + one department's persisted
// rows), this route returns the individual logical codes so an operator can
// look up ALO-VISA_INTERVIEW-014 and see whether it is materialised, paused
// or failed. A logical agent with no persisted row is reported as
// NOT_MATERIALISED — never as live.

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { getAgentRoster } from '@/lib/super-admin/agent-network';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const department = url.searchParams.get('department');
  const search = url.searchParams.get('search');
  const page = Number(url.searchParams.get('page') || 1);
  const pageSize = Number(url.searchParams.get('pageSize') || 50);

  try {
    const roster = await getAgentRoster({ department, search, page, pageSize });

    // Looking up the agent roster exposes the automation surface of the
    // platform; the read is audited like every other privileged read.
    if (search || department) {
      await logAuditAction(auth, 'AI_AGENT_REGISTRY_QUERIED', 'AiAgentRegistry', department || 'all', {
        search: search || '',
        department: department || 'all',
        page: roster.page,
      });
    }

    return NextResponse.json(roster);
  } catch (error) {
    console.error('[super-admin/ai/agents/registry] failed', error);
    return NextResponse.json(
      { success: false, error: 'Agent registry is temporarily unavailable.' },
      { status: 503 },
    );
  }
}

export const GET = withAuth(handleGet);
