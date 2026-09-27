import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudentResource } from "@/lib/student-resource-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestedStudentId = req.nextUrl.searchParams.get("studentId");
  if (!requestedStudentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;

  const referrals = await db.referral.findMany({ where: { referrerStudentId: access.studentId }, orderBy: { createdAt: "desc" } });
  const code = `AEFR-${access.studentId.slice(-6).toUpperCase()}`;
  return NextResponse.json({ referrals, referralCode: code });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { referrerStudentId, referredName, referredPhone, referredEmail, source } = body as {
    referrerStudentId?: string;
    referredName?: string;
    referredPhone?: string;
    referredEmail?: string;
    source?: string;
  };
  if (!referrerStudentId) return NextResponse.json({ error: "referrerStudentId required" }, { status: 400 });

  const access = await requireStudentResource(req, referrerStudentId);
  if (access instanceof NextResponse) return access;

  const code = `AEFR-${Date.now().toString().slice(-6)}`;
  const referral = await db.referral.create({
    data: {
      referralCode: code,
      referrerStudentId: access.studentId,
      referredName,
      referredPhone,
      referredEmail,
      source: source || "DIRECT",
      status: "PENDING",
    },
  });
  await db.timelineEvent.create({
    data: {
      studentId: access.studentId,
      stage: "referral",
      type: "NOTE",
      title: "Referral created",
      description: `Referral code ${code} sent to ${referredName || "friend"}`,
    },
  }).catch(() => {});
  return NextResponse.json({ referral });
}
