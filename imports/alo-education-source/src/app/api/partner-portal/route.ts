import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Partner Portal — partner sees only own referred students + commission
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  let partner: Awaited<ReturnType<typeof db.user.findFirst>> = null;
  if (partnerId) partner = await db.user.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.user.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const students = await db.student.findMany({
    where: { partnerId: partner.id },
    include: { applications: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  const leads = await db.lead.findMany({
    where: { source: "PARTNER_REFERRAL", sourceDetail: { contains: partner.name } },
    orderBy: { createdAt: "desc" },
  });

  const commissionPayments = await db.payment.findMany({
    where: { partnerId: partner.id, type: "COMMISSION" },
    orderBy: { createdAt: "desc" },
  });

  const totalCommission = commissionPayments.reduce((s, p) => s + (p.commissionAmount || 0), 0);
  const pendingCommission = commissionPayments.filter((p) => p.commissionStatus === "PENDING").reduce((s, p) => s + (p.commissionAmount || 0), 0);
  const paidCommission = commissionPayments.filter((p) => p.commissionStatus === "PAID").reduce((s, p) => s + (p.commissionAmount || 0), 0);

  return NextResponse.json({
    partner,
    students,
    leads,
    commission: { total: totalCommission, pending: pendingCommission, paid: paidCommission, items: commissionPayments },
    metrics: {
      totalReferrals: leads.length,
      activeStudents: students.length,
      activeApplications: students.flatMap((s) => s.applications).length,
      conversionRate: leads.length > 0 ? Math.round((students.length / leads.length) * 100) : 0,
    },
  });
}
