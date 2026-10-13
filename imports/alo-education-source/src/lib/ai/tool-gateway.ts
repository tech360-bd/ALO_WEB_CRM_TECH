/**
 * ALO Education — Tool Gateway
 * Task ID: 7-ai-gateway
 *
 * Agents can only invoke tools that have been explicitly registered.
 * Every tool call goes through authorization: the calling agent's
 * `allowedTools` list is checked before execution.
 */

import { db } from '@/lib/db';
import { aiGateway } from './gateway';
import type {
  ToolDefinition,
  ToolContext,
  ToolResult,
  ToolRiskLevel,
} from './types';

// ============================================================
// TOOL REGISTRY
// ============================================================

const toolRegistry = new Map<string, ToolDefinition>();

/**
 * Register a tool definition.
 * Tools must be registered at module-load time (server-side only).
 */
export function registerTool(tool: ToolDefinition): void {
  if (toolRegistry.has(tool.name)) {
    console.warn(`[ToolGateway] Overwriting existing tool: ${tool.name}`);
  }
  toolRegistry.set(tool.name, tool);
}

/**
 * Get a registered tool by name.
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

/**
 * List all registered tool names.
 */
export function listTools(): string[] {
  return [...toolRegistry.keys()];
}

// ============================================================
// TOOL EXECUTION
// ============================================================

/**
 * Execute a tool on behalf of an agent.
 * Checks authorization (allowedTools) before running.
 *
 * @param agentAllowedTools - the agent's `allowedTools` JSON-parsed array
 * @param toolName - name of the tool to invoke
 * @param params - parameters to pass to the tool handler
 * @param context - agent/user/task context for audit
 */
export async function executeTool(
  agentAllowedTools: string[],
  toolName: string,
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // 1. Tool must exist
  const tool = toolRegistry.get(toolName);
  if (!tool) {
    return { success: false, error: `Tool not found: ${toolName}` };
  }

  // 2. Agent must be authorized
  if (!agentAllowedTools.includes(toolName)) {
    return { success: false, error: `Agent not authorized to use tool: ${toolName}` };
  }

  // 3. Execute
  try {
    console.log(
      `[ToolGateway] execute ${toolName} | agent=${context.agentId ?? '-'} | ` +
      `task=${context.taskId ?? '-'} | risk=${tool.riskLevel ?? 'low'}`
    );
    const result = await tool.handler(params, context);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ToolGateway] ${toolName} error: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Execute multiple tools in sequence (stops on first failure).
 */
export async function executeTools(
  agentAllowedTools: string[],
  calls: Array<{ name: string; params: Record<string, unknown> }>,
  context: ToolContext
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const call of calls) {
    const result = await executeTool(agentAllowedTools, call.name, call.params, context);
    results.push(result);
    if (!result.success) break;
  }
  return results;
}

// ============================================================
// BUILT-IN TOOLS
// ============================================================

/** Helper: safely parse JSON fields from Prisma string columns */
function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// --- searchCourses ---
registerTool({
  name: 'searchCourses',
  description: 'Search courses by query and optional filters (country, level, subject)',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search text' },
      countrySlug: { type: 'string', description: 'Filter by country slug' },
      level: { type: 'string', description: 'Filter by study level' },
      subject: { type: 'string', description: 'Filter by subject area' },
      take: { type: 'number', description: 'Max results (default 10)' },
    },
    required: ['query'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { query, countrySlug, level, subject, take } = params as {
      query: string; countrySlug?: string; level?: string; subject?: string; take?: number;
    };
    const where: Record<string, unknown> = {
      approvalStatus: 'PUBLISHED',
      name: { contains: query },
    };
    if (countrySlug) where.countrySlug = countrySlug;
    if (level) where.level = level;
    if (subject) where.subject = { contains: subject };

    const courses = await db.coursePage.findMany({
      where,
      take: take ?? 10,
      select: { slug: true, name: true, level: true, subject: true, tuition: true, city: true, countrySlug: true },
      orderBy: { matchScore: 'desc' },
    });
    return { success: true, data: courses };
  },
});

// --- searchUniversities ---
registerTool({
  name: 'searchUniversities',
  description: 'Search universities by query and optional country filter',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search text' },
      countrySlug: { type: 'string', description: 'Filter by country slug' },
      take: { type: 'number', description: 'Max results (default 10)' },
    },
    required: ['query'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { query, countrySlug, take } = params as {
      query: string; countrySlug?: string; take?: number;
    };
    const where: Record<string, unknown> = {
      approvalStatus: 'PUBLISHED',
      name: { contains: query },
    };
    if (countrySlug) where.countrySlug = countrySlug;

    const universities = await db.universityPage.findMany({
      where,
      take: take ?? 10,
      select: { slug: true, name: true, city: true, countrySlug: true, ranking: true, overview: true },
    });
    return { success: true, data: universities };
  },
});

// --- searchScholarships ---
registerTool({
  name: 'searchScholarships',
  description: 'Search scholarships by query',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search text' },
      take: { type: 'number', description: 'Max results (default 10)' },
    },
    required: ['query'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { query, take } = params as { query: string; take?: number };
    const scholarships = await db.scholarship.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: take ?? 10,
      select: { scholarshipCode: true, name: true, amount: true, amountType: true, currency: true, deadline: true, countrySlug: true },
    });
    return { success: true, data: scholarships };
  },
});

// --- getStudent ---
registerTool({
  name: 'getStudent',
  description: 'Get student details by ID',
  parameters: {
    type: 'object',
    properties: {
      studentId: { type: 'string', description: 'Student record ID (cuid)' },
    },
    required: ['studentId'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { studentId } = params as { studentId: string };
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, studentId: true, fullName: true, email: true, mobile: true, studyDestination: true, programTitle: true, studyLevel: true, status: true, profileCompletion: true },
    });
    if (!student) return { success: false, error: 'Student not found' };
    return { success: true, data: student };
  },
});

// --- getLead ---
registerTool({
  name: 'getLead',
  description: 'Get lead details by ID',
  parameters: {
    type: 'object',
    properties: {
      leadId: { type: 'string', description: 'Lead record ID (cuid)' },
    },
    required: ['leadId'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { leadId } = params as { leadId: string };
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: { id: true, leadId: true, fullName: true, email: true, phone: true, source: true, preferredCountry: true, preferredCourse: true, status: true, aiScore: true, leadScore: true },
    });
    if (!lead) return { success: false, error: 'Lead not found' };
    return { success: true, data: lead };
  },
});

// --- createCrmNote ---
registerTool({
  name: 'createCrmNote',
  description: 'Create a timeline event (CRM note) for a lead or student',
  parameters: {
    type: 'object',
    properties: {
      leadId: { type: 'string', description: 'Lead ID (optional)' },
      studentId: { type: 'string', description: 'Student ID (optional)' },
      type: { type: 'string', description: 'Event type (e.g. NOTE, AI_ACTION)' },
      title: { type: 'string', description: 'Note title' },
      description: { type: 'string', description: 'Note content' },
    },
    required: ['title'],
  },
  riskLevel: 'medium',
  handler: async (params, context) => {
    const { leadId, studentId, type, title, description } = params as {
      leadId?: string; studentId?: string; type?: string; title: string; description?: string;
    };
    if (!leadId && !studentId) {
      return { success: false, error: 'Either leadId or studentId is required' };
    }
    const event = await db.timelineEvent.create({
      data: {
        leadId: leadId ?? null,
        studentId: studentId ?? null,
        type: type ?? 'AI_ACTION',
        title,
        description: description ?? null,
      },
    });
    return { success: true, data: { id: event.id, title: event.title } };
  },
});

// --- createTask ---
registerTool({
  name: 'createTask',
  description: 'Create a staff task (e.g. follow-up, document review)',
  parameters: {
    type: 'object',
    properties: {
      assignedToId: { type: 'string', description: 'User ID to assign' },
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      department: { type: 'string', description: 'Department name' },
      priority: { type: 'string', description: 'Priority (HIGH, NORMAL, LOW)' },
    },
    required: ['title'],
  },
  riskLevel: 'medium',
  requiredPermissions: ['tasks:create'],
  handler: async (params, context) => {
    const { assignedToId, title, description, department, priority } = params as {
      assignedToId?: string; title: string; description?: string; department?: string; priority?: string;
    };
    const task = await db.task.create({
      data: {
        title,
        description: description ?? null,
        assignedToId: assignedToId ?? null,
        createdById: context.userId ?? null,
        department: department ?? null,
        priority: priority ?? 'NORMAL',
      },
    });
    return { success: true, data: { id: task.id, title: task.title } };
  },
});

// --- sendNotification ---
registerTool({
  name: 'sendNotification',
  description: 'Create an in-app notification for a user',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'Recipient user ID' },
      title: { type: 'string', description: 'Notification title' },
      message: { type: 'string', description: 'Notification body' },
      type: { type: 'string', description: 'Notification type (INFO, WARNING, SUCCESS, ERROR)' },
      link: { type: 'string', description: 'Optional link to navigate to' },
    },
    required: ['title', 'message'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { userId, title, message, type, link } = params as {
      userId?: string; title: string; message: string; type?: string; link?: string;
    };
    const notification = await db.notification.create({
      data: {
        userId: userId ?? null,
        title,
        body: message,
        type: type ?? 'INFO',
        link: link ?? null,
      },
    });
    return { success: true, data: { id: notification.id, title: notification.title } };
  },
});

// --- getClassification ---
registerTool({
  name: 'getClassification',
  description: 'Classify text into one of the given categories using AI',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to classify' },
      categories: { type: 'array', items: { type: 'string' }, description: 'Categories to choose from' },
    },
    required: ['text', 'categories'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { text, categories } = params as { text: string; categories: string[] };
    const catList = categories.join(', ');
    const response = await aiGateway.chat({
      messages: [
        {
          role: 'system',
          content: `You are a classifier. Given text and a list of categories, respond with ONLY the best matching category name. No explanation. Categories: ${catList}`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      maxTokens: 50,
      responseFormat: 'text',
    });
    if (!response.success || !response.content) {
      return { success: false, error: response.error ?? 'Classification failed' };
    }
    const classified = response.content.trim();
    const match = categories.find((c) => c.toLowerCase() === classified.toLowerCase());
    return {
      success: true,
      data: { category: match ?? classified, confidence: 1 },
    };
  },
});

// --- summarizeText ---
registerTool({
  name: 'summarizeText',
  description: 'Summarize a long text into a concise summary using AI',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to summarize' },
      maxLength: { type: 'number', description: 'Max words in summary (default 100)' },
    },
    required: ['text'],
  },
  riskLevel: 'low',
  handler: async (params) => {
    const { text, maxLength } = params as { text: string; maxLength?: number };
    const maxWords = maxLength ?? 100;
    const response = await aiGateway.chat({
      messages: [
        {
          role: 'system',
          content: `Summarize the following text in at most ${maxWords} words. Be concise and factual.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      maxTokens: 300,
    });
    if (!response.success || !response.content) {
      return { success: false, error: response.error ?? 'Summarization failed' };
    }
    return { success: true, data: { summary: response.content.trim() } };
  },
});
