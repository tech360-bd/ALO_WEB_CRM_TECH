import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin"]);

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const isAdmin = ADMIN_ROLES.has(auth.userType) || auth.roles.some((role) => ADMIN_ROLES.has(role));
  const requestedPartnerId = req.nextUrl.searchParams.get("partnerId");
  if (!isAdmin && !auth.roles.some((role) => ["PARTNER", "partner"].includes(role)) && !["PARTNER", "partner"].includes(auth.userType)) {
    return NextResponse.json({ error: "Partner access required" }, { status: 403 });
  }
  if (!isAdmin && requestedPartnerId && requestedPartnerId !== auth.userId) {
    return NextResponse.json({ error: "You can only access your own partner data" }, { status: 403 });
  }

  // Never fall back to an arbitrary first partner. A partner request is scoped
  // to its authenticated identity; only an admin may choose a partnerId.
  const effectivePartnerId = isAdmin ? requestedPartnerId : auth.userId;
  if (!effectivePartnerId) return NextResponse.json({ error: "partnerId required for admin requests" }, { status: 400 });
  const partner = await db.user.findFirst({ where: { id: effectivePartnerId, role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const [partnerLeads, commissionPayments] = await Promise.all([
    db.partnerLead.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { partnerId: partner.id, type: "COMMISSION" }, orderBy: { createdAt: "desc" } }),
  ]);
  const studentIds = Array.from(new Set(partnerLeads.map((lead) => lead.studentId).filter(Boolean)));
  const students = await db.student.findMany({ where: { id: { in: studentIds } }, include: { payments: true }, orderBy: { createdAt: "desc" } });
  const applications = await db.application.findMany({ where: { studentId: { in: studentIds } } });
  const totalCommission = commissionPayments.reduce((sum, payment) => sum + (payment.commissionAmount || 0), 0);
  const pendingCommission = commissionPayments.filter((payment) => payment.commissionStatus === "PENDING").reduce((sum, payment) => sum + (payment.commissionAmount || 0), 0);
  const paidCommission = commissionPayments.filter((payment) => payment.commissionStatus === "PAID").reduce((sum, payment) => sum + (payment.commissionAmount || 0), 0);
  return NextResponse.json({ partner, students, leads: partnerLeads, commission: { total: totalCommission, pending: pendingCommission, paid: paidCommission, items: commissionPayments }, metrics: { totalReferrals: partnerLeads.length, activeStudents: students.length, activeApplications: applications.length, conversionRate: partnerLeads.length ? Math.round(students.length / partnerLeads.length * 100) : 0 } });
}
