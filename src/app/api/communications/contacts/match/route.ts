import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Normalize Bangladeshi phone numbers to international format
function normalizePhone(phone: string): string {
  if (!phone) return "";
  // strip non-digits
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // local 01XXXXXXXXX → 8801XXXXXXXXX
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "880" + digits;
  } else if (digits.startsWith("880")) {
    // already international
  } else if (digits.startsWith("+880")) {
    digits = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "880" + digits;
  }
  return digits;
}

// POST — match incoming contact against Student / Lead / User(partner)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, name } = body;

    if (!phone && !email) {
      return NextResponse.json({ error: "phone or email is required" }, { status: 400 });
    }

    const incomingPhone = phone || "";
    const normalizedPhone = normalizePhone(incomingPhone);

    // Search across the canonical Main Student phone field, Lead phone fields,
    // and User (phone, role=PARTNER). Legacy mobile aliases are donor-only.
    const [studentsByMobile, studentsByAltMobile, leadsByPhone, leadsByAltPhone, partnersByPhone, partnersByEmail] = await Promise.all([
      db.student.findFirst({ where: { phone: incomingPhone } }),
      normalizedPhone ? db.student.findFirst({ where: { phone: normalizedPhone } }) : null,
      db.lead.findFirst({ where: { phone: incomingPhone } }),
      normalizedPhone ? db.lead.findFirst({ where: { OR: [{ phone: incomingPhone }, { phone: normalizedPhone }, { altPhone: incomingPhone }, { altPhone: normalizedPhone }] } }) : null,
      db.user.findFirst({ where: { phone: incomingPhone, role: "PARTNER" } }),
      email ? db.user.findFirst({ where: { email: email.toLowerCase(), role: "PARTNER" } }) : null,
    ]);

    // Pick best match — student > lead > partner
    type Match = { matchType: "STUDENT" | "LEAD" | "PARTNER" | "NONE"; matchedId?: string; confidence: number; matchReason?: string; existingRecord?: any };
    const candidates: Match[] = [];
    if (studentsByMobile) candidates.push({ matchType: "STUDENT", matchedId: studentsByMobile.id, confidence: 100, matchReason: "EXACT_PHONE_STUDENT_MOBILE", existingRecord: studentsByMobile });
    if (studentsByAltMobile && studentsByAltMobile.id !== studentsByMobile?.id) candidates.push({ matchType: "STUDENT", matchedId: studentsByAltMobile.id, confidence: 92, matchReason: "ALT_PHONE_STUDENT", existingRecord: studentsByAltMobile });
    if (leadsByPhone) candidates.push({ matchType: "LEAD", matchedId: leadsByPhone.id, confidence: 88, matchReason: "EXACT_PHONE_LEAD", existingRecord: leadsByPhone });
    if (leadsByAltPhone && leadsByAltPhone.id !== leadsByPhone?.id) candidates.push({ matchType: "LEAD", matchedId: leadsByAltPhone.id, confidence: 80, matchReason: "ALT_PHONE_LEAD", existingRecord: leadsByAltPhone });
    if (partnersByPhone) candidates.push({ matchType: "PARTNER", matchedId: partnersByPhone.id, confidence: 85, matchReason: "EXACT_PHONE_PARTNER", existingRecord: partnersByPhone });
    if (partnersByEmail) candidates.push({ matchType: "PARTNER", matchedId: partnersByEmail.id, confidence: 78, matchReason: "EMAIL_PARTNER", existingRecord: partnersByEmail });

    const best = candidates.length > 0 ? candidates.reduce((a, b) => (a.confidence > b.confidence ? a : b)) : null;
    const possibleDuplicates = candidates.filter((c) => c.matchedId !== best?.matchedId);

    // Persist a ContactMatchReview row for audit trail when no exact match found
    let reviewId: string | null = null;
    if (!best || best.confidence < 100) {
      const review = await db.contactMatchReview.create({
        data: {
          incomingPhone,
          normalizedPhone,
          incomingName: name || null,
          incomingEmail: email || null,
          matchedStudentId: best?.matchType === "STUDENT" ? best.matchedId : null,
          matchedLeadId: best?.matchType === "LEAD" ? best.matchedId : null,
          matchedPartnerId: best?.matchType === "PARTNER" ? best.matchedId : null,
          matchConfidence: best?.confidence || 0,
          matchReason: best?.matchReason || null,
          status: "PENDING",
        },
      });
      reviewId = review.id;
    }

    const response: any = {
      matched: !!best,
      matchType: best?.matchType || "NONE",
      matchedId: best?.matchedId || null,
      confidence: best?.confidence || 0,
      matchReason: best?.matchReason || null,
      existingRecord: best?.existingRecord || null,
      reviewId,
    };
    if (possibleDuplicates.length > 0) {
      response.possibleDuplicates = possibleDuplicates;
    }
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Contact match failed" }, { status: 500 });
  }
}
