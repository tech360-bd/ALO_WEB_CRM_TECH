import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { approveVersion, deployVersion, rollbackAgent, setAgentStatus, testVersion, validateVersion } from '@/lib/ai-workforce/lifecycle';
import { guard, isGuardFailure, readJson } from '../../../_guard';
import type { AwfCapability } from '@/lib/ai-workforce/rbac';

export const dynamic = 'force-dynamic';

const CAPABILITY: Record<string, AwfCapability> = {
  validate: 'awf.agent.validate',
  test: 'awf.agent.test',
  approve: 'awf.agent.approve',
  deploy: 'awf.agent.deploy',
  rollback: 'awf.agent.rollback',
  pause: 'awf.agent.disable',
  disable: 'awf.agent.disable',
  archive: 'awf.agent.disable',
  activate: 'awf.agent.disable',
};

/**
 * Single lifecycle endpoint: DRAFT -> VALIDATE -> TEST -> APPROVE -> DEPLOY
 * -> ACTIVE -> PAUSED/DISABLED/ARCHIVED, plus rollback. Each action is
 * capability-checked independently; none can be skipped.
 */
export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await readJson(request);
  const action = String(body.action || '').toLowerCase();
  const capability = CAPABILITY[action];
  if (!capability) return fail(`Unknown lifecycle action "${action}"`, 422);

  const admission = await guard(request, capability);
  if (isGuardFailure(admission)) return admission;

  try {
    const agent = await db.awfAgent.findUnique({ where: { slug }, select: { id: true, activeVersionId: true, currentVersionId: true } });
    if (!agent) return fail('Agent not found', 404);

    const versionId = body.versionId
      ? String(body.versionId)
      : agent.currentVersionId || agent.activeVersionId || '';

    switch (action) {
      case 'validate': {
        const report = await validateVersion(versionId, admission.actor);
        return ok({ report }, report.passed ? 'Validation passed' : 'Validation failed', report.passed ? 200 : 422);
      }
      case 'test': {
        const report = await testVersion(versionId, admission.actor);
        return ok({ report }, report.passed ? 'Tests passed' : 'Tests failed', report.passed ? 200 : 422);
      }
      case 'approve': {
        const version = await approveVersion(versionId, admission.actor);
        return ok({ versionNo: version.versionNo, state: version.state }, 'Version approved');
      }
      case 'deploy': {
        const version = await deployVersion(versionId, admission.actor);
        return ok({ versionNo: version.versionNo, state: version.state }, 'Version deployed and agent activated');
      }
      case 'rollback': {
        const target = await rollbackAgent(slug, Number(body.versionNo), admission.actor);
        return ok({ versionNo: target.versionNo, state: target.state }, 'Rolled back to the selected version');
      }
      default: {
        const status = action === 'activate' ? 'ACTIVE' : (action.toUpperCase() as 'PAUSED' | 'DISABLED' | 'ARCHIVED');
        const updated = await setAgentStatus(slug, status, admission.actor);
        return ok({ status: updated.status }, `Agent ${updated.status.toLowerCase()}`);
      }
    }
  } catch (error) {
    return failFromError(error, 'Lifecycle action failed', 400);
  }
}
