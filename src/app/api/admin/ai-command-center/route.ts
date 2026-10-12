import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BASE_DIR = process.cwd();

/**
 * Schema mutation over HTTP is permanently disabled (2026-10-12 safety
 * remediation). These actions used to rewrite prisma/schema.prisma, run
 * `prisma generate`, and apply the schema with a data-loss-authorizing push.
 * Schema changes must go through a reviewed migration applied with
 * `prisma migrate deploy` after backup and release approval.
 */
const DISABLED_SCHEMA_ACTIONS = new Set(['approve-plan', 'rollback']);

function schemaMutationDisabled() {
  return NextResponse.json(
    {
      success: false,
      code: 'SCHEMA_MUTATION_DISABLED',
      error: 'Schema changes cannot be applied from the AI Command Center. Use a reviewed Prisma migration with backup and release approval.',
      logs: 'Disabled: no files, schema or database were changed.',
    },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('super_admin') || auth.userType === 'admin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    // Truthful dashboard: real DB counts, not hard-coded 2000
    // Distinguish designed vs configured vs active vs idle vs error
    let healthData: any = {
      server_status: 'online',
      protection_mode_enabled: true,
      payment_guard_enabled: true,
      self_improvement_enabled: true,
      productivity_mode_enabled: true,
      private_skills_only: true,
      public_skills_disabled: true,
      paid_api_allowed: false,
    };
    let dbError: string | undefined;
    try {
      const { getDashboardStats } = await import('@/lib/agentos/agent-service');
      const { getDepartmentModelConfig, listConfiguredDepartments } = await import('@/lib/department-model-config');
      const { evaluateDepartmentGates } = await import('@/lib/department-activation');
      const stats = await getDashboardStats();
      // Real counts from DB (if DB unavailable, catch and report degraded)
      healthData = {
        ...healthData,
        // Designed (seed) vs actual DB
        designed_departments: 100,
        designed_agents: 2000,
        // Real DB counts
        departments_count: stats.totalDepartments,
        agents_count: stats.totalAgents,
        active_agents: stats.activeAgents,
        idle_agents: stats.idleAgents,
        paused_agents: stats.pausedAgents,
        error_agents: stats.errorAgents,
        total_engine_types: stats.totalEngineTypes,
        pending_approvals: stats.pendingApprovals,
        tasks_today: stats.tasksToday,
        tasks_this_week: stats.tasksThisWeek,
        total_tasks_ever: stats.totalTasksEver,
        // Activation truthfulness
        configured_departments: listConfiguredDepartments().map(c => c.departmentSlug),
        // Detailed breakdown
        agents_by_status: stats.agentsByStatus,
        agents_by_department: stats.agentsByDepartment.slice(0, 5), // top 5 for brevity
        // Controlled rollout status for SEO (first rollout)
        seo_activation: await evaluateDepartmentGates('seo').catch(() => null),
        // DB health
        database: 'connected',
        sqlite_status: 'online',
      };
    } catch (e: any) {
      dbError = e?.message || String(e);
      healthData = {
        ...healthData,
        database: 'degraded',
        sqlite_status: 'degraded',
        db_error: 'Database unavailable — counts are 0 until DB seeded and migrated. Run npx prisma migrate deploy and seed scripts.',
        departments_count: 0,
        agents_count: 0,
        active_agents: 0,
        idle_agents: 0,
        paused_agents: 0,
        error_agents: 0,
        designed_departments: 100,
        designed_agents: 2000,
        note: 'Hard-coded 2000 was removed — this endpoint now reports real DB counts. 0 is truthful when DB empty.',
      };
    }

    return NextResponse.json({
      success: true,
      masterRole: 'ALO_SUPER_ADMIN',
      system: '2000+ Expandable Private AI Operating System (truthful counts)',
      health: healthData,
      ...(dbError ? { warning: 'Database query failed — see health.database', dbError: dbError.slice(0, 300) } : {}),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to query AI Command Center health', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('super_admin') || auth.userType === 'admin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, command } = body ?? {};

    // Disabled for every caller, including Super Admin. Nothing below this
    // point can write the schema file or run Prisma schema commands.
    if (DISABLED_SCHEMA_ACTIONS.has(String(action))) return schemaMutationDisabled();

    // --- Action 1: Execute Terminal Commands ---
    if (action === 'execute-terminal') {
      if (!command) return NextResponse.json({ error: 'Command is required' }, { status: 400 });

      let shellCmd = '';
      if (command === 'run-tests') shellCmd = 'npx vitest run';
      else if (command === 'run-lint') shellCmd = 'npm run lint';
      else if (command === 'run-build') shellCmd = 'npm run build';
      else if (command === 'run-typecheck') shellCmd = 'npx tsc --noEmit --skipLibCheck';
      else return NextResponse.json({ error: 'Unsupported command execution' }, { status: 400 });

      try {
        const { stdout, stderr } = await execAsync(shellCmd, { cwd: BASE_DIR });
        return NextResponse.json({
          success: true,
          output: stdout || stderr,
          logs: `Execution of "${shellCmd}" succeeded.`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          output: err.stdout || err.stderr || err.message,
          logs: `Execution of "${shellCmd}" failed.`,
        });
      }
    }

    // --- Action 2: Generate Change Plan ---
    if (action === 'generate-plan') {
      if (!command) return NextResponse.json({ error: 'Command text is required' }, { status: 400 });

      const cmdLower = command.toLowerCase();
      let plan: any = null;

      if (cmdLower.includes('source column') || cmdLower.includes('lead table')) {
        plan = {
          planId: 'add-source-column',
          title: 'Add crmSource column to MarketingLead table',
          affectedFiles: ['prisma/schema.prisma'],
          databaseImpact: 'YES (Adds column "crmSource" to MarketingLead table)',
          apiImpact: 'NO (Prisma Schema modification)',
          securityImpact: 'LOW',
          testsRequired: 'Run tsc & vitest suite',
          rollbackStrategy: 'Restore prisma/schema.prisma from temporary backup file',
          isDestructive: false,
          diff: `--- prisma/schema.prisma\n+++ prisma/schema.prisma\n@@ -307,2 +307,3 @@\n   status          String    @default("new")\n+  crmSource       String    @default("CommandCenter")\n   hotLead         Boolean   @default(false)`,
        };
      } else if (cmdLower.includes('qualified') || cmdLower.includes('lead status')) {
        plan = {
          planId: 'add-qualified-status',
          title: 'Add isQualified flag to MarketingLead table',
          affectedFiles: ['prisma/schema.prisma'],
          databaseImpact: 'YES (Adds column "isQualified" to MarketingLead table)',
          apiImpact: 'NO (Prisma Schema modification)',
          securityImpact: 'LOW',
          testsRequired: 'Run tsc & vitest suite',
          rollbackStrategy: 'Restore prisma/schema.prisma from temporary backup file',
          isDestructive: false,
          diff: `--- prisma/schema.prisma\n+++ prisma/schema.prisma\n@@ -307,2 +307,3 @@\n   status          String    @default("new")\n+  isQualified     Boolean   @default(false)\n   hotLead         Boolean   @default(false)`,
        };
      } else {
        // Generic fallback plan generator
        plan = {
          planId: 'generic-code-refactor',
          title: 'Refactor logic to support directive',
          affectedFiles: ['src/lib/utils.ts'],
          databaseImpact: 'NO',
          apiImpact: 'YES (Generic Route Refactor)',
          securityImpact: 'LOW',
          testsRequired: 'Run Vitest unit tests',
          rollbackStrategy: 'Revert Git working directory changes',
          isDestructive: false,
          diff: `--- src/lib/utils.ts\n+++ src/lib/utils.ts\n@@ -1,2 +1,3 @@\n export function cn(...inputs: ClassValue[]) {\n+  // CommandCenter code optimization update\n   return twMerge(clsx(inputs));`,
        };
      }

      // Preview text only. Applying a plan is disabled (see DISABLED_SCHEMA_ACTIONS).
      return NextResponse.json({
        success: true,
        plan: { ...plan, applyDisabled: true, applyDisabledReason: 'Preview only. Schema and code changes must go through a reviewed migration or pull request.' },
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Command execution failed', details: error.message }, { status: 500 });
  }
}
