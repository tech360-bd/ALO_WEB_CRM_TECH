import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  const emails = await db.officialEmail.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ emails });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { emailType, recipient, recipientName, subject, body: emailBody, relatedCrmId, relatedCrmType } = body;
  if (!recipient || !subject) return NextResponse.json({ error: "recipient and subject required" }, { status: 400 });
  const email = await db.officialEmail.create({ data: { emailType: emailType || "PROMOTIONAL", recipient, recipientName, subject, body: emailBody || "", relatedCrmId, relatedCrmType, status: "QUEUED" } });
  return NextResponse.json({ email, message: "Email queued. Will use official ALO Education branding when sent." });
}
