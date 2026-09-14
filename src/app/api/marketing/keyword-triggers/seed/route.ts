import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 8 spec keyword triggers with autoReply+DM+lead+portal link behaviors
const DEFAULT_TRIGGERS: Array<{
  keyword: string;
  keywordType: string;
  platform: string;
  autoReplyText: string;
  autoDmText: string;
}> = [
  {
    keyword: "Study Abroad",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for your interest in Study Abroad! 🎓 ALO Education offers free counseling for UK, Canada, Australia & Europe. A counselor will contact you shortly — or DM us your phone number for a faster reply.",
    autoDmText: "Hi! 👋 Thanks for asking about Study Abroad. Share your phone/WhatsApp and preferred country (UK/Canada/Australia) and our counselor will call within 2 hours. Portal: https://alo-education.com/lead-form",
  },
  {
    keyword: "IELTS",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for asking about IELTS! 📚 We guide you on IELTS/PTE preparation and required scores by country/university. DM us your phone — counselor will share batch & score plan.",
    autoDmText: "Hi! IELTS guidance — minimum score depends on country: UK 6.0–6.5, Canada 6.5, Australia 6.0+. Share your phone and we’ll send a free consultation link: https://alo-education.com/lead-form",
  },
  {
    keyword: "Visa",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for your message about Visa! 🛂 We provide step-by-step visa guidance (documents, bank statement, CAS/PAL). No false guarantees — 100% transparent counseling. DM your phone for visa checklist.",
    autoDmText: "Hi! Visa support from ALO — checklists, interview prep & timeline. For personal guidance, share your phone/WhatsApp: https://alo-education.com/lead-form — counselor will contact you.",
  },
  {
    keyword: "UK",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for asking about UK! 🇬🇧 September & January intakes open — CAS, scholarships & visa guidance available. DM your phone and our UK specialist will reach out.",
    autoDmText: "Hi! UK study — top universities, scholarships & CAS support. Share your phone/WhatsApp for free UK eligibility check: https://alo-education.com/lead-form",
  },
  {
    keyword: "Canada",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for asking about Canada! 🇨🇦 SDS ended Nov 2024 — now PAL-based regular stream (cap 408k 2026). We’ll check your program & PAL. DM your phone for counselor call.",
    autoDmText: "Hi! Canada 2026 — PAL required, PGWP needs CLB7/5 + field check. Share phone for trusted counseling & college matching: https://alo-education.com/lead-form",
  },
  {
    keyword: "Australia",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for asking about Australia! 🇦🇺 Subclass 500 — GS (not GTE), CoE via PRISMS, AUD 2,000 charge. OSHC & work 48h/fortnight guidance. DM phone — counselor will call.",
    autoDmText: "Hi! Australia 2026 — GS statement, OSHC & genuine course info needed. Share phone/WhatsApp for free Australia consultation: https://alo-education.com/lead-form",
  },
  {
    keyword: "Scholarship",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Thanks for asking about Scholarships! 🎓 Up to 50–100% merit scholarships via partner universities. DM your phone + CGPA & target country — counselor will share your best matches.",
    autoDmText: "Hi! Scholarships 2026 — UK/Canada/Australia/Europe partners. Share CGPA, target course & phone for your scholarship shortlist: https://alo-education.com/lead-form",
  },
  {
    keyword: "Apply",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "Ready to apply? 🚀 ALO Education: free counseling, application & visa help. Drop your phone in DM — counselor will start your file today. Portal: https://alo-education.com/lead-form",
    autoDmText: "Hi! Let’s start your application 🎓 Click the portal and our counselor will guide you end-to-end: https://alo-education.com/lead-form — or reply with your phone.",
  },
];

// POST — seed missing default triggers (idempotent by keyword)
export const POST = withAuth(async (_req: Request, _auth: AuthContext) => {
  let created = 0, skipped = 0;
  const errors: string[] = [];
  for (const t of DEFAULT_TRIGGERS) {
    try {
      const existing = await db.keywordTrigger.findUnique({ where: { keyword: t.keyword } }).catch(() => null);
      if (existing) { skipped++; continue; }
      await db.keywordTrigger.create({
        data: {
          keyword: t.keyword,
          keywordType: t.keywordType,
          platform: t.platform,
          autoReplyText: t.autoReplyText,
          autoDmText: t.autoDmText,
          autoCreateLead: true,
          autoAssignCounselor: true,
          sendPortalLink: true,
          status: "ACTIVE",
        },
      });
      created++;
    } catch (e: any) {
      if (String(e.message).includes("Unique") || String(e.message).includes("unique")) skipped++;
      else errors.push(`${t.keyword}: ${e.message}`);
    }
  }

  await db.auditLog.create({
    data: {
      action: "DATA_IMPORT",
      resource: "KeywordTriggerSeed",
      details: JSON.stringify({ created, skipped, errors }),
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, created, skipped, total: DEFAULT_TRIGGERS.length, errors } as any);
}, MARKETING_AUTH);

// GET — list which defaults are missing (for UI indicator)
export const GET = withAuth(async (_req: Request, _auth: AuthContext) => {
  const all = await db.keywordTrigger.findMany({ where: { status: "ACTIVE" } }).catch(() => []);
  const existingKeywords = new Set(all.map((t: any) => t.keyword.toLowerCase()));
  const missing = DEFAULT_TRIGGERS.filter((t) => !existingKeywords.has(t.keyword.toLowerCase()));
  return NextResponse.json({ defaults: DEFAULT_TRIGGERS.map((t) => t.keyword), missing: missing.map((t) => t.keyword), existing: all.length } as any);
}, MARKETING_AUTH);
