import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const referrals = await db.referral.findMany({ where: { referrerStudentId: studentId }, orderBy: { createdAt: "desc" } });
  const code = `AEFR-${studentId.slice(-6).toUpperCase()}`;
  return NextResponse.json({ referrals, referralCode: code });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { referrerStudentId, referredName, referredPhone, referredEmail, source } = body;
  if (!referrerStudentId) return NextResponse.json({ error: "referrerStudentId required" }, { status: 400 });
  const code = `AEFR-${Date.now().toString().slice(-6)}`;
  const referral = await db.referral.create({ data: { referralCode: code, referrerStudentId, referredName, referredPhone, referredEmail, source: source || "DIRECT", status: "PENDING" } });
  await db.timelineEvent.create({ data: { studentId: referrerStudentId, type: "NOTE", title: "Referral created", description: `Referral code ${code} sent to ${referredName || "friend"}` } }).catch(() => {});
  return NextResponse.json({ referral });
}
