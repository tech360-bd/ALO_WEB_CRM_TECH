import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { N8N_VIDEO_WORKFLOW_TEMPLATES, getWorkflowTemplate, createN8nWorkflowFromTemplate, triggerVideoWorkflow } from "@/lib/video-engine/n8n";

const AUTH = { requireUserTypes: ["MARKETING", "MARKETING_MANAGER", "SUPER_ADMIN", "ADMIN"] };

export const GET = withAuth(async () => {
  try {
    return NextResponse.json({ success: true, workflows: N8N_VIDEO_WORKFLOW_TEMPLATES, count: N8N_VIDEO_WORKFLOW_TEMPLATES.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { action, templateId, event, data, workflowId } = body;

    if (action === "create_from_template") {
      if (!templateId) return NextResponse.json({ success: false, error: "templateId required" }, { status: 400 });
      const result = await createN8nWorkflowFromTemplate(templateId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "trigger") {
      if (!event) return NextResponse.json({ success: false, error: "event required" }, { status: 400 });
      const result = await triggerVideoWorkflow(event, data || {}, workflowId);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: "Use action=create_from_template or action=trigger" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}, AUTH);
