import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

/** Standardised return shape for every tool call. */
export interface ToolResult {
  success: boolean;
  tool: string;
  data?: unknown;
  error?: string;
  timestamp: string;
}

/** Minimal agent info needed for permission checks & audit. */
export interface AgentContext {
  agentId: string;
  taskId?: string;
  /** Parsed list of tool names the agent is allowed to call. */
  allowedTools: string[];
}

/** The complete set of tools the gateway exposes. */
export const TOOL_NAMES = [
  'searchCourses',
  'searchUniversities',
  'searchScholarships',
  'getStudent',
  'createLead',
  'updateLead',
  'getLead',
  'createTask',
  'createNotification',
  'createTimelineEvent',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function ok(tool: string, data: unknown): ToolResult {
  return { success: true, tool, data, timestamp: new Date().toISOString() };
}

function fail(tool: string, error: string): ToolResult {
  return { success: false, tool, error, timestamp: new Date().toISOString() };
}

/** Check that a tool name is in the allow-list. */
function isKnownTool(name: string): name is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(name);
}

/** Check the agent's allowed-tools list. */
function hasPermission(agent: AgentContext, tool: string): boolean {
  return agent.allowedTools.includes(tool);
}

/** Write an audit row (fire-and-forget — errors are swallowed). */
async function audit(
  agent: AgentContext,
  event: string,
  tool: string,
  input: unknown,
  output: unknown,
  result: 'SUCCESS' | 'FAILED' | 'ESCALATED',
  error?: string,
  latency?: number,
): Promise<void> {
  try {
    await db.aiWorkforceAudit.create({
      data: {
        agentId: agent.agentId,
        taskId: agent.taskId ?? null,
        event,
        tool,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        result,
        error: error ?? null,
        latency: latency ?? 0,
      },
    });
  } catch {
    // Audit must never break the tool pipeline.
  }
}

/**
 * Generic tool execution wrapper.
 * 1. Validates tool name against whitelist.
 * 2. Checks agent permissions.
 * 3. Executes the handler.
 * 4. Writes audit log.
 * 5. Returns structured result.
 */
async function executeTool(
  agent: AgentContext,
  toolName: string,
  args: Record<string, unknown>,
  handler: () => Promise<ToolResult>,
): Promise<ToolResult> {
  const start = Date.now();

  // --- Whitelist check ---
  if (!isKnownTool(toolName)) {
    const result = fail(toolName, `Unknown tool: ${toolName}`);
    await audit(agent, 'TOOL_CALLED', toolName, args, null, 'FAILED', result.error);
    return result;
  }

  // --- Permission check ---
  if (!hasPermission(agent, toolName)) {
    const result = fail(toolName, `Agent ${agent.agentId} is not authorised to use tool: ${toolName}`);
    await audit(agent, 'TOOL_CALLED', toolName, args, null, 'FAILED', result.error);
    return result;
  }

  // --- Execute ---
  try {
    const result = await handler();
    await audit(
      agent,
      'TOOL_CALLED',
      toolName,
      args,
      result.success ? result.data : null,
      result.success ? 'SUCCESS' : 'FAILED',
      result.error,
      Date.now() - start,
    );
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const result = fail(toolName, message);
    await audit(agent, 'TOOL_CALLED', toolName, args, null, 'FAILED', message, Date.now() - start);
    return result;
  }
}

// ------------------------------------------------------------------
// Tool Handlers
// ------------------------------------------------------------------

/** Build a Prisma `where` clause from loose filter key/values. */
function buildWhereClause<T extends Prisma.CoursePageWhereInput | Prisma.UniversityPageWhereInput | Prisma.ScholarshipWhereInput>(
  filters: Record<string, unknown>,
  stringFields: string[],
  optionalStringFields: string[],
  enumFields: string[] = [],
  defaultStatus: Record<string, string> = { approvalStatus: 'PUBLISHED' },
): T {
  const where: Record<string, unknown> = { ...defaultStatus };

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    if (stringFields.includes(key)) {
      where[key] = { contains: String(value) };
    } else if (optionalStringFields.includes(key)) {
      where[key] = { contains: String(value) };
    } else if (enumFields.includes(key)) {
      where[key] = String(value);
    } else if (key === 'search') {
      // Search across a set of common text fields
      const term = String(value);
      (where as Record<string, unknown>)['OR'] = stringFields
        .concat(optionalStringFields)
        .map((f) => ({ [f]: { contains: term } }));
    }
  }

  return where as T;
}

// ------------------------------------------------------------------
// Public API — each function is a tool an agent can invoke
// ------------------------------------------------------------------

/**
 * searchCourses(filters)
 * Supported filter keys: search, level, subject, discipline, countrySlug, universitySlug, city, studyArea, deliveryMode
 */
export async function searchCourses(
  agent: AgentContext,
  filters: Record<string, unknown>,
): Promise<ToolResult> {
  return executeTool(agent, 'searchCourses', filters, async () => {
    const stringFields = ['name', 'level', 'subject', 'city'];
    const optionalStringFields = ['countrySlug', 'universitySlug', 'discipline', 'studyArea', 'deliveryMode'];
    const where = buildWhereClause<Prisma.CoursePageWhereInput>(filters, stringFields, optionalStringFields, [], { approvalStatus: 'PUBLISHED' });

    const take = Math.min(Number(filters.take) || 20, 100);
    const skip = Math.max(Number(filters.skip) || 0, 0);

    const courses = await db.coursePage.findMany({
      where,
      select: {
        id: true, slug: true, name: true, level: true, subject: true,
        discipline: true, duration: true, intake: true, tuition: true,
        tuitionCurrency: true, city: true, countrySlug: true, universitySlug: true,
        scholarshipAvailable: true, englishRequirement: true, approvalStatus: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return ok('searchCourses', { courses, count: courses.length });
  });
}

/**
 * searchUniversities(filters)
 * Supported filter keys: search, name, countrySlug, city, ranking
 */
export async function searchUniversities(
  agent: AgentContext,
  filters: Record<string, unknown>,
): Promise<ToolResult> {
  return executeTool(agent, 'searchUniversities', filters, async () => {
    const stringFields = ['name', 'city'];
    const optionalStringFields = ['countrySlug', 'ranking'];
    const where = buildWhereClause<Prisma.UniversityPageWhereInput>(filters, stringFields, optionalStringFields, [], { approvalStatus: 'PUBLISHED' });

    const take = Math.min(Number(filters.take) || 20, 100);
    const skip = Math.max(Number(filters.skip) || 0, 0);

    const universities = await db.universityPage.findMany({
      where,
      select: {
        id: true, slug: true, name: true, countrySlug: true, city: true,
        ranking: true, rankingSource: true, studentsCount: true,
        scholarshipAvailable: true, approvalStatus: true, logo: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return ok('searchUniversities', { universities, count: universities.length });
  });
}

/**
 * searchScholarships(filters)
 * Supported filter keys: search, name, countrySlug, universitySlug, fundingType, amountType, currency
 */
export async function searchScholarships(
  agent: AgentContext,
  filters: Record<string, unknown>,
): Promise<ToolResult> {
  return executeTool(agent, 'searchScholarships', filters, async () => {
    const stringFields = ['name'];
    const optionalStringFields = ['countrySlug', 'universitySlug', 'courseSlug', 'fundingType', 'amountType', 'currency'];
    const enumFields: string[] = [];
    const where = buildWhereClause<Prisma.ScholarshipWhereInput>(filters, stringFields, optionalStringFields, enumFields, { status: 'OPEN' });

    const take = Math.min(Number(filters.take) || 20, 100);
    const skip = Math.max(Number(filters.skip) || 0, 0);

    const scholarships = await db.scholarship.findMany({
      where,
      select: {
        id: true, scholarshipCode: true, name: true, slug: true,
        countrySlug: true, universitySlug: true, courseSlug: true,
        amount: true, currency: true, fundingType: true,
        deadline: true, status: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return ok('searchScholarships', { scholarships, count: scholarships.length });
  });
}

/**
 * getStudent(id)
 * Fetch a student by their `id` (cuid) or `studentId` (business key).
 */
export async function getStudent(
  agent: AgentContext,
  id: string,
): Promise<ToolResult> {
  return executeTool(agent, 'getStudent', { id }, async () => {
    if (!id || typeof id !== 'string') {
      return fail('getStudent', 'A valid student id or studentId is required.');
    }

    const student = await db.student.findFirst({
      where: {
        OR: [{ id }, { studentId: id }],
      },
    });

    if (!student) {
      return fail('getStudent', `Student not found: ${id}`);
    }

    return ok('getStudent', student);
  });
}

/**
 * createLead(data)
 * Creates a new lead.  Returns the created lead record.
 */
export async function createLead(
  agent: AgentContext,
  data: {
    fullName: string;
    phone: string;
    email?: string;
    source?: string;
    preferredCountry?: string;
    preferredCourse?: string;
    notes?: string;
  },
): Promise<ToolResult> {
  return executeTool(agent, 'createLead', data, async () => {
    if (!data?.fullName || !data?.phone) {
      return fail('createLead', 'fullName and phone are required.');
    }

    // Generate a short lead id
    const count = await db.lead.count();
    const leadId = `ALO-LEAD-${String(count + 1).padStart(5, '0')}`;

    const lead = await db.lead.create({
      data: {
        leadId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? null,
        source: data.source ?? 'AI_AGENT',
        preferredCountry: data.preferredCountry ?? null,
        preferredCourse: data.preferredCourse ?? null,
        notes: data.notes ?? null,
      },
    });

    return ok('createLead', lead);
  });
}

/**
 * updateLead(id, data)
 * Updates an existing lead by its `id` or `leadId`.
 */
export async function updateLead(
  agent: AgentContext,
  id: string,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    status?: string;
    preferredCountry?: string;
    preferredCourse?: string;
    notes?: string;
    aiScore?: number;
    leadScore?: number;
  },
): Promise<ToolResult> {
  return executeTool(agent, 'updateLead', { id, ...data }, async () => {
    if (!id) {
      return fail('updateLead', 'A valid lead id or leadId is required.');
    }

    const existing = await db.lead.findFirst({
      where: { OR: [{ id }, { leadId: id }] },
    });

    if (!existing) {
      return fail('updateLead', `Lead not found: ${id}`);
    }

    // Only allow a safe subset of fields (no arbitrary keys)
    const safeData: Record<string, unknown> = {};
    const allowedFields = ['fullName', 'email', 'phone', 'status', 'preferredCountry', 'preferredCourse', 'notes', 'aiScore', 'leadScore'];
    for (const key of allowedFields) {
      if (key in data && data[key as keyof typeof data] !== undefined) {
        safeData[key] = data[key as keyof typeof data];
      }
    }

    const updated = await db.lead.update({
      where: { id: existing.id },
      data: safeData,
    });

    return ok('updateLead', updated);
  });
}

/**
 * getLead(id)
 * Fetch a single lead by its `id` or `leadId`.
 */
export async function getLead(
  agent: AgentContext,
  id: string,
): Promise<ToolResult> {
  return executeTool(agent, 'getLead', { id }, async () => {
    if (!id || typeof id !== 'string') {
      return fail('getLead', 'A valid lead id or leadId is required.');
    }

    const lead = await db.lead.findFirst({
      where: { OR: [{ id }, { leadId: id }] },
    });

    if (!lead) {
      return fail('getLead', `Lead not found: ${id}`);
    }

    return ok('getLead', lead);
  });
}

/**
 * createTask(data)
 * Creates an AiTask record (used by agents to spawn sub-tasks or log work).
 */
export async function createTask(
  agent: AgentContext,
  data: {
    type: string;
    departmentId?: string;
    priority?: string;
    studentId?: string;
    leadId?: string;
    applicationId?: string;
    input?: unknown;
    automationClass?: string;
  },
): Promise<ToolResult> {
  return executeTool(agent, 'createTask', data, async () => {
    if (!data?.type) {
      return fail('createTask', 'Task type is required.');
    }

    // Generate a short task id
    const count = await db.aiTask.count();
    const taskId = `ALO-TASK-${String(count + 1).padStart(6, '0')}`;

    const task = await db.aiTask.create({
      data: {
        taskId,
        agentId: agent.agentId,
        type: data.type,
        departmentId: data.departmentId ?? null,
        priority: data.priority ?? 'NORMAL',
        studentId: data.studentId ?? null,
        leadId: data.leadId ?? null,
        applicationId: data.applicationId ?? null,
        input: data.input ? JSON.stringify(data.input) : null,
        automationClass: data.automationClass ?? 'AI_AUTOMATABLE',
        status: 'QUEUED',
      },
    });

    return ok('createTask', task);
  });
}

/**
 * createNotification(userId, type, title, message, data?)
 * Creates an in-app notification for a user.
 */
export async function createNotification(
  agent: AgentContext,
  args: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: unknown;
  },
): Promise<ToolResult> {
  return executeTool(agent, 'createNotification', args, async () => {
    if (!args?.userId || !args?.type || !args?.title || !args?.message) {
      return fail('createNotification', 'userId, type, title, and message are required.');
    }

    const notification = await db.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        message: args.message,
        data: args.data ? JSON.stringify(args.data) : null,
        channel: 'IN_APP',
      },
    });

    return ok('createNotification', notification);
  });
}

/**
 * createTimelineEvent(studentId, type, title, description?)
 * Appends an event to a student's timeline.
 */
export async function createTimelineEvent(
  agent: AgentContext,
  args: {
    studentId: string;
    type: string;
    title: string;
    description?: string;
  },
): Promise<ToolResult> {
  return executeTool(agent, 'createTimelineEvent', args, async () => {
    if (!args?.studentId || !args?.type || !args?.title) {
      return fail('createTimelineEvent', 'studentId, type, and title are required.');
    }

    // Verify the student exists
    const student = await db.student.findFirst({
      where: { OR: [{ id: args.studentId }, { studentId: args.studentId }] },
      select: { id: true },
    });

    if (!student) {
      return fail('createTimelineEvent', `Student not found: ${args.studentId}`);
    }

    const event = await db.timelineEvent.create({
      data: {
        studentId: student.id,
        type: args.type,
        title: args.title,
        description: args.description ?? null,
      },
    });

    return ok('createTimelineEvent', event);
  });
}

// ------------------------------------------------------------------
// Unified dispatcher — call any tool by name
// ------------------------------------------------------------------

export type ToolMap = Record<ToolName, (...args: unknown[]) => Promise<ToolResult>>;

/**
 * Resolves a tool name to its handler. Returns null for unknown tools.
 * This map is the single entry-point for the agent runtime to call tools.
 */
export function getToolHandler(name: ToolName, agent: AgentContext): ((...args: unknown[]) => Promise<ToolResult>) | null {
  const handlers: ToolMap = {
    searchCourses: (filters) => searchCourses(agent, filters as Record<string, unknown>),
    searchUniversities: (filters) => searchUniversities(agent, filters as Record<string, unknown>),
    searchScholarships: (filters) => searchScholarships(agent, filters as Record<string, unknown>),
    getStudent: (id) => getStudent(agent, id as string),
    createLead: (data) => createLead(agent, data as Parameters<typeof createLead>[1]),
    updateLead: (id, data) => updateLead(agent, id as string, data as Parameters<typeof updateLead>[1]),
    getLead: (id) => getLead(agent, id as string),
    createTask: (data) => createTask(agent, data as Parameters<typeof createTask>[1]),
    createNotification: (args) => createNotification(agent, args as Parameters<typeof createNotification>[1]),
    createTimelineEvent: (args) => createTimelineEvent(agent, args as Parameters<typeof createTimelineEvent>[1]),
  };

  return handlers[name] ?? null;
}
