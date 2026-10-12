import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { ingestEvent } from '@/lib/ai-workforce/workflow-engine';
import { guard, isGuardFailure, readJson } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.workflow.read');
  if (isGuardFailure(admission)) return admission;
  try {
    const events = await db.awfEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { eventKey: true, eventType: true, source: true, status: true, entityType: true, entityId: true, attempts: true, lastError: true, processedAt: true, createdAt: true },
    });
    return ok({ events }, 'Event log');
  } catch (error) {
    return failFromError(error, 'Unable to load events');
  }
}

/** Event-driven trigger with an idempotency key; duplicates never re-execute. */
export async function POST(request: Request) {
  const admission = await guard(request, 'awf.workflow.trigger');
  if (isGuardFailure(admission)) return admission;
  const body = await readJson(request);
  if (!body.eventType) return fail('eventType is required', 422);
  try {
    const result = await ingestEvent({
      eventType: String(body.eventType),
      payload: (body.payload as Record<string, unknown>) ?? {},
      source: body.source ? String(body.source) : 'API',
      entityType: body.entityType ? String(body.entityType) : '',
      entityId: body.entityId ? String(body.entityId) : '',
      eventKey: body.eventKey ? String(body.eventKey) : undefined,
      actor: admission.actor,
      mode: 'PRODUCTION',
    });
    return ok(result, `Event ${result.status.toLowerCase()}`);
  } catch (error) {
    return failFromError(error, 'Unable to ingest the event', 400);
  }
}
