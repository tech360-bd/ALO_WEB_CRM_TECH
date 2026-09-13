import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  const partner = partnerId ? await db.user.findFirst({ where: { id: partnerId, role: "PARTNER" } }) : await db.user.findFirst({ where: { role: "PARTNER" } });
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
