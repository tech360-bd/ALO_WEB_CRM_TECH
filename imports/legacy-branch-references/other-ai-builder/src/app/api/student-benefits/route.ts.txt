import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — student benefits (entitlements + vouchers)
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const [entitlements, vouchers] = await Promise.all([
    db.studentBenefitEntitlement.findMany({ where: { studentId } }),
    db.studentMockTestVoucher.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
  ]);

  // Check eligibility — student must have active ALO application
  const student = await db.student.findUnique({ where: { id: studentId }, include: { applications: true } });
  const hasActiveApp = student?.applications.some((a) => !["VISA_REFUSED", "ENROLLED", "CANCELLED"].includes(a.stage)) || false;

  return NextResponse.json({
    eligible: hasActiveApp,
    entitlements,
    vouchers,
    message: hasActiveApp
      ? "Student is eligible for ALO benefits (active application exists)."
      : "No active ALO application. Student is NOT eligible for benefits. No application, no voucher.",
  });
}
