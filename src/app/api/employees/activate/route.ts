import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// Activate employee account — verify token, create password (simulated)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const activationToken = await db.employeeActivationToken.findFirst({
    where: { tokenHash, status: "ACTIVE" },
    include: { employee: true },
  });

  if (!activationToken) {
    return NextResponse.json({ error: "Invalid activation token" }, { status: 400 });
  }

  if (new Date() > activationToken.expiresAt) {
    await db.employeeActivationToken.update({
      where: { id: activationToken.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Activation link has expired. Contact HR to resend." }, { status: 400 });
  }

  // Mark token as used
  await db.employeeActivationToken.update({
    where: { id: activationToken.id },
    data: { status: "USED", usedAt: new Date() },
  });

  // Update employee profile status
  await db.employee.update({
    where: { id: activationToken.employeeId },
    data: { profileStatus: "INCOMPLETE" }, // Employee must now complete their profile
  });

  // In production: hash and store the password, create User account
  // For now, simulate
  await db.auditLog.create({
    data: {
      action: "LOGIN",
      resource: "Employee",
      resourceId: activationToken.employeeId,
      details: JSON.stringify({ activated: true, passwordCreated: true }),
    },
  });

  return NextResponse.json({
    success: true,
    employeeId: activationToken.employeeId,
    employeeName: activationToken.employee.fullName,
    message: "Account activated successfully. Please complete your profile now.",
  });
}

// Resend activation email (Super Admin / HR)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { employeeId, requestedById } = body;

  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Expire old tokens
  await db.employeeActivationToken.updateMany({
    where: { employeeId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  // Create new token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.employeeActivationToken.create({
    data: { employeeId, tokenHash, expiresAt, status: "ACTIVE" },
  });

  await db.auditLog.create({
    data: {
      userId: requestedById,
      action: "AI_ACTION",
      resource: "Employee",
      resourceId: employeeId,
      details: JSON.stringify({ action: "resend_activation" }),
    },
  });

  return NextResponse.json({
    success: true,
    activationLink: `/activate?token=${token}`,
    message: `New activation link sent to ${employee.companyEmail}. Expires in 7 days.`,
  });
}
