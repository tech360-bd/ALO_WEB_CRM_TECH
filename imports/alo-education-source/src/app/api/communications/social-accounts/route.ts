import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list social account ownership with owner details
export async function GET(req: NextRequest) {
  try {
    const platform = req.nextUrl.searchParams.get("platform");
    const ownerEmployeeId = req.nextUrl.searchParams.get("ownerEmployeeId");
    const connectionStatus = req.nextUrl.searchParams.get("connectionStatus");

    const where: any = {};
    if (platform) where.platform = platform;
    if (ownerEmployeeId) where.ownerEmployeeId = ownerEmployeeId;
    if (connectionStatus) where.connectionStatus = connectionStatus;

    const accounts = await db.socialAccountOwnership.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Resolve owner names via User
    const ownerIds = Array.from(new Set(accounts.map((a) => a.ownerEmployeeId).filter(Boolean))) as string[];
    const owners = ownerIds.length > 0 ? await db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true, role: true, email: true } }) : [];
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    const enriched = accounts.map((a) => ({
      ...a,
      owner: a.ownerEmployeeId ? ownerMap.get(a.ownerEmployeeId) || null : null,
    }));
    return NextResponse.json({ socialAccounts: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch social accounts" }, { status: 500 });
  }
}

// POST — create / connect a social account (requiresConfig=true by default)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      connectedAccountId,
      platform,
      accountId,
      accountName,
      accountType,
      ownerEmployeeId,
      organization,
      connectionStatus,
      permissions,
      tokenStatus,
      webhookStatus,
      requiresConfig,
    } = body;

    if (!platform || !accountName) {
      return NextResponse.json({ error: "platform and accountName are required" }, { status: 400 });
    }

    const account = await db.socialAccountOwnership.create({
      data: {
        connectedAccountId,
        platform,
        accountId,
        accountName,
        accountType: accountType || "OFFICIAL",
        ownerEmployeeId,
        organization: organization || "ALO Education",
        connectionStatus: connectionStatus || "DISCONNECTED",
        permissions: typeof permissions === "string" ? permissions : JSON.stringify(permissions || []),
        tokenStatus: tokenStatus || "NONE",
        webhookStatus: webhookStatus || "INACTIVE",
        requiresConfig: typeof requiresConfig === "boolean" ? requiresConfig : true,
      },
    });
    return NextResponse.json({ socialAccount: account }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create social account" }, { status: 500 });
  }
}
