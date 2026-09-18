import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// SEC-A fix (2026-09-18): this route previously had NO authentication or
// authorization at all — any anonymous caller could list every commission
// (financial data), create arbitrary commission records, and set any
// commission to APPROVED. All three handlers are now staff-only.
//
// Authorization is enforced server-side via the project's existing RBAC
// middleware. `withAuth` resolves the session from the NextAuth cookie or a
// database-backed Bearer token; unauthenticated callers get 401 before any
// database access occurs.
// ============================================================

const COMMISSION_TYPES = new Set(["UNIVERSITY_COMMISSION", "PARTNER_COMMISSION"]);
const COMMISSION_STATUSES = new Set([
  "DUE",
  "VERIFIED",
  "REQUESTED",
  "INVOICED",
  "APPROVED",
  "SENT",
  "RECEIVED",
  "RECONCILED",
  "CLOSED",
]);

// Staff user types permitted to manage commissions. `withAuth` already grants
// SUPER_ADMIN/ADMIN access; this list covers the narrower finance roles.
const ALLOWED_USER_TYPES = ["FINANCE", "PARTNER_MANAGER", "CEO", "DATA_MANAGER"];

export const GET = withAuth(async (req: Request) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const where: Record<string, string> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  const commissions = await db.commission.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ commissions });
}, { requireUserTypes: ALLOWED_USER_TYPES });

export const POST = withAuth(async (req: Request) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { type, studentId, applicationId, universitySlug, partnerId, amount, currency, notes } = body ?? {};
  if (!type || !amount) return NextResponse.json({ error: "type and amount required" }, { status: 400 });
  if (!COMMISSION_TYPES.has(String(type))) {
    return NextResponse.json({ error: "Invalid commission type" }, { status: 400 });
  }
  const parsedAmount = Number.parseFloat(String(amount));
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 400 });
  }
  const commission = await db.commission.create({
    data: {
      commissionCode: `ALO-COM-${Date.now().toString().slice(-6)}`,
      type: String(type),
      studentId: studentId ? String(studentId) : null,
      applicationId: applicationId ? String(applicationId) : null,
      universitySlug: universitySlug ? String(universitySlug) : null,
      partnerId: partnerId ? String(partnerId) : null,
      amount: parsedAmount,
      currency: currency ? String(currency) : "BDT",
      notes: notes ? String(notes) : null,
      status: "DUE",
    },
  });
  return NextResponse.json({ commission });
}, { requireUserTypes: ALLOWED_USER_TYPES });

export const PATCH = withAuth(async (req: Request, auth) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { id, status } = body ?? {};
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  if (!COMMISSION_STATUSES.has(String(status))) {
    return NextResponse.json({ error: "Invalid commission status" }, { status: 400 });
  }
  const updates: Record<string, unknown> = { status: String(status) };
  if (status === "APPROVED") {
    // Approval is attributed to the authenticated actor — never to a
    // client-supplied `approvedById`, which allowed forged approvals.
    updates.approvedById = auth.userId;
    updates.approvedAt = new Date();
  }
  if (status === "SENT") updates.sentAt = new Date();
  if (status === "RECEIVED") updates.receivedAt = new Date();
  if (status === "RECONCILED") updates.reconciledAt = new Date();
  const commission = await db.commission.update({ where: { id: String(id) }, data: updates });
  return NextResponse.json({ commission });
}, { requireUserTypes: ALLOWED_USER_TYPES });
