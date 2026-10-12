import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const VIEW_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'MARKETING']);
const MANAGE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER']);
const TRIGGER_TYPES = new Set(['LEAD_CREATED', 'FOLLOW_UP', 'WHATSAPP_REPLY', 'CAMPAIGN_REPORT', 'COUNSELOR_NOTIFY']);
function hasRole(auth: { userType: string; roles: string[] }, roles: Set<string>) {
  return [auth.userType, ...auth.roles].some((role) => roles.has(role.toUpperCase()));
}
async function parseBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await req.json();
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
function safeWorkflow(workflow: {
  id: string; name: string; description: string | null; webhookUrl: string; webhookSecret: string | null;
  triggerType: string; isActive: boolean; lastTriggeredAt: Date | null; triggerCount: number; createdBy: string | null; createdAt: Date;
}) {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    triggerType: workflow.triggerType,
    // Legacy database activity is not provider evidence and is never represented as live.
    reportedIsActive: workflow.isActive,
    isActive: false,
    hasStoredEndpoint: Boolean(workflow.webhookUrl),
    hasStoredSecret: Boolean(workflow.webhookSecret),
    reportedLastTriggeredAt: workflow.lastTriggeredAt,
    reportedTriggerCount: workflow.triggerCount,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'NOT_VERIFIED',
    createdBy: workflow.createdBy,
    createdAt: workflow.createdAt,
    verification: 'NOT VERIFIED — n8n endpoint and workflow execution are not verified',
  };
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, VIEW_ROLES)) return NextResponse.json({ success: false, error: 'Marketing workflow access is not permitted.' }, { status: 403 });
  try {
    const workflows = await db.n8nWorkflow.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ workflows: workflows.map(safeWorkflow) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Workflow records are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

// Store configuration placeholders only. Endpoints and plaintext secrets are rejected.
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Marketing workflow administration is required.' }, { status: 403 });
  const body = await parseBody(req);
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  if ((typeof body.webhookUrl === 'string' && body.webhookUrl.trim()) || (typeof body.webhookSecret === 'string' && body.webhookSecret.trim())) {
    return NextResponse.json({ success: false, error: 'Webhook endpoints and secrets cannot be stored by this unconfigured integration.' }, { status: 501 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const triggerType = typeof body.triggerType === 'string' ? body.triggerType.trim().toUpperCase() : '';
  if (!name || name.length > 120 || description.length > 1000 || !TRIGGER_TYPES.has(triggerType)) {
    return NextResponse.json({ success: false, error: 'Name, description, or trigger type is invalid.' }, { status: 400 });
  }

  try {
    const workflow = await db.n8nWorkflow.create({
      data: { name, description: description || null, webhookUrl: '', webhookSecret: null, triggerType, isActive: false, createdBy: auth.userId },
    });
    await logAuditAction(auth, 'N8N_WORKFLOW_PLACEHOLDER_CREATED', 'N8nWorkflow', workflow.id, { triggerType, endpointStored: false });
    return NextResponse.json({ workflow: safeWorkflow(workflow), message: 'Workflow placeholder created. No n8n endpoint is connected or executable.' }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Workflow placeholder could not be created.' }, { status: 503 });
  }
}

// Local fail-closed disable only. Enabling is unavailable until a verified integration exists.
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Marketing workflow administration is required.' }, { status: 403 });
  const body = await parseBody(req);
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id || typeof body.isActive !== 'boolean') return NextResponse.json({ success: false, error: 'A workflow ID and boolean state are required.' }, { status: 400 });
  if (body.isActive) return NextResponse.json({ success: false, error: 'Workflow activation requires configured n8n credentials and live verification; it was not enabled.' }, { status: 501 });

  try {
    const existing = await db.n8nWorkflow.findUnique({ where: { id }, select: { id: true, triggerType: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Workflow not found.' }, { status: 404 });
    const workflow = await db.n8nWorkflow.update({ where: { id }, data: { isActive: false, webhookUrl: '', webhookSecret: null } });
    await logAuditAction(auth, 'N8N_WORKFLOW_DISABLED_LOCALLY', 'N8nWorkflow', id, { triggerType: existing.triggerType, externalWorkflowDisabled: false });
    return NextResponse.json({ workflow: safeWorkflow(workflow), message: 'Stored endpoint and secret were cleared; this did not disable or revoke anything in the external n8n service.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Workflow could not be disabled locally.' }, { status: 503 });
  }
}

// No external call is made until SSRF-safe endpoint validation, signing, and provider verification exist.
export async function PUT(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Marketing workflow administration is required.' }, { status: 403 });
  return NextResponse.json({
    success: false,
    status: 'NOT_CONFIGURED',
    error: 'Workflow execution is not configured. No webhook was called and no trigger counter was changed.',
    verification: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
  }, { status: 501, headers: { 'Cache-Control': 'no-store' } });
}
