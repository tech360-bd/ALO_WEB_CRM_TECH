import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// GET — vouchers for partner
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  let partner: Awaited<ReturnType<typeof db.employee.findFirst>> = null;
  if (partnerId) partner = await db.employee.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employee.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const [vouchers, benefits] = await Promise.all([
    db.studentMockTestVoucher.findMany({ where: { partnerId: partner.id }, include: { student: { select: { studentId: true, fullName: true, email: true } } }, orderBy: { createdAt: "desc" } }),
    db.studentBenefitEntitlement.findMany({ where: { partnerId: partner.id }, include: { student: { select: { studentId: true, fullName: true } } } }),
  ]);

  return NextResponse.json({
    vouchers,
    benefits,
    summary: {
      total: vouchers.length,
      available: vouchers.filter((v) => v.status === "AVAILABLE").length,
      used: vouchers.filter((v) => v.status === "USED").length,
      expired: vouchers.filter((v) => v.status === "EXPIRED").length,
    },
  });
}

// POST — generate vouchers for eligible student (3 English mock vouchers per eligible student with active ALO application)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, partnerId, applicationId, testType, count, createdBy } = body;

  // Verify student has an active ALO application
  const student = await db.student.findUnique({ where: { id: studentId }, include: { applications: true } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const activeApp = student.applications.find((a) => !["VISA_REFUSED", "ENROLLED", "CANCELLED"].includes(a.stage));
  if (!activeApp) {
    return NextResponse.json({ error: "Student must have an active ALO application to receive vouchers. No application, no voucher." }, { status: 403 });
  }

  const vouchers: Awaited<ReturnType<typeof db.studentMockTestVoucher.create>>[] = [];
  const numToCreate = count || 3; // default 3 English mock vouchers
  for (let i = 0; i < numToCreate; i++) {
    const voucher = await db.studentMockTestVoucher.create({
      data: {
        voucherCode: `ALO-MT-${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        studentId,
        partnerId,
        applicationId: applicationId || activeApp.id,
        testType: testType || "IELTS",
        usageLimit: 1,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status: "AVAILABLE",
        createdBy,
      },
    });
    vouchers.push(voucher);
  }

  // Create benefit entitlements
  const benefits = [
    { benefitType: "UKVI_INTERVIEW_PREP", limitCount: 1 },
    { benefitType: "UNIVERSITY_INTERVIEW_PREP", limitCount: 1 },
    { benefitType: "ENGLISH_MOCK_TEST", limitCount: 3 },
    { benefitType: "AI_SPEAKING_PRACTICE", limitCount: 1 },
    { benefitType: "DOCUMENT_CHECKLIST", limitCount: 1 },
    { benefitType: "APPLICATION_GUIDANCE", limitCount: 1 },
  ];
  for (const b of benefits) {
    await db.studentBenefitEntitlement.create({
      data: { studentId, partnerId, applicationId: activeApp.id, benefitType: b.benefitType, limitCount: b.limitCount, usedCount: 0, status: "ACTIVE", createdBy },
    });
  }

  await db.auditLog.create({
    data: { action: "AI_ACTION", resource: "StudentMockTestVoucher", resourceId: studentId, details: JSON.stringify({ count: numToCreate, benefitType: "ENGLISH_MOCK_TEST" }) },
  });

  return NextResponse.json({
    vouchers,
    benefits,
    message: `${numToCreate} English mock test vouchers generated. Student is now eligible for interview prep, speaking practice, and document checklist benefits.`,
  });
}

// PATCH — use a voucher
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { voucherCode, usedBy } = body;

  const voucher = await db.studentMockTestVoucher.findUnique({ where: { voucherCode } });
  if (!voucher) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  if (voucher.status !== "AVAILABLE") return NextResponse.json({ error: `Voucher is ${voucher.status}` }, { status: 400 });
  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    await db.studentMockTestVoucher.update({ where: { id: voucher.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Voucher has expired" }, { status: 400 });
  }

  const updated = await db.studentMockTestVoucher.update({
    where: { id: voucher.id },
    data: { usedCount: { increment: 1 }, status: "USED" },
  });

  await db.auditLog.create({
    data: { userId: usedBy, action: "AI_ACTION", resource: "StudentMockTestVoucher", resourceId: voucher.id, details: JSON.stringify({ voucherCode }) },
  });

  return NextResponse.json({ voucher: updated, message: "Voucher used successfully. Mock test unlocked." });
}
