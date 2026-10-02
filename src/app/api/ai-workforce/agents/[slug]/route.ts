import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { guard, isGuardFailure } from '../../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const admission = await guard(request, 'awf.agent.read');
  if (isGuardFailure(admission)) return admission;
  const { slug } = await context.params;
  try {
    const agent = await db.awfAgent.findUnique({
      where: { slug },
      include: {
        department: { select: { slug: true, name: true } },
        versions: {
          orderBy: { versionNo: 'desc' },
          select: { id: true, versionNo: true, state: true, configHash: true, changeReason: true, createdAt: true, approvedAt: true, deployedAt: true },
        },
        toolGrants: { select: { permission: true, status: true, approvalRequired: true, maxCallsPerRun: true, tool: { select: { slug: true, riskLevel: true, requiresApproval: true } } } },
        skillGrants: { select: { status: true, skill: { select: { slug: true, name: true, permission: true } } } },
        testCases: { select: { id: true, name: true, critical: true, status: true } },
      },
    });
    if (!agent) return fail('Agent not found', 404);

    const activeVersion = agent.activeVersionId
      ? await db.awfAgentVersion.findUnique({
          where: { id: agent.activeVersionId },
          // The system instructions are deliberately NOT returned to clients.
          select: { versionNo: true, config: true, validationReport: true, testReport: true, memoryPolicy: true, modelPolicy: true },
        })
      : null;

    return ok({ agent: { ...agent, activeVersion } }, 'Agent detail');
  } catch (error) {
    return failFromError(error, 'Unable to load the agent');
  }
}
