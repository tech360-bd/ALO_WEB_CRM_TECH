import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST — create lead from homepage form
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, preferredCountry, preferredLevel, preferredSubject, intake, budget, englishTest, englishScore, message, source, sourceSection } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  // Create lead form entry
  const leadForm = await db.leadForm.create({
    data: {
      name, phone, email,
      preferredCountry, preferredLevel, preferredSubject,
      intake, budget, englishTest, englishScore,
      message,
      source: source || "homepage",
      sourceSection: sourceSection || "final_cta",
      status: "NEW",
    },
  });

  // Also create a Lead record (CRM integration)
  const existing = await db.lead.findFirst({ where: { OR: [{ phone }, ...(email ? [{ email }] : [])] } });
  if (existing) {
    await db.lead.update({ where: { id: existing.id }, data: { status: "CONTACTED" } });
  } else {
    const count = await db.lead.count();
    await db.lead.create({
      data: {
        leadId: `ALO-L-${(10001 + count + 1).toString()}`,
        fullName: name,
        email: email || null,
        phone,
        source: "WEBSITE",
        sourceDetail: `Homepage ${sourceSection || "form"}`,
        preferredCountry,
        preferredCourse: preferredSubject,
        notes: `${message || ""}${preferredLevel ? ` | Level: ${preferredLevel}` : ""}${intake ? ` | Intake: ${intake}` : ""}${budget ? ` | Budget: ${budget}` : ""}${englishScore ? ` | English: ${englishTest || ""} ${englishScore}` : ""}`.trim(),
        status: "NEW",
        welcomeSent: false,
      },
    });
  }

  // Audit log
  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "LeadForm", resourceId: leadForm.id, details: JSON.stringify({ source: source || "homepage", sourceSection }) },
  });

  return NextResponse.json({
    leadForm,
    message: "Lead created successfully. An ALO counselor will contact you within 24 hours.",
  });
}
