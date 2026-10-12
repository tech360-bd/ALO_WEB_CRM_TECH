import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — partner users
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  let partner: Awaited<ReturnType<typeof db.employeeHR.findFirst>> = null;
  if (partnerId) partner = await db.employeeHR.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employeeHR.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const users = await db.partnerUser.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users, partner, maxUsers: 3 });
}

// POST — create partner user (checks seat limit)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partnerId, fullName, email, phone, role, permissions, createdBy } = body;

  let partner = await db.employeeHR.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employeeHR.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  // Check seat limit (default 3)
  const existingUsers = await db.partnerUser.count({ where: { partnerId: partner.id } });
  const seatRequest = await db.partnerUserSeatRequest.findFirst({ where: { partnerId: partner.id, status: "APPROVED" }, orderBy: { createdAt: "desc" } });
  const maxUsers = 3 + (seatRequest ? seatRequest.requestedExtraSeats : 0);

  if (existingUsers >= maxUsers) {
    return NextResponse.json({
      error: "User seat limit reached",
      message: `You have reached the maximum of ${maxUsers} users. Request extra seats from ALO Education Super Admin.`,
      currentLimit: maxUsers,
      used: existingUsers,
    }, { status: 403 });
  }

  // Check duplicate email
  const existing = await db.partnerUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });

  const user = await db.partnerUser.create({
    data: {
      partnerEmployeeId: partner.id,
      partnerId: partner.id,
      role: role || "PARTNER_COUNSELOR",
      fullName,
      email,
      phone,
      status: "ACTIVE",
      permissions: JSON.stringify(permissions || []),
      createdBy: createdBy || partner.id,
    },
  });

  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "PartnerUser", resourceId: user.id, details: JSON.stringify({ role, partnerId: partner.id }) },
  });

  return NextResponse.json({ user, message: "Partner user created successfully." });
}

// PATCH — suspend/activate user
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const user = await db.partnerUser.update({ where: { id }, data: { status } });
  return NextResponse.json({ user });
}
