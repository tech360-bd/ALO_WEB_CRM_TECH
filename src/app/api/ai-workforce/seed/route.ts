import { ok, failFromError } from '@/lib/ai-workforce/api';
import { seedAiWorkforce, seedInventory } from '@/lib/ai-workforce/seed';
import { guard, isGuardFailure, readJson } from '../_guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.agent.read');
  if (isGuardFailure(admission)) return admission;
  return ok(seedInventory(), 'Planned AI Workforce inventory');
}

/**
 * Installs or upgrades the ALO AI Workforce. Super Admin only — the seed
 * creates agents, grants tools and deploys versions through the normal gates.
 */
export async function POST(request: Request) {
  const admission = await guard(request, 'awf.model.manage');
  if (isGuardFailure(admission)) return admission;
  const body = await readJson(request);
  try {
    const result = await seedAiWorkforce(admission.actor, { runTests: body.runTests !== false });
    return ok(result, result.failures.length ? 'AI Workforce installed with failures' : 'AI Workforce installed', result.failures.length ? 422 : 200);
  } catch (error) {
    return failFromError(error, 'Installation failed');
  }
}
