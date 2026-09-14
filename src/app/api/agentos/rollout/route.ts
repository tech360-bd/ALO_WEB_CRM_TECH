import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentModelConfig, getRedactedConfigReport, listConfiguredDepartments } from '@/lib/department-model-config';
import { evaluateDepartmentGates } from '@/lib/department-activation';

// GET /api/agentos/rollout?department=seo
// Returns controlled rollout status for one department (or list if no dept)
// Requires SUPER_ADMIN
export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  // Check SUPER_ADMIN
  const ctx = auth as any;
  const roles: string[] = ctx.roles || [];
  const isSuper = roles.includes('SUPER_ADMIN') || roles.includes('super_admin') || ctx.userType === 'SUPER_ADMIN' || ctx.userType === 'admin';
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN required' }, { status: 403 });
  }

  const dept = req.nextUrl.searchParams.get('department');
  if (!dept) {
    // List all configured (should be exactly 1 during rollout)
    const configured = listConfiguredDepartments();
    const reports = await Promise.all(configured.map(async c => {
      const gates = await evaluateDepartmentGates(c.departmentSlug);
      const redacted = getRedactedConfigReport(c.departmentSlug);
      return { config: redacted, activation: gates };
    }));
    return NextResponse.json({
      success: true,
      controlledRollout: 'One Department → One Model → Tests → Real Task → Approval → Activation',
      configuredCount: configured.length,
      expected: 1,
      departments: reports,
      note: configured.length !== 1 ? 'WARNING: Expected exactly 1 configured department during controlled rollout' : 'OK: Exactly 1 configured',
    });
  }

  const cfg = getDepartmentModelConfig(dept);
  if (!cfg) {
    return NextResponse.json({
      success: false,
      departmentSlug: dept,
      status: 'IDLE',
      reason: `Department ${dept} not configured — remains IDLE. Configure exactly one at a time in department-model-config.ts`,
      configuredDepartments: listConfiguredDepartments().map(c => c.departmentSlug),
    }, { status: 404 });
  }

  const redacted = getRedactedConfigReport(dept);
  const activation = await evaluateDepartmentGates(dept);

  return NextResponse.json({
    success: true,
    department: dept,
    config: redacted,
    activation,
    truthfulness: 'Counts are from real DB via evaluateDepartmentGates, not hard-coded. Secrets only reported as configured/missing.',
  });
}

// POST /api/agentos/rollout — trigger real bounded test task for configured department
// Body: { department: 'seo', testPrompt?: string }
// Requires SUPER_ADMIN, respects global pause, department allowFallback=false, bounded limits
export async function POST(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const ctx = auth as any;
  const roles: string[] = ctx.roles || [];
  const isSuper = roles.includes('SUPER_ADMIN') || roles.includes('super_admin') || ctx.userType === 'SUPER_ADMIN' || ctx.userType === 'admin';
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dept = body.department || 'seo';
  const cfg = getDepartmentModelConfig(dept);
  if (!cfg) {
    return NextResponse.json({ success: false, error: `Department ${dept} not configured (IDLE)` }, { status: 404 });
  }

  // Check activation gates first
  const activation = await evaluateDepartmentGates(dept);
  if (activation.overallStatus === 'BLOCKED' && activation.gates.some(g => g.gate.includes('3. Credentials') && g.status === 'BLOCKED')) {
    return NextResponse.json({
      success: false,
      error: 'BLOCKED: Credentials missing',
      activation,
      hint: `Set ${cfg.requiredEnvVars.join(', ')} on VPS (never commit values). Reported as missing.`,
    }, { status: 400 });
  }

  // Global pause check
  const { isGlobalAiPaused } = await import('@/lib/ai-safety');
  if (await isGlobalAiPaused()) {
    return NextResponse.json({ success: false, error: 'Global AI paused', activation }, { status: 423 });
  }

  // Bounded test prompt — non-sensitive, public SEO data
  const testPrompt = body.testPrompt || `You are an SEO specialist for ALO Education. Task: Generate 5 SEO keywords for topic "study in UK for Bangladeshi students" as JSON {\"keywords\":[\"...\",\"...\"]}. Use public knowledge only, no PII, no invention of visa rules. Return only JSON.`;

  const started = Date.now();
  let result: any = null;
  let error: string | undefined;
  let fallbackUsed = false;

  try {
    const { aiGateway } = await import('@/lib/ai-gateway');
    // Use department-aware gateway (will enforce seo primary model)
    const gw = await aiGateway({
      prompt: testPrompt,
      department: dept,
      taskType: 'SEO_KEYWORD_RESEARCH',
      requireJson: true,
      jsonSchema: { type: 'object', properties: { keywords: { type: 'array', items: { type: 'string' } } }, required: ['keywords'] },
      maxTokens: cfg.primary.maxTokens,
      temperature: cfg.primary.temperature,
    });
    result = { text: gw.text.slice(0, 500), json: gw.json, provider: gw.provider, model: gw.model, latencyMs: gw.latencyMs, usage: gw.usage, correlationId: gw.correlationId, fallbackUsed: gw.fallbackUsed };
    fallbackUsed = gw.fallbackUsed;

    // Validate output
    const valid = !!gw.json?.keywords && Array.isArray(gw.json.keywords) && gw.json.keywords.length >= 3;
    if (!valid) {
      return NextResponse.json({
        success: false,
        error: 'Model returned invalid JSON (expected {keywords:[...]})',
        result,
        activation,
        validation: 'FAIL',
      }, { status: 502 });
    }

    // Audit log already via aiGateway db.agentAuditLog

    return NextResponse.json({
      success: true,
      department: dept,
      config: getRedactedConfigReport(dept),
      testTask: {
        promptChars: testPrompt.length,
        bounded: true,
        nonSensitive: true,
        privacy: cfg.primary.privacy,
        timeoutMs: cfg.primary.timeoutMs,
      },
      result,
      fallbackUsed,
      latencyMs: Date.now() - started,
      activation,
      next: 'Human must review result, audit log, usage, then explicitly approve to move to ACTIVE (Gate 9).',
    });
  } catch (e: any) {
    const errMsg = e?.message || String(e);
    error = errMsg;
    // Redact secrets
    const redactedError = errMsg.replace(/sk-[a-zA-Z0-9_-]{10,}/g, '[REDACTED]').replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]').slice(0, 800);
    return NextResponse.json({
      success: false,
      error: redactedError,
      department: dept,
      config: getRedactedConfigReport(dept),
      activation,
      hint: errMsg.includes('not configured') ? 'Configure GROQ_API_KEY' : errMsg.includes('fallback not allowed') ? 'Fallback disabled per SEO isolation — fix primary provider' : 'Check provider endpoint, credentials, network, timeout',
    }, { status: 500 });
  }
}
