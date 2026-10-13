import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — device management
export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  const devices = await db.deviceManagement.findMany({ where, orderBy: { assignedDate: "desc" } });
  return NextResponse.json({ devices });
}

// POST — register device
export async function POST(req: NextRequest) {
  const body = await req.json();
  const device = await db.deviceManagement.create({ data: body });
  await db.auditLog.create({ data: { action: "DATA_IMPORT", resource: "DeviceManagement", resourceId: device.id, details: JSON.stringify({ deviceName: body.deviceName }) } });
  return NextResponse.json({ device, message: "Device registered." });
}

// PATCH — return device
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, returnedDate, condition } = body;
  const device = await db.deviceManagement.update({ where: { id }, data: { status, returnedDate, condition } });
  return NextResponse.json({ device, message: "Device updated." });
}
