import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// B2B Partner Admin Dashboard — KPIs, seats, quota, vouchers, marketing
export async function GET(req: NextRequest) {
  const partnerEmployeeId = req.nextUrl.searchParams.get("partnerId");
  let partner: Awaited<ReturnType<typeof db.employee.findFirst>> = null;
  if (partnerEmployeeId) partner = await db.employee.findFirst({ where: { id: partnerEmployeeId, role: "PARTNER" } });
  if (!partner) partner = await db.employee.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  // Partner users
  const partnerUsers = await db.partnerUser.findMany({ where: { partnerId: partner.id } });

  // Students referred by this partner
  const students = await db.student.findMany({
    where: { partnerId: partner.userId || "none" },
    include: { applications: true, documents: true },
  });

  // Leads from partner
  const leads = await db.lead.findMany({ where: { source: "PARTNER_REFERRAL" } });

  // Marketing quota + usage
  const marketingQuota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: partner.id } });
  const monthYear = new Date().toISOString().slice(0, 7);
  const marketingUsage = await db.partnerMarketingUsage.findUnique({ where: { partnerId_monthYear: { partnerId: partner.id, monthYear } } });
  const marketingRequests = await db.partnerMarketingRequest.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" }, take: 10 });

  // Vouchers
  const vouchers = await db.studentMockTestVoucher.findMany({ where: { partnerId: partner.id }, include: { student: { select: { studentId: true, fullName: true } } } });

  // Benefits
  const benefits = await db.studentBenefitEntitlement.findMany({ where: { partnerId: partner.id } });

  // Seat requests
  const seatRequests = await db.partnerUserSeatRequest.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } });

  // Social accounts
  const socialAccounts = await db.partnerSocialAccount.findMany({ where: { partnerId: partner.id } });

  // Commission
  const commissionPayments = await db.payment.findMany({ where: { partnerId: partner.userId || "none", type: "COMMISSION" } });
  const totalCommission = commissionPayments.reduce((s, p) => s + (p.commissionAmount || 0), 0);
  const pendingCommission = commissionPayments.filter((p) => p.commissionStatus === "PENDING").reduce((s, p) => s + (p.commissionAmount || 0), 0);

  // KPIs
  const activeApps = students.flatMap((s) => s.applications).filter((a) => !["VISA_REFUSED", "ENROLLED"].includes(a.stage));
  const kpis = {
    totalStudents: students.length,
    activeApplications: activeApps.length,
    submittedApplications: activeApps.filter((a) => ["APPLICATION_SUBMITTED", "CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage)).length,
    offerReceived: activeApps.filter((a) => ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage)).length,
    visaReadyStudents: activeApps.filter((a) => ["VISA_DOCUMENTS", "VISA_SUBMITTED", "VISA_APPROVED"].includes(a.stage)).length,
    pendingDocuments: students.flatMap((s) => s.documents).filter((d) => d.status === "PENDING").length,
    availableCounselorSeats: Math.max(0, 3 - partnerUsers.filter((u) => u.role !== "PARTNER_SUPER_ADMIN").length),
    usedCounselorSeats: partnerUsers.filter((u) => u.role !== "PARTNER_SUPER_ADMIN").length,
    monthlyImageQuotaUsed: marketingUsage?.imagesUsed || 0,
    monthlyVideoQuotaUsed: marketingUsage?.videosUsed || 0,
    mockTestVouchersUsed: vouchers.filter((v) => v.status === "USED").length,
    interviewPrepUsage: benefits.filter((b) => b.benefitType.includes("INTERVIEW") && b.usedCount > 0).length,
    englishMockVouchersUsed: vouchers.filter((v) => v.status === "USED").length,
    pendingAloApprovals: seatRequests.filter((s) => s.status === "PENDING").length + marketingRequests.filter((m) => m.approvalStatus === "PENDING_APPROVAL").length,
    totalCommission,
    pendingCommission,
    supportTickets: 2, // placeholder
  };

  return NextResponse.json({
    partner,
    kpis,
    partnerUsers,
    students: students.slice(0, 10),
    leads: leads.slice(0, 10),
    marketingQuota,
    marketingUsage,
    marketingRequests,
    vouchers,
    benefits,
    seatRequests,
    socialAccounts,
    commission: { total: totalCommission, pending: pendingCommission, items: commissionPayments },
  });
}
