import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { createAgentVersion } from '@/lib/ai-workforce/lifecycle';
import { guard, isGuardFailure, readJson } from '../../../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const admission = await guard(request, 'awf.agent.read');
  if (isGuardFailure(admission)) return admission;
  const { slug } = await context.params;
  try {
    const agent = await db.awfAgent.findUnique({ where: { slug }, select: { id: true } });
    if (!agent) return fail('Agent not found', 404);
    const versions = await db.awfAgentVersion.findMany({
      where: { agentId: agent.id },
      orderBy: { versionNo: 'desc' },
      select: { id: true, versionNo: true, state: true, configHash: true, changeReason: true, createdById: true, approvedById: true, deployedAt: true, createdAt: true },
    });
    return ok({ versions }, 'Version history');
  } catch (error) {
    return failFromError(error, 'Unable to load version history');
  }
}

/** Every configuration change produces a new immutable version in DRAFT. */
export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const admission = await guard(request, 'awf.agent.edit');
  if (isGuardFailure(admission)) return admission;
  const { slug } = await context.params;
  const body = await readJson(request);
  if (!body.config || typeof body.config !== 'object') return fail('config is required', 422);
  if (!body.systemInstructions) return fail('systemInstructions are required', 422);
  try {
    const version = await createAgentVersion(
      {
        agentSlug: slug,
        config: body.config as Record<string, unknown>,
        systemInstructions: String(body.systemInstructions),
        memoryPolicy: (body.memoryPolicy as Record<string, unknown>) ?? undefined,
        modelPolicy: (body.modelPolicy as Record<string, unknown>) ?? undefined,
        approvalPolicy: (body.approvalPolicy as Record<string, unknown>) ?? undefined,
        securityPolicy: (body.securityPolicy as Record<string, unknown>) ?? undefined,
        changeReason: body.changeReason ? String(body.changeReason) : '',
      },
      admission.actor
    );
    return ok({ versionId: version.id, versionNo: version.versionNo, state: version.state }, 'Version created', 201);
  } catch (error) {
    return failFromError(error, 'Unable to create the version', 400);
  }
}
