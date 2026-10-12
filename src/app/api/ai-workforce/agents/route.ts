import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { createAgent } from '@/lib/ai-workforce/lifecycle';
import { guard, isGuardFailure, readJson } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.agent.read');
  if (isGuardFailure(admission)) return admission;
  try {
    const agents = await db.awfAgent.findMany({
      orderBy: [{ departmentId: 'asc' }, { slug: 'asc' }],
      select: {
        slug: true, name: true, description: true, purpose: true, role: true, status: true,
        latestVersionNo: true, activeVersionId: true, allowedRoles: true, lastRunAt: true, updatedAt: true,
        department: { select: { slug: true, name: true } },
        _count: { select: { runs: true, toolGrants: true, skillGrants: true, versions: true } },
      },
    });
    return ok({ agents, total: agents.length }, 'Agent registry');
  } catch (error) {
    return failFromError(error, 'Unable to list agents');
  }
}

export async function POST(request: Request) {
  const admission = await guard(request, 'awf.agent.create');
  if (isGuardFailure(admission)) return admission;
  const body = await readJson(request);
  if (!body.slug || !body.name || !body.departmentSlug) return fail('slug, name and departmentSlug are required', 422);
  try {
    const agent = await createAgent(
      {
        slug: String(body.slug),
        name: String(body.name),
        departmentSlug: String(body.departmentSlug),
        description: body.description ? String(body.description) : '',
        purpose: body.purpose ? String(body.purpose) : '',
        role: body.role ? String(body.role) : undefined,
        allowedRoles: Array.isArray(body.allowedRoles) ? body.allowedRoles.map(String) : ['SUPER_ADMIN', 'ADMIN'],
      },
      admission.actor
    );
    return ok({ slug: agent.slug, status: agent.status }, 'Agent created', 201);
  } catch (error) {
    return failFromError(error, 'Unable to create the agent', 400);
  }
}
