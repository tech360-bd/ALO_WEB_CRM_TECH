import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — connected accounts
export async function GET() {
  const accounts = await db.connectedAccount.findMany({ orderBy: { platform: "asc" } });
  return NextResponse.json({ accounts });
}

// POST — connect account (OAuth simulation)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { platform, accountName, accountId, accessTokenEnc, refreshTokenEnc, tokenExpiry, assignedTo } = body;
  const account = await db.connectedAccount.create({
    data: { platform, accountName, accountId, accessTokenEnc, refreshTokenEnc, tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null, connectionStatus: "CONNECTED", assignedTo: assignedTo || "COMPANY", lastSync: new Date(), lastActivity: new Date() },
  });
  await db.auditLog.create({ data: { action: "DATA_IMPORT", resource: "ConnectedAccount", resourceId: account.id, details: JSON.stringify({ platform, accountName }) } });
  return NextResponse.json({ account, message: `${platform} account connected successfully.` });
}

// PATCH — reconnect/disconnect/sync
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body;
  if (action === "sync") {
    const account = await db.connectedAccount.update({ where: { id }, data: { lastSync: new Date(), lastActivity: new Date() } });
    return NextResponse.json({ account, message: "Sync completed." });
  }
  if (action === "disconnect") {
    const account = await db.connectedAccount.update({ where: { id }, data: { connectionStatus: "DISCONNECTED", accessTokenEnc: null, refreshTokenEnc: null } });
    return NextResponse.json({ account, message: "Account disconnected." });
  }
  if (action === "reconnect") {
    const account = await db.connectedAccount.update({ where: { id }, data: { connectionStatus: "CONNECTED", lastSync: new Date() } });
    return NextResponse.json({ account, message: "Account reconnected." });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
