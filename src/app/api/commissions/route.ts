import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  const commissions = await db.commission.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ commissions });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, studentId, applicationId, universitySlug, partnerId, amount, currency, notes } = body;
  if (!type || !amount) return NextResponse.json({ error: "type and amount required" }, { status: 400 });
  const commission = await db.commission.create({ data: { commissionCode: `ALO-COM-${Date.now().toString().slice(-6)}`, type, studentId, applicationId, universitySlug, partnerId, amount: parseFloat(amount), currency: currency || "BDT", notes, status: "DUE" } });
  return NextResponse.json({ commission });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, approvedById } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  const updates: any = { status };
  if (status === "APPROVED") { updates.approvedById = approvedById; updates.approvedAt = new Date(); }
  if (status === "SENT") updates.sentAt = new Date();
  if (status === "RECEIVED") updates.receivedAt = new Date();
  if (status === "RECONCILED") updates.reconciledAt = new Date();
  const commission = await db.commission.update({ where: { id }, data: updates });
  return NextResponse.json({ commission });
}
