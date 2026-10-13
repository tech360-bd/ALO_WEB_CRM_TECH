// ALO Education — B2B Partner Portal seed
// Seeds: partner users, marketing quotas, usage, sample requests, vouchers, benefits, social accounts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const db = new PrismaClient();

function rid(n = 6) { return crypto.randomBytes(n).toString("hex").toUpperCase().slice(0, n); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log("Seeding B2B Partner Portal data...");

  await db.studentMockTestVoucher.deleteMany();
  await db.studentBenefitEntitlement.deleteMany();
  await db.partnerSocialAccount.deleteMany();
  await db.partnerMarketingRequest.deleteMany();
  await db.partnerMarketingUsage.deleteMany();
  await db.partnerMarketingQuota.deleteMany();
  await db.partnerUserSeatRequest.deleteMany();
  await db.partnerUser.deleteMany();

  // Find the partner employee
  const partnerEmp = await db.employee.findFirst({ where: { role: "PARTNER" } });
  if (!partnerEmp) { console.log("No partner employee found — skipping"); return; }

  // ─── Partner Marketing Quota ───
  await db.partnerMarketingQuota.create({
    data: {
      partnerId: partnerEmp.id,
      monthlyImageLimit: 15,
      monthlyVideoLimit: 10,
      videoDurationLimitSeconds: 30,
      autoPublishAllowed: false,
      requiresAloApproval: true,
      status: "ACTIVE",
    },
  });

  // ─── Partner Marketing Usage (current month) ───
  const monthYear = new Date().toISOString().slice(0, 7);
  await db.partnerMarketingUsage.create({
    data: {
      partnerId: partnerEmp.id,
      monthYear,
      imagesUsed: 8,
      videosUsed: 4,
      ideasSubmitted: 6,
      postsScheduled: 3,
      postsPublished: 2,
    },
  });

  // ─── Partner Users (1 super admin + 2 counselors = 3, the default limit) ───
  const partnerUsers = [
    { role: "PARTNER_SUPER_ADMIN", fullName: partnerEmp.fullName, email: partnerEmp.companyEmail, phone: partnerEmp.phone },
    { role: "PARTNER_COUNSELOR", fullName: "Imran Partner", email: "imran.partner@b2bpartner.com", phone: "+8801811111111" },
    { role: "PARTNER_COUNSELOR", fullName: "Nusrat Partner", email: "nusrat.partner@b2bpartner.com", phone: "+8801822222222" },
  ];
  for (const u of partnerUsers) {
    await db.partnerUser.create({
      data: {
        partnerEmployeeId: partnerEmp.id,
        partnerId: partnerEmp.id,
        role: u.role,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        status: "ACTIVE",
        permissions: JSON.stringify(u.role === "PARTNER_SUPER_ADMIN" ? ["*"] : ["students.view", "applications.view", "documents.view"]),
        createdBy: partnerEmp.id,
      },
    });
  }

  // ─── Partner User Seat Request (sample pending) ───
  await db.partnerUserSeatRequest.create({
    data: {
      partnerId: partnerEmp.id,
      requestedBy: partnerEmp.id,
      currentLimit: 3,
      requestedExtraSeats: 2,
      reason: "Need 2 more counselors for September intake surge",
      status: "PENDING",
    },
  });

  // ─── Partner Marketing Requests (sample) ───
  const marketingIdeas = [
    { idea: "UK September intake deadline reminder", country: "UK", university: "University of Manchester", course: "MSc Computer Science", intake: "September 2025", platform: "FACEBOOK", targetAudience: "Bangladeshi students planning UK study" },
    { idea: "Canada study permit webinar promo", country: "Canada", university: "Fanshawe College", course: "PG Diploma Business", intake: "January 2025", platform: "INSTAGRAM", targetAudience: "Students interested in Canada PR pathway" },
    { idea: "Free IELTS mock test campaign", country: "Australia", university: "University of Melbourne", course: "Master of IT", intake: "February 2025", platform: "FACEBOOK", targetAudience: "Students needing English test prep" },
  ];
  for (const m of marketingIdeas) {
    await db.partnerMarketingRequest.create({
      data: {
        partnerId: partnerEmp.id,
        requestedBy: partnerEmp.id,
        idea: m.idea,
        country: m.country,
        university: m.university,
        course: m.course,
        intake: m.intake,
        platform: m.platform,
        targetAudience: m.targetAudience,
        language: "English",
        cta: "Book Free Consultation",
        facebookCaption: `Dreaming of studying in ${m.country}? 🎓 The September intake at ${m.university} is closing soon! Don't miss your chance to join ${m.course}. ALO Education guides you every step of the way. Book your free consultation today! 📞 01805020101`,
        instagramCaption: `🚀 ${m.course} at ${m.university} is calling! Limited seats for ${m.intake}. Swipe up to book your FREE consultation with ALO Education! ✈️📚`,
        hashtags: JSON.stringify(["#StudyAbroad", "#ALOEducation", `#StudyIn${m.country}`, "#HigherEducation", "#StudentVisa"]),
        imagePrompt: `A happy Bangladeshi student holding an acceptance letter from ${m.university}, ${m.country} flag in background, modern campus aesthetic, warm lighting, professional education marketing style`,
        videoPrompt: `30-second video: Student opens acceptance letter → smiles → campus montage → ALO Education logo + CTA. Energetic background music.`,
        videoScript: `[0-5s] Student opening letter with anticipation\n[5-10s] Big smile — acceptance letter revealed\n[10-20s] Campus life montage (${m.country})\n[20-25s] ALO Education logo\n[25-30s] CTA: Book Free Consultation - 01805020101`,
        reelCaption: `From Bangladesh to ${m.country}! 🌍 Your dream starts here.`,
        ctaText: "Book Free Consultation",
        approvalStatus: pick(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SCHEDULED", "PUBLISHED"]),
        createdBy: partnerEmp.id,
      },
    });
  }

  // ─── Partner Social Accounts ───
  await db.partnerSocialAccount.create({
    data: {
      partnerId: partnerEmp.id,
      platform: "FACEBOOK",
      accountName: "ALO Partner - Dhaka",
      accountId: "fb_page_123456789",
      accessTokenMasked: "EAAB•••••••••••••••••••••••••••ZD",
      tokenExpiry: "2025-12-31",
      connectionStatus: "CONNECTED",
      lastSync: new Date(),
      connectedBy: partnerEmp.id,
      approvedByAlo: true,
      status: "ACTIVE",
    },
  });
  await db.partnerSocialAccount.create({
    data: {
      partnerId: partnerEmp.id,
      platform: "INSTAGRAM",
      accountName: "@alo.partner.dhaka",
      accountId: "ig_business_987654321",
      accessTokenMasked: "IGQV•••••••••••••••••••••••••••wM",
      tokenExpiry: "2025-06-15",
      connectionStatus: "CONNECTED",
      lastSync: new Date(Date.now() - 86400000),
      connectedBy: partnerEmp.id,
      approvedByAlo: true,
      status: "ACTIVE",
    },
  });

  // ─── Student Benefit Entitlements & Vouchers ───
  // For partner-referred students with active applications
  const partnerStudents = await db.student.findMany({ where: { partnerId: { not: null } }, include: { applications: true } });
  for (const student of partnerStudents) {
    const activeApp = student.applications.find((a) => !["VISA_REFUSED", "ENROLLED"].includes(a.stage));
    if (!activeApp) continue;

    // Benefit entitlements
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
        data: {
          studentId: student.id,
          partnerId: partnerEmp.id,
          applicationId: activeApp.id,
          benefitType: b.benefitType,
          limitCount: b.limitCount,
          usedCount: Math.floor(Math.random() * (b.limitCount + 1)),
          status: "ACTIVE",
          createdBy: partnerEmp.id,
        },
      });
    }

    // 3 English mock test vouchers per eligible student
    for (let i = 0; i < 3; i++) {
      const used = i < 1; // 1 used, 2 available
      await db.studentMockTestVoucher.create({
        data: {
          voucherCode: `ALO-MT-${rid(4)}-${rid(4)}`,
          studentId: student.id,
          partnerId: partnerEmp.id,
          applicationId: activeApp.id,
          testType: pick(["IELTS", "PTE", "TOEFL"]),
          usageLimit: 1,
          usedCount: used ? 1 : 0,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: used ? "USED" : "AVAILABLE",
          createdBy: partnerEmp.id,
        },
      });
    }
  }

  console.log("B2B Partner Portal seed complete!");
  console.log(`- Partner users: ${await db.partnerUser.count()}`);
  console.log(`- Seat requests: ${await db.partnerUserSeatRequest.count()}`);
  console.log(`- Marketing quotas: ${await db.partnerMarketingQuota.count()}`);
  console.log(`- Marketing usage: ${await db.partnerMarketingUsage.count()}`);
  console.log(`- Marketing requests: ${await db.partnerMarketingRequest.count()}`);
  console.log(`- Social accounts: ${await db.partnerSocialAccount.count()}`);
  console.log(`- Student benefit entitlements: ${await db.studentBenefitEntitlement.count()}`);
  console.log(`- Student mock test vouchers: ${await db.studentMockTestVoucher.count()}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
