import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — n8n workflows
export async function GET() {
  const workflows = await db.n8nWorkflow.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ workflows });
}

// POST — create n8n workflow
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, webhookUrl, webhookSecret, triggerType, createdBy } = body;
  const workflow = await db.n8nWorkflow.create({
    data: { name, description, webhookUrl, webhookSecret, triggerType, isActive: true, createdBy },
  });
  return NextResponse.json({ workflow, message: "n8n workflow created." });
}

// PATCH — toggle workflow on/off
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isActive } = body;
  const workflow = await db.n8nWorkflow.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ workflow, message: `Workflow ${isActive ? "activated" : "deactivated"}.` });
}

// POST — trigger a workflow (webhook call)
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, payload } = body;
  const workflow = await db.n8nWorkflow.findUnique({ where: { id } });
  if (!workflow || !workflow.isActive) {
    return NextResponse.json({ error: "Workflow not found or inactive" }, { status: 400 });
  }

  // In production: fetch(workflow.webhookUrl, { method: "POST", body: JSON.stringify(payload) })
  await db.n8nWorkflow.update({ where: { id }, data: { lastTriggeredAt: new Date(), triggerCount: { increment: 1 } } });

  return NextResponse.json({ success: true, message: `Workflow "${workflow.name}" triggered.`, webhookUrl: workflow.webhookUrl });
}
