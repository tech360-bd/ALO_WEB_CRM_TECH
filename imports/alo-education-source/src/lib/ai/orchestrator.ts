/**
 * ALO Education — Agent Orchestrator
 * Task ID: 7-ai-gateway
 *
 * Manages the full agent execution lifecycle:
 *   EVENT → TASK_CLASSIFICATION → AGENT_SELECTION → LOAD_CONTEXT
 *   → LOAD_SKILLS → LOAD_PROMPT → LOAD_RAG → LOAD_MEMORY → PLAN
 *   → CHECK_PERMISSIONS → EXECUTE_TOOLS → VALIDATE → UPDATE_DATABASE
 *   → LOG → COMPLETE → REPORT
 *
 * If human approval required:
 *   → APPROVAL_GATE → HUMAN → APPROVE/REJECT/EDIT → EXECUTE
 */

import { db } from '@/lib/db';
import { aiGateway } from './gateway';
import { modelRouter } from './model-router';
import { executeTool } from './tool-gateway';
import { automationEngine } from './automation-engine';
import { memoryStore } from './memory';
import { updateWorkforceSnapshot } from './workforce-snapshot';
import type {
  OrchestrationRequest,
  OrchestrationResult,
  SafetyLimits,
  AgentRecord,
  ProviderType,
  RequestPriority,
  AutomationClass,
} from './types';
import { priorityToInt, priorityWeight } from './types';

// ============================================================
// DEFAULTS
// ============================================================

const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  maxSteps: 10,
  maxRuntimeMs: 30_000,
  maxToolCalls: 20,
  maxTokens: 4096,
  maxRetries: 3,
  maxDepth: 3,
};

const MAX_DELEGATION_DEPTH = 3;
const MAX_TOTAL_STEPS = 10;

// ============================================================
// ORCHESTRATOR
// ============================================================

/**
 * Orchestrate an AI task from start to finish.
 *
 * @param req - orchestration request with task type, input, and options
 * @param depth - current delegation depth (for agent-to-agent calls)
 */
export async function orchestrate(
  req: OrchestrationRequest,
  depth: number = 0
): Promise<OrchestrationResult> {
  const overallStart = Date.now();
  let taskId = '';
  let agent: AgentRecord | null = null;
  let totalTokens = 0;
  let stepsExecuted = 0;
  let provider: ProviderType = 'groq';
  let model = 'llama-3.3-70b-versatile';

  // Track whether we are reusing an existing task (from task-processor) or creating a new one
  const isExistingTask = !!req.existingTaskId;
  let effectiveAutomationClass: AutomationClass = 'AI_AUTOMATABLE';

  try {
    // --------------------------------------------------------
    // 1. TASK_CLASSIFICATION — evaluate automation policy
    // --------------------------------------------------------
    const evaluation = automationEngine.evaluate(req.taskType, req.automationClass);
    effectiveAutomationClass = evaluation.automationClass;
    console.log(
      `[Orchestrator] Task classified: ${req.taskType} → ${evaluation.automationClass}` +
      (evaluation.requiresApproval ? ' (approval required)' : '')
    );

    // --------------------------------------------------------
    // 2. AGENT_SELECTION
    // --------------------------------------------------------
    agent = await selectAgent(req.departmentCode, req.agentCode, req.taskType);
    if (!agent) {
      throw new Error(
        `No agent found for dept=${req.departmentCode ?? '-'} code=${req.agentCode ?? '-'} task=${req.taskType}`
      );
    }

    console.log(
      `[Orchestrator] Agent selected: ${agent.code} (${agent.name}) in ${agent.department}`
    );

    // --------------------------------------------------------
    // 3. CREATE OR REUSE AiTask record
    // --------------------------------------------------------
    if (isExistingTask) {
      // Reuse the existing task from the task-processor (avoid duplicate records)
      taskId = req.existingTaskId!;
      console.log(`[Orchestrator] Reusing existing task ${taskId}`);
      await logTaskEvent(taskId, 'ORCHESTRATION_STARTED', 'INFO',
        `Orchestrator picked up existing task for ${req.taskType}`
      );
    } else {
      // Direct orchestration call — create a new AiTask record
      const aiTask = await db.aiTask.create({
        data: {
          agentId: agent.id,
          departmentId: agent.departmentId,
          type: req.taskType,
          priority: priorityToInt(req.priority ?? 'normal'),
          status: 'RUNNING',
          automationClass: evaluation.automationClass,
          input: JSON.stringify(req.input),
          requiresApproval: evaluation.requiresApproval || req.requiresApproval || false,
          approvalStatus: evaluation.requiresApproval ? 'PENDING' : null,
          metadata: JSON.stringify({
            userId: req.userId ?? null,
            depth,
            taskType: req.taskType,
          }),
          startedAt: new Date(),
        },
      });
      taskId = aiTask.id;

      await logTaskEvent(taskId, 'TASK_CREATED', 'INFO',
        `Agent ${agent.code} assigned for ${req.taskType}`
      );
    }

    // --------------------------------------------------------
    // 3.5 HUMAN_REQUIRED GATE — block AI execution entirely
    // --------------------------------------------------------
    if (effectiveAutomationClass === 'HUMAN_REQUIRED') {
      await db.aiTask.update({
        where: { id: taskId },
        data: { status: 'ESCALATED' },
      });
      await logTaskEvent(taskId, 'HUMAN_REQUIRED', 'WARN',
        `Task type ${req.taskType} requires human handling — AI execution blocked`
      );
      return {
        success: true,
        taskId,
        status: 'ESCALATED',
        result: { message: 'Task requires human handling. AI execution blocked per policy.', reason: evaluation.reason },
        requiresApproval: false,
        latencyMs: Date.now() - overallStart,
        stepsExecuted: 0,
        tokensUsed: 0,
        provider,
        model,
      };
    }

    // --------------------------------------------------------
    // 4. APPROVAL GATE — if human approval required, stop here
    // --------------------------------------------------------
    if (evaluation.requiresApproval || req.requiresApproval) {
      await db.aiTask.update({
        where: { id: taskId },
        data: { status: 'PENDING_APPROVAL' },
      });
      await logTaskEvent(taskId, 'APPROVAL_GATE', 'INFO',
        'Task requires human approval before execution'
      );

      return {
        success: true,
        taskId,
        status: 'PENDING_APPROVAL',
        result: { message: 'Task awaiting human approval' },
        requiresApproval: true,
        approvalStatus: 'PENDING',
        latencyMs: Date.now() - overallStart,
        stepsExecuted: 0,
        tokensUsed: 0,
        provider,
        model,
      };
    }

    // --------------------------------------------------------
    // 5. LOAD_CONTEXT — gather relevant data from DB
    // --------------------------------------------------------
    await logTaskEvent(taskId, 'LOAD_CONTEXT', 'INFO', 'Loading context data');
    const context = await loadContext(req);

    // --------------------------------------------------------
    // 6. LOAD_MEMORY — retrieve agent/task memory
    // --------------------------------------------------------
    const memoryData = await memoryStore.getAgentMemory(agent.id);
    const taskMemory = req.userId
      ? await memoryStore.getMemory('student', req.userId)
      : null;

    // --------------------------------------------------------
    // 7. BUILD PROMPT
    // --------------------------------------------------------
    const systemPrompt = buildPrompt(agent, context, memoryData, taskMemory);

    // --------------------------------------------------------
    // 8. EXECUTE — call AI gateway
    // --------------------------------------------------------
    const route = modelRouter.resolveByTaskType(req.taskType);
    model = route.model;

    await logTaskEvent(taskId, 'EXECUTE', 'INFO', `Calling AI Gateway: ${route.provider}/${route.model}`,
      undefined,
      { provider: route.provider, model: route.model }
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: JSON.stringify(req.input) },
    ];

    const response = await aiGateway.chat({
      messages,
      model: route.model,
      provider: route.provider,
      priority: req.priority,
      temperature: 0.7,
      maxTokens: agent.safetyMaxTokens,
      responseFormat: 'json',
      agentId: agent.id,
      taskId,
    });

    provider = response.provider;
    model = response.model;
    totalTokens += response.tokensIn + response.tokensOut;
    stepsExecuted += 1;

    if (!response.success) {
      throw new Error(response.error ?? 'AI Gateway returned failure');
    }

    // --------------------------------------------------------
    // 9. PARSE & VALIDATE
    // --------------------------------------------------------
    const parsed = parseAiResponse(response.content);
    await logTaskEvent(taskId, 'VALIDATE', 'INFO', `AI response received (${response.content?.length ?? 0} chars)`);

    // --------------------------------------------------------
    // 10. EXECUTE TOOLS (if AI requested tool calls)
    // --------------------------------------------------------
    let toolResults: unknown[] = [];
    if (parsed.toolCalls && Array.isArray(parsed.toolCalls) && parsed.toolCalls.length > 0) {
      const allowedTools = agent.allowedTools;
      for (const tc of parsed.toolCalls) {
        if (stepsExecuted >= agent.safetyMaxSteps) {
          await logTaskEvent(taskId, 'SAFETY_LIMIT', 'WARN', 'Max steps reached');
          break;
        }
        const toolResult = await executeTool(
          allowedTools,
          tc.name as string,
          (tc.params ?? {}) as Record<string, unknown>,
          { agentId: agent.id, taskId, userId: req.userId }
        );
        toolResults.push({ tool: tc.name, result: toolResult });
        stepsExecuted += 1;
      }
    }

    // --------------------------------------------------------
    // 11. UPDATE_DATABASE — write result back
    // --------------------------------------------------------
    const finalResult = {
      ...parsed,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    };

    await db.aiTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify(finalResult),
        confidence: parsed.confidence ?? null,
        completedAt: new Date(),
      },
    });

    // --------------------------------------------------------
    // 12. UPDATE AGENT PERFORMANCE COUNTERS
    // --------------------------------------------------------
    await db.aiAgent.update({
      where: { id: agent.id },
      data: {
        taskSuccessCount: { increment: 1 },
        totalTokensUsed: { increment: totalTokens },
        lastActiveAt: new Date(),
      },
    });

    // --------------------------------------------------------
    // 13. STORE MEMORY
    // --------------------------------------------------------
    if (req.userId) {
      await memoryStore.setMemory('student', req.userId, 'lastTaskResult', JSON.stringify({
        taskType: req.taskType,
        completedAt: new Date().toISOString(),
      }));
    }
    await memoryStore.setAgentMemory(agent.id, 'lastSuccessTask', taskId);

    // --------------------------------------------------------
    // 14. LOG & REPORT
    // --------------------------------------------------------
    const latencyMs = Date.now() - overallStart;
    await logTaskEvent(taskId, 'COMPLETE', 'INFO',
      `Task completed in ${latencyMs}ms, ${stepsExecuted} steps, ${totalTokens} tokens`,
      JSON.stringify({ provider, model, tokensIn: response.tokensIn, tokensOut: response.tokensOut, latencyMs }),
      { provider, model, tokensIn: response.tokensIn, tokensOut: response.tokensOut, latencyMs }
    );

    // Update department metrics
    const deptId = agent.departmentId;
    if (deptId) {
      await updateDepartmentMetrics(deptId, effectiveAutomationClass, true, latencyMs, totalTokens);
    }

    // Update workforce snapshot (fire-and-forget)
    updateWorkforceSnapshot().catch(() => {});

    return {
      success: true,
      taskId,
      status: 'COMPLETED',
      result: finalResult,
      requiresApproval: false,
      latencyMs,
      stepsExecuted,
      tokensUsed: totalTokens,
      provider,
      model,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const latencyMs = Date.now() - overallStart;

    console.error(`[Orchestrator] Task ${taskId} FAILED: ${msg}`);

    // Update task record as failed
    if (taskId) {
      try {
        await db.aiTask.update({
          where: { id: taskId },
          data: { status: 'FAILED', error: msg, completedAt: new Date() },
        });
        await logTaskEvent(taskId, 'FAILED', 'ERROR', msg);
      } catch {
        // DB write failure — don't mask the original error
      }

      // Update agent failure counter
      if (agent) {
        try {
          await db.aiAgent.update({
            where: { id: agent.id },
            data: { taskFailCount: { increment: 1 }, totalTokensUsed: { increment: totalTokens } },
          });
        } catch {
          // Ignore
        }
      }

      // Update department metrics
      const deptId = agent?.departmentId;
      if (deptId) {
        await updateDepartmentMetrics(deptId, effectiveAutomationClass, false, latencyMs, totalTokens);
      }
    }

    return {
      success: false,
      taskId,
      status: 'FAILED',
      result: null,
      error: msg,
      requiresApproval: false,
      latencyMs,
      stepsExecuted,
      tokensUsed: totalTokens,
      provider,
      model,
    };
  }
}

// ============================================================
// HELPER: AGENT SELECTION
// ============================================================

async function selectAgent(
  departmentCode?: string,
  agentCode?: string,
  taskType?: string
): Promise<AgentRecord | null> {
  // 1. Direct agent code lookup
  const availableStatuses = { in: ['ACTIVE', 'IDLE'] };

  if (agentCode) {
    const row = await db.aiAgent.findFirst({ where: { code: agentCode, status: availableStatuses } });
    if (row) return toAgentRecord(row);
  }

  // 2. Department lookup
  if (departmentCode) {
    const dept = await db.aiDepartment.findUnique({ where: { code: departmentCode } });
    if (dept) {
      const agent = await db.aiAgent.findFirst({
        where: { departmentId: dept.id, status: availableStatuses },
      });
      if (agent) return toAgentRecord(agent);
    }
  }

  // 3. Find any available agent (fallback)
  const anyAgent = await db.aiAgent.findFirst({ where: { status: availableStatuses } });
  return anyAgent ? toAgentRecord(anyAgent) : null;
}

function toAgentRecord(row: {
  id: string; name: string | null; code: string | null;
  department: string | null; departmentId: string | null;
  systemPrompt: string | null; model: string | null;
  skills: string; tools: string; allowedTools: string;
  allowedAgents: string; safetyMaxSteps: number;
  safetyMaxRuntimeMs: number; safetyMaxToolCalls: number;
  safetyMaxRetries: number; safetyMaxTokens: number;
  approvalPolicy: string; modelPolicy: string;
}): AgentRecord {
  return {
    id: row.id,
    name: row.name ?? 'Unnamed Agent',
    code: row.code ?? 'unknown',
    department: row.department ?? 'General',
    departmentId: row.departmentId ?? '',
    systemPrompt: row.systemPrompt ?? 'You are a helpful AI assistant for ALO Education.',
    model: row.model ?? 'llama-3.3-70b-versatile',
    skills: safeJson<string[]>(row.skills, []),
    tools: safeJson<string[]>(row.tools, []),
    allowedTools: safeJson<string[]>(row.allowedTools, []),
    allowedAgents: safeJson<string[]>(row.allowedAgents, []),
    safetyMaxSteps: row.safetyMaxSteps ?? DEFAULT_SAFETY_LIMITS.maxSteps,
    safetyMaxRuntimeMs: row.safetyMaxRuntimeMs ?? DEFAULT_SAFETY_LIMITS.maxRuntimeMs,
    safetyMaxToolCalls: row.safetyMaxToolCalls ?? DEFAULT_SAFETY_LIMITS.maxToolCalls,
    safetyMaxRetries: row.safetyMaxRetries ?? DEFAULT_SAFETY_LIMITS.maxRetries,
    safetyMaxTokens: row.safetyMaxTokens ?? DEFAULT_SAFETY_LIMITS.maxTokens,
    approvalPolicy: row.approvalPolicy ?? 'AUTO',
    modelPolicy: row.modelPolicy ?? 'GROQ_DEFAULT',
  };
}

// ============================================================
// HELPER: LOAD CONTEXT
// ============================================================

async function loadContext(req: OrchestrationRequest): Promise<Record<string, unknown>> {
  const ctx: Record<string, unknown> = {};

  // If input references a lead, load it
  const inputLeadId = req.input.leadId as string | undefined;
  if (inputLeadId) {
    const lead = await db.lead.findUnique({
      where: { id: inputLeadId },
      select: { fullName: true, email: true, phone: true, preferredCountry: true, preferredCourse: true, status: true, notes: true },
    });
    if (lead) ctx.lead = lead;
  }

  // If input references a student, load it
  const inputStudentId = req.input.studentId as string | undefined;
  if (inputStudentId) {
    const student = await db.student.findUnique({
      where: { id: inputStudentId },
      select: { fullName: true, email: true, studyDestination: true, programTitle: true, studyLevel: true, status: true },
    });
    if (student) ctx.student = student;
  }

  return ctx;
}

// ============================================================
// HELPER: BUILD PROMPT
// ============================================================

function buildPrompt(
  agent: AgentRecord,
  context: Record<string, unknown>,
  memoryData: Map<string, string>,
  taskMemory: Map<string, string> | null
): string {
  const parts: string[] = [];

  // System prompt from agent config
  parts.push(agent.systemPrompt);

  // Inject context data (data minimization — only relevant fields)
  if (Object.keys(context).length > 0) {
    parts.push('\n--- CONTEXT DATA ---');
    parts.push(JSON.stringify(context));
  }

  // Inject agent memory
  if (memoryData.size > 0) {
    parts.push('\n--- AGENT MEMORY ---');
    for (const [k, v] of memoryData) {
      parts.push(`${k}: ${v}`);
    }
  }

  // Inject task/user memory
  if (taskMemory && taskMemory.size > 0) {
    parts.push('\n--- USER CONTEXT ---');
    for (const [k, v] of taskMemory) {
      parts.push(`${k}: ${v}`);
    }
  }

  // Available tools instruction
  if (agent.tools.length > 0) {
    parts.push(`\n--- AVAILABLE TOOLS ---`);
    parts.push(`You may request these tools by including a \"toolCalls\" array in your JSON response:`);
    for (const toolName of agent.tools) {
      parts.push(`- ${toolName}`);
    }
    parts.push('Each tool call: { "name": "...", "params": {...} }');
  }

  // Response format instruction
  parts.push(`\n--- RESPONSE FORMAT ---`);
  parts.push('Respond with valid JSON containing your analysis, a confidence score (0-1), and optionally toolCalls.');
  parts.push('Example: { "analysis": "...", "confidence": 0.9, "toolCalls": [] }');

  return parts.join('\n');
}

// ============================================================
// HELPER: PARSE AI RESPONSE
// ============================================================

interface ParsedAiResponse {
  analysis?: string;
  confidence?: number;
  result?: unknown;
  toolCalls?: Array<{ name: string; params: Record<string, unknown> }>;
  [key: string]: unknown;
}

function parseAiResponse(content: string | null): ParsedAiResponse {
  if (!content) return {};

  // Try direct parse
  try {
    return JSON.parse(content) as ParsedAiResponse;
  } catch {
    // fall through
  }

  // Try to extract JSON from markdown code block
  const mdMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) {
    try {
      return JSON.parse(mdMatch[1]) as ParsedAiResponse;
    } catch {
      // fall through
    }
  }

  // Try first { ... last }
  const first = content.indexOf('{');
  const last = content.lastIndexOf('}');
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(content.slice(first, last + 1)) as ParsedAiResponse;
    } catch {
      // fall through
    }
  }

  // Wrap raw text as analysis
  return { analysis: content, confidence: 0.5 };
}

// ============================================================
// HELPER: LOG TASK EVENT
// ============================================================

interface LogMeta {
  provider?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  [key: string]: unknown;
}

async function logTaskEvent(
  taskId: string,
  event: string,
  level: string,
  message?: string,
  data?: string,
  meta?: LogMeta,
): Promise<void> {
  try {
    await db.aiTaskLog.create({
      data: {
        taskId,
        event,
        level,
        message: message ?? null,
        data: data ?? null,
        provider: meta?.provider ?? null,
        model: meta?.model ?? null,
        tokensIn: meta?.tokensIn ?? null,
        tokensOut: meta?.tokensOut ?? null,
        latencyMs: meta?.latencyMs ?? null,
      },
    });
  } catch (err) {
    console.error(`[Orchestrator] Failed to log task event: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================
// UTILITY
// ============================================================

function safeJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// HELPER: UPDATE DEPARTMENT METRICS
// ============================================================

async function updateDepartmentMetrics(
  departmentId: string,
  automationClass: AutomationClass,
  success: boolean,
  latencyMs: number,
  tokensUsed: number,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const existing = await db.aiDepartmentMetric.findUnique({
    where: { departmentId_date: { departmentId, date: today } },
  });

  if (existing) {
    const data: Record<string, unknown> = {
      totalTasks: { increment: 1 },
      tokenUsage: { increment: tokensUsed },
      avgLatencyMs: latencyMs, // simplified
    };
    if (success) {
      switch (automationClass) {
        case 'AI_AUTOMATABLE': data.aiAutomated = { increment: 1 }; break;
        case 'AI_ASSISTED': data.aiAssisted = { increment: 1 }; break;
        case 'HUMAN_REQUIRED': data.humanRequired = { increment: 1 }; break;
        case 'HUMAN_APPROVAL_REQUIRED': data.approvalReq = { increment: 1 }; break;
        case 'ESCALATED': data.escalated = { increment: 1 }; break;
      }
    } else {
      data.failed = { increment: 1 };
    }
    await db.aiDepartmentMetric.update({
      where: { departmentId_date: { departmentId, date: today } },
      data,
    });
  } else {
    const data: Record<string, any> = {
      departmentId,
      date: today,
      totalTasks: 1,
      tokenUsage: tokensUsed,
      avgLatencyMs: latencyMs,
    };
    if (success) {
      switch (automationClass) {
        case 'AI_AUTOMATABLE': data.aiAutomated = 1; break;
        case 'AI_ASSISTED': data.aiAssisted = 1; break;
        case 'HUMAN_REQUIRED': data.humanRequired = 1; break;
        case 'HUMAN_APPROVAL_REQUIRED': data.approvalReq = 1; break;
        case 'ESCALATED': data.escalated = 1; break;
      }
    } else {
      data.failed = 1;
    }
    await db.aiDepartmentMetric.create({ data: data as any });
  }
}
