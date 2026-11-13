// POST /api/super-admin/ai/system-builder/request
//
// Submits an AI build request and produces steps 2–4 of the workflow in
// spec §21: a plan, the list of files to change, and a patch proposal.
//
// IMPORTANT — what this endpoint does NOT do:
// it does not call an LLM and it does not fabricate a plan. It writes a
// DETERMINISTIC, rule-based plan derived from the declared task type and target
// module, marked `generatedBy: "rule-engine"`. A model-backed planner can be
// wired in later; until then the plan is honest about its origin, and the
// approval gate already blocks any apply.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, unavailable, shortCode } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const TASK_TYPES = [
  'create_page', 'create_dashboard', 'create_form', 'create_report', 'create_api',
  'create_database_model', 'fix_bug', 'audit_route', 'audit_security', 'improve_ui',
  'generate_content', 'generate_workflow',
] as const;

/** Task types that may never be auto-applied, whatever the operator selects. */
const ALWAYS_APPROVAL = new Set(['create_api', 'create_database_model', 'audit_security', 'fix_bug']);

const Body = z.object({
  taskType: z.enum(TASK_TYPES),
  targetModule: z.string().trim().min(2).max(120),
  requirement: z.string().trim().min(20, 'Describe the requirement in at least 20 characters.').max(4000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  sandboxFirst: z.boolean().default(true),
  publishAfterApproval: z.boolean().default(false),
  reason: z.string().trim().min(8).max(500),
}).strict();

/** Deterministic plan templates per task type. */
function buildPlan(taskType: string, targetModule: string, requirement: string) {
  const base = [
    `Read the current implementation of ${targetModule}.`,
    'Identify the smallest additive change that satisfies the requirement.',
    'List every file to create or modify before writing any code.',
    'Produce a patch proposal for Super Admin review.',
    'Run sandbox validation (typecheck + lint scoped to the changed files).',
    'Await explicit Super Admin approval before touching production.',
    'After approval: apply the patch, run the full build, and write the audit record.',
  ];

  const specific: Record<string, string[]> = {
    create_page: [`Create a route under the ${targetModule} area with loading, empty and error states.`],
    create_dashboard: [`Compose the ${targetModule} dashboard from real API data with no placeholder numbers.`],
    create_form: [`Define the ${targetModule} form schema with server-side validation on submit.`],
    create_report: [`Add a report definition for ${targetModule} to the report catalogue.`],
    create_api: [`Add the ${targetModule} endpoint with auth, SUPER_ADMIN guard, validation and audit.`],
    create_database_model: [`Add the ${targetModule} Prisma model plus an additive migration.`],
    fix_bug: [`Reproduce the defect in ${targetModule} and add a regression check.`],
    audit_route: [`Enumerate every route under ${targetModule} and verify auth/RBAC/validation on each.`],
    audit_security: [`Check ${targetModule} for auth bypass, missing ownership checks and unlogged mutations.`],
    improve_ui: [`Improve ${targetModule} responsiveness and empty/error states without changing data contracts.`],
    generate_content: [`Draft ${targetModule} content from approved ALO information only — no fabricated facts.`],
    generate_workflow: [`Model the ${targetModule} workflow states and the approval gate for each transition.`],
  };

  return {
    generatedBy: 'rule-engine',
    note: 'Deterministic plan template. A model-backed planner is not wired to this endpoint yet, so no AI-generated reasoning is claimed.',
    requirement,
    steps: [...(specific[taskType] || []), ...base],
    filesToChange: [
      `src/app/**/${targetModule}/**`,
      `src/lib/${targetModule}/**`,
      'prisma/schema.prisma (only if a model change is required)',
    ],
    risks: [
      'Schema changes affect every consumer of the touched models.',
      'A dashboard change can silently alter an existing metric definition.',
      'No production write happens before approval.',
    ],
  };
}

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const input = parsed.data;

  // Risk classification decides whether approval is mandatory.
  const riskLevel = ALWAYS_APPROVAL.has(input.taskType)
    ? 'high'
    : ['create_database_model', 'create_api'].includes(input.taskType)
      ? 'high'
      : input.taskType.startsWith('audit_')
        ? 'low'
        : 'medium';
  const approvalRequired = riskLevel !== 'low' || ALWAYS_APPROVAL.has(input.taskType);

  try {
    const plan = buildPlan(input.taskType, input.targetModule, input.requirement);

    const created = await db.$transaction(async (tx) => {
      const row = await tx.moduleBuildRequest.create({
        data: {
          requestCode: shortCode('ALO-BLD'),
          taskType: input.taskType,
          targetModule: input.targetModule,
          requirement: input.requirement,
          priority: input.priority,
          riskLevel,
          approvalRequired,
          sandboxFirst: input.sandboxFirst,
          publishAfterApproval: input.publishAfterApproval,
          status: 'PLAN_READY',
          plan: JSON.stringify(plan),
          proposedFiles: JSON.stringify(plan.filesToChange),
          patchProposal: '',
          sandboxResult: JSON.stringify({ ran: false, reason: 'Sandbox runs on approval-ready patches; nothing to validate yet.' }),
          requestedBy: auth.actorUserId,
        },
      });
      await writePortalAudit(tx, auth, 'AI_BUILD_REQUEST_CREATED', 'ModuleBuildRequest', row.id, {
        reason: input.reason,
        requestCode: row.requestCode,
        taskType: input.taskType,
        targetModule: input.targetModule,
        riskLevel,
        approvalRequired,
      }, request);
      return row;
    });

    return NextResponse.json({
      success: true,
      request: {
        id: created.id,
        code: created.requestCode,
        status: created.status,
        riskLevel,
        approvalRequired,
        plan,
      },
      nextStep: approvalRequired
        ? 'Review the plan, then PATCH .../{id}/approve. The patch cannot be applied before approval.'
        : 'Low-risk audit request: approval is still recorded for traceability.',
    }, { status: 201 });
  } catch (error) {
    return unavailable('super-admin/ai/system-builder/request', error);
  }
}

export const POST = withAuth(handlePost);
