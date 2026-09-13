import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/config
// Returns the 3CX integration config (with secrets redacted). Auth: super admin.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 });
  }

  try {
    const acct = await db.connectedAccount.findFirst({
      where: { platform: "THREECX" },
      orderBy: { updatedAt: "desc" },
    });
    if (!acct) {
      return NextResponse.json({ configured: false });
    }
    return NextResponse.json(redact(acct));
  } catch (err: any) {
    console.error("[3cx/config GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load config" }, { status: 500 });
  }
}

// POST /api/integrations/3cx/config
// Create / update the 3CX integration config. Auth: super admin.
// Body: { baseUrl, apiToken?, webhookSecret?, metadata? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { baseUrl, apiToken, webhookSecret, metadata } = body || {};
    if (!baseUrl) {
      return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
    }

    const existingMeta: Record<string, unknown> = {};
    const existing = await db.connectedAccount.findFirst({
      where: { platform: "THREECX" },
      orderBy: { updatedAt: "desc" },
    });
    if (existing?.metadata) {
      try { Object.assign(existingMeta, JSON.parse(existing.metadata)); } catch {}
    }

    const meta = {
      ...existingMeta,
      baseUrl,
      webhookSecret: webhookSecret ?? existingMeta.webhookSecret ?? null,
      ...(metadata || {}),
    };

    if (existing) {
      const updated = await db.connectedAccount.update({
        where: { id: existing.id },
        data: {
          accountName: baseUrl,
          accessTokenEnc: apiToken ?? existing.accessTokenEnc ?? null,
          metadata: JSON.stringify(meta),
          connectionStatus: "CONNECTED",
          lastSync: new Date(),
        },
      });
      return NextResponse.json(redact(updated));
    }

    const created = await db.connectedAccount.create({
      data: {
        platform: "THREECX",
        accountName: baseUrl,
        accountId: `3cx-${Date.now()}`,
        connectionStatus: "CONNECTED",
        accessTokenEnc: apiToken ?? null,
        metadata: JSON.stringify(meta),
        lastSync: new Date(),
      },
    });
    return NextResponse.json(redact(created), { status: 201 });
  } catch (err: any) {
    console.error("[3cx/config POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to save config" }, { status: 500 });
  }
}

function redact(acct: any) {
  return {
    id: acct.id,
    platform: acct.platform,
    baseUrl: (() => {
      try { return JSON.parse(acct.metadata || "{}").baseUrl || acct.accountName; } catch { return acct.accountName; }
    })(),
    status: acct.connectionStatus,
    apiTokenConfigured: !!acct.accessTokenEnc,
    apiToken: acct.accessTokenEnc ? "***REDACTED***" : null,
    webhookSecretConfigured: !!(() => {
      try { return JSON.parse(acct.metadata || "{}").webhookSecret; } catch { return null; }
    })(),
    webhookSecret: (() => {
      try {
        const v = JSON.parse(acct.metadata || "{}").webhookSecret;
        return v ? "***REDACTED***" : null;
      } catch { return null; }
    })(),
    lastSync: acct.lastSync,
    createdAt: acct.createdAt,
    updatedAt: acct.updatedAt,
  };
}
