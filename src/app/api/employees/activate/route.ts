import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const activationToken = await db.employeeActivationToken.findFirst({ where: { tokenHash, status: "active" } });
  if (!activationToken) return NextResponse.json({ error: "Invalid activation token" }, { status: 400 });
  if (new Date() > activationToken.expiresAt) { await db.employeeActivationToken.update({ where: { id: activationToken.id }, data: { status: "expired" } }); return NextResponse.json({ error: "Activation link has expired. Contact HR to resend." }, { status: 400 }); }
  const portalUser = await db.portalUser.findUnique({ where: { id: activationToken.employeeId } });
  if (!portalUser) return NextResponse.json({ error: "Employee account not found" }, { status: 404 });
  await db.employeeActivationToken.update({ where: { id: activationToken.id }, data: { status: "used", usedAt: new Date() } });
  await db.portalUser.update({ where: { id: portalUser.id }, data: { passwordHash: await bcrypt.hash(password, 12), firstLoginRequired: false } });
  const employee = await db.employee.findFirst({ where: { userId: portalUser.id } });
  await db.auditLog.create({ data: { action: "LOGIN", resource: "Employee", resourceId: employee?.id, details: JSON.stringify({ activated: true }) } });
  return NextResponse.json({ success: true, employeeId: employee?.id, employeeName: portalUser.name, message: "Account activated successfully." });
}

export async function PATCH(req: NextRequest) {
  const { employeeId, requestedById } = await req.json();
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  await db.employeeActivationToken.updateMany({ where: { employeeId: employee.userId, status: "active" }, data: { status: "expired" } });
  const token = crypto.randomBytes(32).toString("hex");
  await db.employeeActivationToken.create({ data: { employeeId: employee.userId, tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 7 * 86400000), status: "active" } });
  await db.auditLog.create({ data: { userId: requestedById, action: "AI_ACTION", resource: "Employee", resourceId: employeeId, details: JSON.stringify({ action: "resend_activation" }) } });
  return NextResponse.json({ success: true, activationLink: `/activate?token=${token}`, message: `New activation link sent to ${employee.email}. Expires in 7 days.` });
}
