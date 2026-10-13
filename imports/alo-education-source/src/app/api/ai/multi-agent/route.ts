/**
 * ALO Education — Multi-Agent Orchestration API
 * Task ID: 9
 *
 * Provides multi-agent orchestration capabilities:
 *   - Agent discovery & status
 *   - Task delegation to agents
 *   - Agent-to-agent communication
 *   - Orchestration patterns: sequential, parallel, conditional
 *
 * Patterns sourced from:
 *   - MetaGPT (FoundationAgents) — role-based agents, orchestrated task delegation
 *   - ai-memory (akitaonrails) — agent context system, shared project memory
 *   - LiveTalk (GAIR-NLP) — real-time multimodal interaction
 */

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────────

const orchestrateSchema = z.object({
  taskType: z.string().min(1),
  input: z.record(z.unknown()),
  departmentCode: z.string().optional(),
  agentCode: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  requiresApproval: z.boolean().default(false),
  automationClass: z.enum([
    'AI_AUTOMATABLE',
    'AI_ASSISTED',
    'HUMAN_REQUIRED',
    'HUMAN_APPROVAL_REQUIRED',
    'ESCALATED',
  ]).optional(),
  userId: z.string().optional(),
  /** Orchestration pattern: how to coordinate multiple agents */
  pattern: z.enum(['sequential', 'parallel', 'conditional', 'pipeline']).default('sequential'),
  /** Agent sequence for sequential/pipeline patterns */
  agentSequence: z.array(z.string()).optional(),
  /** Conditions for conditional pattern */
  conditions: z.array(z.object({
    agentCode: z.string(),
    condition: z.string(),
  })).optional(),
});

const delegateSchema = z.object({
  fromAgentId: z.string().min(1),
  toAgentCode: z.string().min(1),
  taskType: z.string().min(1),
  input: z.record(z.unknown()),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
});

// ─── GET: List agents & workforce status ─────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const view = req.nextUrl.searchParams.get('view') ?? 'agents';

    if (view === 'agents') {
      const agents = await db.aiAgent.findMany({
        where: { status: { in: ['ACTIVE', 'IDLE', 'PAUSED'] } },
        select: {
          id: true,
          name: true,
          code: true,
          department: true,
          status: true,
          role: true,
          model: true,
          skills: true,
          tools: true,
          taskSuccessCount: true,
          taskFailCount: true,
          totalTokensUsed: true,
          lastActiveAt: true,
          departmentId: true,
        },
        orderBy: { lastActiveAt: 'desc' },
      });

      const agentMetrics = agents.map(a => {
        const totalTasks = a.taskSuccessCount + a.taskFailCount;
        return {
          ...a,
          successRate: totalTasks > 0 ? ((a.taskSuccessCount / totalTasks) * 100).toFixed(1) : '0',
          skills: JSON.parse(a.skills || '[]'),
          tools: JSON.parse(a.tools || '[]'),
        };
      });

      const departments = await db.aiDepartment.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          icon: true,
          _count: { select: { agents: true } },
        },
      });

      return NextResponse.json({
        success: true,
        agents: agentMetrics,
        departments,
        summary: {
          totalAgents: agents.length,
          activeAgents: agents.filter(a => a.status === 'ACTIVE').length,
          idleAgents: agents.filter(a => a.status === 'IDLE').length,
          totalTasksCompleted: agents.reduce((s, a) => s + a.taskSuccessCount, 0),
          totalTokensUsed: agents.reduce((s, a) => s + a.totalTokensUsed, 0),
        },
      });
    }

    if (view === 'departments') {
      const departments = await db.aiDepartment.findMany({
        include: {
          agents: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
              taskSuccessCount: true,
              taskFailCount: true,
            },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ success: true, departments });
    }

    if (view === 'tasks') {
      const status = req.nextUrl.searchParams.get('status');
      const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100);

      const tasks = await db.aiTask.findMany({
        where: status ? { status: status as any } : undefined,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          priority: true,
          automationClass: true,
          confidence: true,
          requiresApproval: true,
          approvalStatus: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          agent: { select: { id: true, name: true, code: true } },
        },
      });

      return NextResponse.json({ success: true, tasks });
    }

    return NextResponse.json({ success: false, error: 'Invalid view parameter' }, { status: 400 });
  } catch (error) {
    console.error('[Multi-Agent] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch multi-agent data.' },
      { status: 500 },
    );
  }
}

// ─── POST: Orchestrate or delegate ────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action ?? 'orchestrate';

    if (action === 'orchestrate') {
      const parsed = orchestrateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { taskType, input, pattern, agentSequence, conditions } = parsed.data;

      let resolvedAgents: string[] = [];

      if (agentSequence && agentSequence.length > 0) {
        resolvedAgents = agentSequence;
      } else if (parsed.data.agentCode) {
        resolvedAgents = [parsed.data.agentCode];
      } else if (parsed.data.departmentCode) {
        const dept = await db.aiDepartment.findUnique({
          where: { code: parsed.data.departmentCode },
          include: { agents: { where: { status: { in: ['ACTIVE', 'IDLE'] } }, select: { code: true } } },
        });
        resolvedAgents = (dept?.agents.map(a => a.code).filter(Boolean) as string[]) ?? [];
      } else {
        const agent = await db.aiAgent.findFirst({
          where: { status: { in: ['ACTIVE', 'IDLE'] } },
          orderBy: { taskSuccessCount: 'desc' },
          select: { code: true },
        });
        if (agent?.code) resolvedAgents = [agent.code];
      }

      if (resolvedAgents.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No available agents found for orchestration.' },
          { status: 404 },
        );
      }

      const plan = {
        taskType,
        pattern,
        agents: resolvedAgents,
        input,
        steps: pattern === 'sequential' || pattern === 'pipeline'
          ? resolvedAgents.map((code, i) => ({
              step: i + 1,
              agentCode: code,
              status: 'pending',
              dependsOn: i > 0 ? [i] : [],
            }))
          : pattern === 'parallel'
          ? resolvedAgents.map((code, i) => ({
              step: i + 1,
              agentCode: code,
              status: 'pending',
              dependsOn: [],
            }))
          : resolvedAgents.map((code, i) => ({
              step: i + 1,
              agentCode: code,
              status: 'pending',
              condition: conditions?.find(c => c.agentCode === code)?.condition ?? 'always',
              dependsOn: [],
            })),
      };

      const task = await db.aiTask.create({
        data: {
          type: taskType,
          priority: parsed.data.priority === 'critical' ? 1 : parsed.data.priority === 'high' ? 3 : parsed.data.priority === 'normal' ? 5 : 8,
          status: 'QUEUED',
          automationClass: parsed.data.automationClass ?? 'AI_AUTOMATABLE',
          input: JSON.stringify(input),
          requiresApproval: parsed.data.requiresApproval,
          approvalStatus: parsed.data.requiresApproval ? 'PENDING' : null,
          metadata: JSON.stringify({
            pattern,
            orchestrationPlan: plan,
            userId: parsed.data.userId,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        taskId: task.id,
        plan,
        message: `Orchestration plan created: ${pattern} pattern with ${resolvedAgents.length} agent(s)`,
      }, { status: 201 });
    }

    if (action === 'delegate') {
      const parsed = delegateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const fromAgent = await db.aiAgent.findUnique({
        where: { id: parsed.data.fromAgentId },
        select: { id: true, name: true, allowedAgents: true },
      });
      if (!fromAgent) {
        return NextResponse.json(
          { success: false, error: 'Source agent not found.' },
          { status: 404 },
        );
      }

      const allowedAgents: string[] = JSON.parse(fromAgent.allowedAgents || '[]');
      const toAgent = await db.aiAgent.findFirst({
        where: { code: parsed.data.toAgentCode, status: { in: ['ACTIVE', 'IDLE'] } },
      });
      if (!toAgent) {
        return NextResponse.json(
          { success: false, error: 'Target agent not found or unavailable.' },
          { status: 404 },
        );
      }
      if (allowedAgents.length > 0 && !allowedAgents.includes(toAgent.code ?? '')) {
        return NextResponse.json(
          { success: false, error: 'Agent delegation not permitted by safety policy.' },
          { status: 403 },
        );
      }

      const delegatedTask = await db.aiTask.create({
        data: {
          agentId: toAgent.id,
          departmentId: toAgent.departmentId,
          type: parsed.data.taskType,
          priority: parsed.data.priority === 'critical' ? 1 : parsed.data.priority === 'high' ? 3 : parsed.data.priority === 'normal' ? 5 : 8,
          status: 'QUEUED',
          automationClass: 'AI_AUTOMATABLE',
          input: JSON.stringify(parsed.data.input),
          metadata: JSON.stringify({
            delegatedFrom: parsed.data.fromAgentId,
            delegationType: 'agent_to_agent',
          }),
        },
      });

      return NextResponse.json({
        success: true,
        taskId: delegatedTask.id,
        fromAgent: fromAgent.name,
        toAgent: toAgent.name,
        message: `Task delegated from ${fromAgent.name} to ${toAgent.name}`,
      }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use "orchestrate" or "delegate".' }, { status: 400 });
  } catch (error) {
    console.error('[Multi-Agent] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process multi-agent request.' },
      { status: 500 },
    );
  }
}
