import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// GET — n8n workflows
export const GET = withAuth(async (_req: Request, _auth: AuthContext) => {
  const workflows = await db.n8nWorkflow.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ workflows } as any);
}, MARKETING_AUTH);

// POST — create n8n workflow
export const POST = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { name, description, webhookUrl, webhookSecret, triggerType, createdBy } = body;
  const workflow = await db.n8nWorkflow.create({
    data: { name, description, webhookUrl, webhookSecret, triggerType, isActive: true, createdBy },
  });
  return NextResponse.json({ workflow, message: "n8n workflow created." } as any);
}, MARKETING_AUTH);

// PATCH — toggle workflow on/off
export const PATCH = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { id, isActive } = body;
  const workflow = await db.n8nWorkflow.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ workflow, message: `Workflow ${isActive ? "activated" : "deactivated"}.` } as any);
}, MARKETING_AUTH);

// POST — trigger a workflow (webhook call)
export const PUT = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json();
  const { id, payload } = body;
  const workflow = await db.n8nWorkflow.findUnique({ where: { id } });
  if (!workflow || !workflow.isActive) {
    return NextResponse.json({ error: "Workflow not found or inactive" }, { status: 400 });
  }

  // In production: fetch(workflow.webhookUrl, { method: "POST", body: JSON.stringify(payload) })
  await db.n8nWorkflow.update({ where: { id }, data: { lastTriggeredAt: new Date(), triggerCount: { increment: 1 } } });

  return NextResponse.json({ success: true, message: `Workflow "${workflow.name}" triggered.`, webhookUrl: workflow.webhookUrl } as any);
}, MARKETING_AUTH);
