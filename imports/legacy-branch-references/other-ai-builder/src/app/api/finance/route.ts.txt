import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Finance dashboard — revenue, commission, payments
export async function GET() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" } });
  const commissions = await db.employeeCommission.findMany({ orderBy: { createdAt: "desc" } });

  const revenue = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const partnerCommissions = payments.filter((p) => p.type === "COMMISSION");
  const totalCommissionPending = partnerCommissions.filter((p) => p.commissionStatus === "PENDING").reduce((s, p) => s + (p.commissionAmount || 0), 0);
  const totalCommissionPaid = partnerCommissions.filter((p) => p.commissionStatus === "PAID").reduce((s, p) => s + (p.commissionAmount || 0), 0);

  const byType: Record<string, number> = {};
  for (const p of payments) byType[p.type] = (byType[p.type] || 0) + (p.status === "PAID" ? p.amount : 0);

  return NextResponse.json({
    metrics: {
      totalRevenue: revenue,
      pendingPayments: pendingPayments.length,
      partnerCommissionPending: totalCommissionPending,
      partnerCommissionPaid: totalCommissionPaid,
      employeeCommissionPending: commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amount, 0),
      employeeCommissionPaid: commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0),
    },
    revenueByType: byType,
    recentPayments: payments.slice(0, 15),
    partnerCommissions: partnerCommissions.slice(0, 10),
    employeeCommissions: commissions.slice(0, 10),
  });
}
