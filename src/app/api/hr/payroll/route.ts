import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — payroll records
export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const monthYear = req.nextUrl.searchParams.get("monthYear");
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  if (monthYear) where.monthYear = monthYear;
  if (status) where.status = status;
  const payroll = await db.payroll.findMany({ where, orderBy: { monthYear: "desc" } });
  return NextResponse.json({ payroll });
}

// PATCH — approve/pay payroll
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, approvedBy } = body;
  const payroll = await db.payroll.update({
    where: { id },
    data: { status, approvedBy, paidAt: status === "PAID" ? new Date() : null },
  });
  await db.auditLog.create({ data: { userId: approvedBy, action: "COMMISSION_APPROVE", resource: "Payroll", resourceId: id, details: JSON.stringify({ status }) } });
  return NextResponse.json({ payroll, message: `Payroll ${status.toLowerCase()}.` });
}
