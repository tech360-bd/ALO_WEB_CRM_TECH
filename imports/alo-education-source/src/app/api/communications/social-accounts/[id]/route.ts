import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH — update social account permissions / status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      permissions,
      connectionStatus,
      tokenStatus,
      webhookStatus,
      accountType,
      ownerEmployeeId,
      requiresConfig,
      lastSync,
    } = body;

    const existing = await db.socialAccountOwnership.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Social account not found" }, { status: 404 });
    }

    const data: any = {};
    if (permissions !== undefined) data.permissions = typeof permissions === "string" ? permissions : JSON.stringify(permissions || []);
    if (connectionStatus) data.connectionStatus = connectionStatus;
    if (tokenStatus) data.tokenStatus = tokenStatus;
    if (webhookStatus) data.webhookStatus = webhookStatus;
    if (accountType) data.accountType = accountType;
    if (ownerEmployeeId !== undefined) data.ownerEmployeeId = ownerEmployeeId;
    if (typeof requiresConfig === "boolean") data.requiresConfig = requiresConfig;
    if (lastSync !== undefined) data.lastSync = lastSync ? new Date(lastSync) : null;

    const account = await db.socialAccountOwnership.update({ where: { id }, data });
    return NextResponse.json({ socialAccount: account });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update social account" }, { status: 500 });
  }
}
