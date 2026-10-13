import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — leave requests
export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  const leaves = await db.leaveRequest.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ leaves });
}

// POST — create leave request
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { employeeId, leaveType, startDate, endDate, days, reason } = body;
  const leave = await db.leaveRequest.create({
    data: { employeeId, leaveType, startDate, endDate, days, reason, status: "PENDING" },
  });
  return NextResponse.json({ leave, message: "Leave request submitted." });
}

// PATCH — approve/reject leave
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, approvedBy, reviewNote } = body;
  const leave = await db.leaveRequest.update({
    where: { id },
    data: { status, approvedBy, approvedAt: new Date(), reviewNote },
  });
  await db.auditLog.create({ data: { userId: approvedBy, action: "PROFILE_UPDATE", resource: "LeaveRequest", resourceId: id, details: JSON.stringify({ status }) } });
  return NextResponse.json({ leave, message: `Leave ${status.toLowerCase()}.` });
}
