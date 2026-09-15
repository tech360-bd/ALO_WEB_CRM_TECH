// Partnership Communications — emails, agreements, calls, meetings timeline
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const universitySlug = sp.get("universitySlug") || undefined;
    const communicationType = sp.get("communicationType") || undefined;
    const status = sp.get("status") || undefined;
    const q = sp.get("q") || undefined;
    const limit = sp.get("limit") ? Math.min(100, parseInt(sp.get("limit")!)) : 20;
    const offset = sp.get("offset") ? parseInt(sp.get("offset")!) : 0;

    const where: any = {};
    if (universitySlug) where.universitySlug = universitySlug;
    if (communicationType) where.communicationType = communicationType;
    if (status) where.status = status;
    if (q) where.OR = [{ subject: { contains: q } }, { body: { contains: q } }, { contactName: { contains: q } }, { contactEmail: { contains: q } }];

    const [communications, total] = await Promise.all([
      db.partnershipCommunication.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      db.partnershipCommunication.count({ where }),
    ]);

    // Also fetch related OfficialEmail and UniversityAgreement for context if universitySlug provided
    let relatedEmails: any[] = [];
    let relatedAgreements: any[] = [];
    if (universitySlug) {
      [relatedEmails, relatedAgreements] = await Promise.all([
        db.officialEmail.findMany({ where: { universitySlug } as any, orderBy: { createdAt: "desc" }, take: 20 }).catch(() => []),
        db.universityAgreement.findMany({ where: { universitySlug }, orderBy: { createdAt: "desc" }, take: 20 }).catch(() => []),
      ]);
    } else {
      // General recent emails and agreements for dashboard
      [relatedEmails, relatedAgreements] = await Promise.all([
        db.officialEmail.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
        db.universityAgreement.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
      ]);
    }

    return NextResponse.json({ success: true, communications, total, limit, offset, relatedEmails, relatedAgreements });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const body = await req.json();

    if (!body.universitySlug || !body.subject) {
      return NextResponse.json({ error: "universitySlug and subject required" }, { status: 400 });
    }

    const comm = await db.partnershipCommunication.create({
      data: {
        universitySlug: body.universitySlug,
        universityName: body.universityName || body.universitySlug,
        communicationType: body.communicationType || "EMAIL",
        subject: body.subject,
        body: body.body || "",
        direction: body.direction || "OUTBOUND",
        status: body.status || "DRAFT",
        contactName: body.contactName || "",
        contactEmail: body.contactEmail || "",
        contactPhone: body.contactPhone || "",
        agreementId: body.agreementId || null,
        emailId: body.emailId || null,
        b2bContactId: body.b2bContactId || null,
        attachments: JSON.stringify(body.attachments || []),
        sentAt: body.sentAt ? new Date(body.sentAt) : body.status === "SENT" ? new Date() : null,
        createdById: user.id || user.email || "unknown",
      },
    });

    // If EMAIL type and should also create OfficialEmail record
    if (body.createOfficialEmail && body.communicationType === "EMAIL") {
      await db.officialEmail.create({
        data: {
          recipientEmail: body.contactEmail || "",
          recipientName: body.contactName || body.universityName,
          emailType: "UNIVERSITY_COMMUNICATION",
          subject: body.subject,
          body: body.body,
          status: body.status === "SENT" ? "SENT" : "DRAFT",
          universitySlug: body.universitySlug,
          createdById: user.id || user.email || "unknown",
        } as any,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, communication: comm });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: any = {};
    const fields = ["subject", "body", "status", "communicationType", "direction", "contactName", "contactEmail", "contactPhone", "agreementId", "emailId", "b2bContactId"];
    for (const f of fields) if (body[f] !== undefined) updateData[f] = body[f];
    if (body.attachments !== undefined) updateData.attachments = JSON.stringify(body.attachments);
    if (body.sentAt !== undefined) updateData.sentAt = body.sentAt ? new Date(body.sentAt) : null;
    if (body.repliedAt !== undefined) updateData.repliedAt = body.repliedAt ? new Date(body.repliedAt) : null;
    if (body.status === "SENT" && !updateData.sentAt) updateData.sentAt = new Date();
    if (body.status === "REPLIED" && !updateData.repliedAt) updateData.repliedAt = new Date();

    const comm = await db.partnershipCommunication.update({ where: { id: body.id }, data: updateData });
    return NextResponse.json({ success: true, communication: comm });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
