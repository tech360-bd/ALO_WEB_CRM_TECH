// GET /api/super-admin/ai/departments — the 40 protected agent departments.

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { getAgentNetworkSummary } from '@/lib/super-admin/agent-network';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  try {
    const summary = await getAgentNetworkSummary();
    return NextResponse.json({
      success: true,
      clusterName: summary.clusterName,
      totalLogicalAgents: summary.totalLogicalAgents,
      departments: summary.departments,
      policies: summary.policies,
      warnings: summary.warnings,
    });
  } catch (error) {
    console.error('[super-admin/ai/departments] failed', error);
    return NextResponse.json({ success: false, error: 'Departments are temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
