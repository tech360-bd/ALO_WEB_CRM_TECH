import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

// ============================================================
// SEC-F fix (2026-09-18): this route had NO authentication. Any anonymous
// caller could read every payroll record (all employee salaries) via GET, and
// via PATCH could set any payroll row to APPROVED/PAID while supplying their
// own `approvedBy` — forging the approval and its audit entry.
//
// Now staff-only, with the approver taken from the authenticated actor.
// ============================================================

const PAYROLL_STATUSES = new Set(["DRAFT", "PENDING", "APPROVED", "PAID", "CANCELLED"]);
const ALLOWED_USER_TYPES = ["FINANCE", "HR", "CEO"];

// GET — payroll records
export const GET = withAuth(async (req: Request) => {
  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employeeId");
  const monthYear = url.searchParams.get("monthYear");
  const status = url.searchParams.get("status");
  const where: Record<string, string> = {};
  if (employeeId) where.employeeId = employeeId;
  if (monthYear) where.monthYear = monthYear;
  if (status) where.status = status;
  const payroll = await db.payroll.findMany({ where, orderBy: { monthYear: "desc" } });
  return NextResponse.json({ payroll });
}, { requireUserTypes: ALLOWED_USER_TYPES });

// PATCH — approve/pay payroll
export const PATCH = withAuth(async (req: Request, auth) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { id, status } = body ?? {};
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  if (!PAYROLL_STATUSES.has(String(status))) {
    return NextResponse.json({ error: "Invalid payroll status" }, { status: 400 });
  }
  // The approver is the authenticated actor — never a body-supplied value.
  const approvedBy = auth.userId;
  const payroll = await db.payroll.update({
    where: { id: String(id) },
    data: { status: String(status), approvedBy, paidAt: status === "PAID" ? new Date() : null },
  });
  await db.auditLog.create({
    data: { userId: approvedBy, action: "PAYROLL_STATUS_CHANGE", resource: "Payroll", resourceId: String(id), details: JSON.stringify({ status }) },
  });
  return NextResponse.json({ payroll, message: `Payroll ${String(status).toLowerCase()}.` });
}, { requireUserTypes: ALLOWED_USER_TYPES });
