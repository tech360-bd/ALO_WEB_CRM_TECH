import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { upsertWorkflow, type WorkflowDefinition } from '@/lib/ai-workforce/workflow-engine';
import { guard, isGuardFailure, readJson } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.workflow.read');
  if (isGuardFailure(admission)) return admission;
  try {
    const workflows = await db.awfWorkflow.findMany({
      orderBy: { slug: 'asc' },
      select: {
        slug: true, name: true, description: true, triggerType: true, triggerEvent: true, status: true,
        eligible: true, version: true, definition: true, updatedAt: true,
        department: { select: { slug: true, name: true } },
        _count: { select: { runs: true } },
      },
    });
    return ok({ workflows, total: workflows.length }, 'Workflow registry');
  } catch (error) {
    return failFromError(error, 'Unable to load workflows');
  }
}

export async function POST(request: Request) {
  const admission = await guard(request, 'awf.workflow.manage');
  if (isGuardFailure(admission)) return admission;
  const body = await readJson(request);
  if (!body.slug || !body.name || !body.definition) return fail('slug, name and definition are required', 422);
  try {
    const workflow = await upsertWorkflow(
      {
        slug: String(body.slug),
        name: String(body.name),
        description: body.description ? String(body.description) : '',
        departmentSlug: body.departmentSlug ? String(body.departmentSlug) : undefined,
        triggerType: body.triggerType ? String(body.triggerType) : 'MANUAL',
        triggerEvent: body.triggerEvent ? String(body.triggerEvent) : '',
        definition: body.definition as WorkflowDefinition,
        status: body.status ? String(body.status) : 'ACTIVE',
        eligible: body.eligible !== false,
      },
      admission.actor
    );
    return ok({ slug: workflow.slug, version: workflow.version, status: workflow.status }, 'Workflow saved');
  } catch (error) {
    return failFromError(error, 'Unable to save the workflow', 400);
  }
}
