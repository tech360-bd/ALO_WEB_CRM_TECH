// ALO Education workforce dispatcher. Reuses the enterprise workflow engine;
// it is NOT a general autonomous planning/RAG runtime. Only verified mappings
// may execute. Unsupported or human work is returned without a fake queue write.
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { isGlobalAiPaused } from '@/lib/ai-safety';
import { classifyWork } from '@/lib/work-classification-engine';
import { checkToolPermission } from '@/lib/tool-gateway';
import { runLeadScoring } from '@/lib/automation-engine';

export interface OrchestratorEvent {
  workflow: string;
  actionType: string;
  payload: Record<string, unknown>;
  actor?: string;
  targetType?: string;
  targetId?: string | null;
  /** AgentDepartment id, not a client-selected agent id. */
  department?: string;
  correlationId?: string;
}
export interface OrchestratorResult {
  status: 'COMPLETED' | 'ALREADY_COMPLETED' | 'FAILED' | 'SKIPPED_PAUSED' | 'UNSUPPORTED' | 'HUMAN_REQUIRED' | 'RECONCILE_REQUIRED';
  classification: ReturnType<typeof classifyWork>;
  steps: Array<{ step: string; ok: boolean; note?: string; at: string }>;
  latencyMs: number;
  correlationId: string;
}

export async function runOrchestrated(event: OrchestratorEvent): Promise<OrchestratorResult> {
  const started = Date.now();
  const correlationId = event.correlationId || randomUUID();
  const classification = classifyWork({ workflow: event.workflow, actionType: event.actionType });
  const result = (status: OrchestratorResult['status'], step: string, ok: boolean, note: string): OrchestratorResult => ({
    status, classification, steps: [{ step, ok, note, at: new Date().toISOString() }], latencyMs: Date.now() - started, correlationId,
  });
  if (classification.class !== 'AI_AUTOMATABLE') {
    return result('HUMAN_REQUIRED', 'classification', false, 'No automatic execution or action-bound approval queue is implemented for this workflow');
  }
  if (event.workflow !== 'lead_scoring' || event.actionType !== 'LEAD_SCORING' || event.targetType !== 'Lead' || !event.targetId || Object.keys(event.payload).length) {
    return result('UNSUPPORTED', 'dispatch', false, 'Supported mapping: lead_scoring / LEAD_SCORING / Lead with an empty payload');
  }
  if (!event.actor || !event.department) return result('FAILED', 'authorization', false, 'Authenticated actor and AgentDepartment id required');
  if (await isGlobalAiPaused()) return result('SKIPPED_PAUSED', 'pause', false, 'GLOBAL_AI_PAUSED');
  // Do not turn AiEmployee catalog entries into AgentDefinition runtime identities.
  const agents = await db.agentDefinition.findMany({ where: { departmentId: event.department, status: 'active' }, orderBy: { id: 'asc' } });
  let agentId: string | undefined;
  for (const agent of agents) {
    if ((await checkToolPermission('scoreLead', { agentId: agent.id, department: event.department, actorUserId: event.actor })).allowed) { agentId = agent.id; break; }
  }
  if (!agentId) return result('FAILED', 'authorization', false, 'No active AgentDefinition with a scoreLead tool grant');
  await db.crmAuditLog.create({ data: {
    actorUserId: event.actor, action: 'WORKFORCE_DISPATCH', targetCollection: 'Lead', targetId: event.targetId,
    afterData: JSON.stringify({ correlationId, agentId, workflow: event.workflow }),
  } });
  // Engine owns canonical lead_scoring:<target> deduplication, before side effects.
  // No second workflow engine, LLM plan, caller key or separate success event.
  const outcome = await runLeadScoring(event.targetId);
  if (!outcome.success) return result('RECONCILE_REQUIRED', 'workflow', false, 'Failed/in-progress claim may include applied effects; reconcile before retrying. This endpoint will not rerun it.');
  return result(outcome.skipped ? 'ALREADY_COMPLETED' : 'COMPLETED', 'workflow', true, outcome.automationEventId || 'Persisted workflow result');
}
