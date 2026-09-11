import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/config — list all integrations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integrations = await db.threeCxIntegration.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Mask secrets in response
  const masked = integrations.map((i) => ({
    ...i,
    apiKey: i.apiKey ? "***" : null,
    webhookSecret: i.webhookSecret ? "***" : null,
  }));

  return NextResponse.json({ integrations: masked });
}

// POST /api/integrations/3cx/config — create a new integration
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, baseUrl, integrationId, apiKey, webhookSecret, version, configuredBy } = body;

  if (!baseUrl) {
    return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
  }

  const integration = await db.threeCxIntegration.create({
    data: {
      name: name || "default",
      baseUrl,
      integrationId: integrationId ?? null,
      apiKey: apiKey ?? null,
      webhookSecret: webhookSecret ?? null,
      version: version ?? null,
      configuredBy: configuredBy ?? (session.user as any)?.id ?? null,
      status: "NOT_CONFIGURED",
      active: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: configuredBy ?? (session.user as any)?.id ?? "system",
      action: "AI_ACTION",
      resource: "ThreeCxIntegration",
      resourceId: integration.id,
      details: JSON.stringify({ action: "CREATED", baseUrl }),
    },
  });

  // Mask secrets in response
  return NextResponse.json({
    integration: {
      ...integration,
      apiKey: integration.apiKey ? "***" : null,
      webhookSecret: integration.webhookSecret ? "***" : null,
    },
  });
}

// PATCH /api/integrations/3cx/config — update integration
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, baseUrl, integrationId, apiKey, webhookSecret, version, active, status, updatedBy } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (baseUrl !== undefined) data.baseUrl = baseUrl;
  if (integrationId !== undefined) data.integrationId = integrationId;
  if (apiKey !== undefined) data.apiKey = apiKey;
  if (webhookSecret !== undefined) data.webhookSecret = webhookSecret;
  if (version !== undefined) data.version = version;
  if (active !== undefined) data.active = active;
  if (status !== undefined) data.status = status;

  const integration = await db.threeCxIntegration.update({
    where: { id },
    data,
  });

  await db.auditLog.create({
    data: {
      userId: updatedBy ?? (session.user as any)?.id ?? "system",
      action: "AI_ACTION",
      resource: "ThreeCxIntegration",
      resourceId: id,
      details: JSON.stringify({ action: "UPDATED", fields: Object.keys(data) }),
    },
  });

  return NextResponse.json({
    integration: {
      ...integration,
      apiKey: integration.apiKey ? "***" : null,
      webhookSecret: integration.webhookSecret ? "***" : null,
    },
  });
}
