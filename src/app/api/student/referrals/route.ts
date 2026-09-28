import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/student-resource-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const referrals = await db.referral.findMany({ where: { referrerStudentId: access.studentId }, orderBy: { createdAt: "desc" } });
  const code = `AEFR-${access.studentId.slice(-6).toUpperCase()}`;
  return NextResponse.json({ referrals, referralCode: code });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { referredName, referredPhone, referredEmail, source } = body;
  const access = await resolveStudentAccess(req, body.referrerStudentId || null);
  if (access instanceof NextResponse) return access;
  const code = `AEFR-${Date.now().toString().slice(-6)}`;
  const referral = await db.referral.create({ data: { referralCode: code, referrerStudentId: access.studentId, referredName, referredPhone, referredEmail, source: source || "DIRECT", status: "PENDING" } });
  await db.timelineEvent.create({ data: { studentId: access.studentId, stage: "referral", type: "NOTE", title: "Referral created", description: `Referral code ${code} sent to ${referredName || "friend"}` } }).catch(() => {});
  return NextResponse.json({ referral });
}
