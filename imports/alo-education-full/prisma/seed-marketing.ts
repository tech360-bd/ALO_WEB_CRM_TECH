// ALO Education — Marketing Automation seed
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Seeding marketing automation data...");

  await db.marketingUserAccess.deleteMany();
  await db.leadOutreach.deleteMany();
  await db.n8nWorkflow.deleteMany();
  await db.campaignPost.deleteMany();
  await db.keywordTrigger.deleteMany();
  await db.socialInboxMessage.deleteMany();
  await db.brandAsset.deleteMany();

  // ─── Brand Assets ───
  await db.brandAsset.create({
    data: {
      assetType: "LOGO",
      name: "ALO Education Logo",
      value: "/logo.svg",
      mimeType: "image/svg+xml",
      value: JSON.stringify({ colors: ["#0057B8", "#E8501A", "#FFFFFF"], dimensions: "200x48" }),
      status: true,
      uploadedBy: "system",
    },
  });
  await db.brandAsset.create({
    data: {
      assetType: "COLOR_PALETTE",
      name: "ALO Brand Colors",
      value: JSON.stringify({ primary: "#0057B8", cta: "#E8501A", background: "#FFFFFF", text: "#0F172A" }),
      status: true,
    },
  });

  // ─── Keyword Triggers ───
  const keywords = [
    { keyword: "study abroad", autoReplyText: "Welcome to ALO Education! 🌍 We help students study in UK, Canada, Australia, USA & more. Share your phone number and our counselor will contact you within 24 hours. Or book a free consultation: https://aloeducation.com", autoDmText: "Hi! Thanks for your interest in studying abroad. What country and course are you interested in?", autoCreateLead: true },
    { keyword: "ielts", autoReplyText: "Looking for IELTS preparation? ALO Education offers free IELTS mock tests with AI scoring! Start now: https://aloeducation.com/english-test/ielts", autoDmText: "Hi! We offer free IELTS mock tests. Would you like to try one?", autoCreateLead: true },
    { keyword: "visa", autoReplyText: "Visa questions? Our visa officers can help! Book a free consultation: https://aloeducation.com or WhatsApp 01805020101", autoDmText: "Hi! What visa-related question do you have? Our visa officer can help.", autoCreateLead: true },
    { keyword: "uk", autoReplyText: "Interested in studying in the UK? 🇬🇧 Explore UK universities, courses, and scholarships with ALO Education: https://aloeducation.com/destinations/uk", autoDmText: "Hi! What course are you looking to study in the UK?", autoCreateLead: true },
    { keyword: "canada", autoReplyText: "Canada is a great choice! 🇨🇦 Explore programs, PGWP pathway, and scholarships: https://aloeducation.com/destinations/canada", autoDmText: "Hi! Interested in Canada? What study level are you looking for?", autoCreateLead: true },
    { keyword: "australia", autoReplyText: "Study in Australia! 🇦🇺 Top universities, post-study work visa, and great lifestyle: https://aloeducation.com/destinations/australia", autoDmText: "Hi! What course would you like to study in Australia?", autoCreateLead: true },
    { keyword: "scholarship", autoReplyText: "Looking for scholarships? 💰 ALO Education helps you find university, merit, and country-specific scholarships: https://aloeducation.com/scholarships", autoDmText: "Hi! What country are you seeking scholarships for?", autoCreateLead: true },
    { keyword: "apply", autoReplyText: "Ready to apply? Start your application with ALO Education! Book a free consultation: https://aloeducation.com", autoDmText: "Hi! To start your application, please share your phone number and preferred country.", autoCreateLead: true },
    { keyword: "sop", autoReplyText: "Need help with your SOP? ALO's AI SOP Writer creates personalized drafts with originality checking: https://aloeducation.com", autoDmText: "Hi! We can help with your SOP. What university and course are you applying to?", autoCreateLead: true },
    { keyword: "pte", autoReplyText: "PTE preparation? ALO Education offers free PTE mock tests with AI scoring: https://aloeducation.com/english-test/pte", autoDmText: "Hi! We offer free PTE mock tests. Want to try one?", autoCreateLead: true },
  ];
  for (const k of keywords) {
    await db.keywordTrigger.create({ data: { ...k, keywordType: "CONTAINS", platform: "ALL", status: true, triggerCount: Math.floor(Math.random() * 50) } });
  }

  // ─── Social Inbox Messages ───
  const socialMessages = [
    { platform: "FACEBOOK", direction: "INBOUND", senderName: "Rahim Uddin", senderId: "fb_user_123", messageText: "I want to study in UK. Can you help?", keywordTriggered: "uk", isRead: false, conversationId: "fb_conv_1" },
    { platform: "FACEBOOK", direction: "OUTBOUND", senderName: "ALO Education", messageText: "Hi Rahim! Absolutely, we can help you study in the UK. What course are you interested in?", isRead: true, conversationId: "fb_conv_1", sentAt: new Date() },
    { platform: "INSTAGRAM", direction: "INBOUND", senderName: "@student_dreams", senderId: "ig_user_456", messageText: "Do you offer IELTS mock tests?", keywordTriggered: "ielts", isRead: false, conversationId: "ig_conv_1" },
    { platform: "INSTAGRAM", direction: "OUTBOUND", senderName: "ALO Education", messageText: "Yes! We offer free IELTS mock tests with AI scoring. Start here: https://aloeducation.com/english-test/ielts", isRead: true, conversationId: "ig_conv_1", sentAt: new Date() },
    { platform: "MESSENGER", direction: "INBOUND", senderName: "Karim Ahmed", senderId: "msg_user_789", messageText: "Scholarship available for Canada?", keywordTriggered: "canada", isRead: false, conversationId: "msg_conv_1" },
    { platform: "WHATSAPP", direction: "INBOUND", senderName: "+8801712345678", senderId: "+8801712345678", messageText: "Hi, I want to apply for Australia visa", keywordTriggered: "australia", isRead: false, conversationId: "wa_conv_1", aiHandled: true, aiDraftReply: "Hello! I'm ALO AI Assistant. I can help you with Australia study options. May I know your name and what course you're interested in?" },
    { platform: "WHATSAPP", direction: "OUTBOUND", senderName: "ALO AI", messageText: "Hello! I'm ALO AI Assistant. I can help you with Australia study options. May I know your name and what course you're interested in?", isRead: true, conversationId: "wa_conv_1", aiHandled: true, humanApproved: false, sentAt: new Date() },
    { platform: "FACEBOOK", direction: "INBOUND", senderName: "Sadia Islam", senderId: "fb_user_321", messageText: "What documents do I need for visa?", keywordTriggered: "visa", isRead: false, conversationId: "fb_conv_2" },
    { platform: "INSTAGRAM", direction: "INBOUND", senderName: "@future_scholar", senderId: "ig_user_654", messageText: "Looking for scholarship in Canada", keywordTriggered: "scholarship", isRead: false, conversationId: "ig_conv_2" },
  ];
  for (const m of socialMessages) {
    await db.socialInboxMessage.create({ data: m });
  }

  // ─── Campaign Posts ───
  const posts = [
    { title: "UK September Intake Deadline", category: "DEADLINE", platform: "FACEBOOK", caption: "September intake deadlines are approaching! Don't miss your chance to study in the UK. Book your free consultation today. 📞 01805020101", hashtags: JSON.stringify(["#StudyInUK", "#ALOEducation", "#SeptemberIntake"]), ctaText: "Book Free Consultation", ctaUrl: "https://aloeducation.com", campaignObjective: "LEAD_GEN", platformSize: "SQUARE", approvalStatus: "APPROVED", brandAssetApplied: true, createdBy: "marketing" },
    { title: "Student Success Story — Tanvir", category: "SUCCESS_STORY", platform: "INSTAGRAM", caption: "From Dhaka to Manchester! 🎓 Tanvir is now pursuing MSc Computer Science at University of Manchester. Your dream starts here. ✈️", hashtags: JSON.stringify(["#SuccessStory", "#StudyAbroad", "#ALOEducation"]), ctaText: "Start Your Journey", ctaUrl: "https://aloeducation.com", campaignObjective: "AWARENESS", platformSize: "PORTRAIT", approvalStatus: "PENDING_APPROVAL", brandAssetApplied: true, createdBy: "marketing" },
    { title: "Free IELTS Mock Test Campaign", category: "IELTS_PTE", platform: "FACEBOOK", caption: "Get a free IELTS mock test with AI scoring! Practice like the real exam. ALO Education students get 3 free mocks. Start now! 📚", hashtags: JSON.stringify(["#IELTS", "#FreeMockTest", "#ALOEducation"]), ctaText: "Start Free Mock", ctaUrl: "https://aloeducation.com/english-test/ielts", campaignObjective: "LEAD_GEN", platformSize: "SQUARE", approvalStatus: "DRAFT", brandAssetApplied: false, createdBy: "marketing" },
    { title: "Canada PGWP Pathway", category: "VISA_TIPS", platform: "LINKEDIN", caption: "Canada's Post-Graduation Work Permit (PGWP) allows you to work for up to 3 years after graduation. ALO Education guides you through the entire process.", hashtags: JSON.stringify(["#Canada", "#PGWP", "#StudyAbroad"]), ctaText: "Book Consultation", ctaUrl: "https://aloeducation.com/destinations/canada", campaignObjective: "TRAFFIC", platformSize: "LANDSCAPE", approvalStatus: "APPROVED", brandAssetApplied: true, publishedAt: new Date(), publishedUrl: "https://linkedin.com/post/123", createdBy: "marketing" },
    { title: "Scholarship Finder Tool", category: "SCHOLARSHIP", platform: "INSTAGRAM", caption: "Find scholarships you're eligible for! 💰 Our Scholarship Finder matches your profile with verified scholarships across 13 countries.", hashtags: JSON.stringify(["#Scholarship", "#StudyAbroad", "#ALOEducation"]), ctaText: "Find Scholarships", ctaUrl: "https://aloeducation.com/scholarships", campaignObjective: "LEAD_GEN", platformSize: "STORY", approvalStatus: "REJECTED", rejectionReason: "Needs stronger CTA and better hashtag strategy", brandAssetApplied: true, createdBy: "marketing" },
  ];
  for (const p of posts) {
    await db.campaignPost.create({ data: p });
  }

  // ─── n8n Workflows ───
  const workflows = [
    { name: "Auto Lead Assignment", description: "When a new lead is created, auto-assign counselor and send WhatsApp notification", webhookUrl: "https://n8n.aloeducation.com/webhook/lead-assign", triggerType: "LEAD_CREATED", status: true, triggerCount: 45 },
    { name: "Follow-up Reminder", description: "Send follow-up WhatsApp 24h after lead creation if no response", webhookUrl: "https://n8n.aloeducation.com/webhook/follow-up", triggerType: "FOLLOW_UP", status: true, triggerCount: 28 },
    { name: "WhatsApp AI Reply", description: "Trigger AI reply for after-hours WhatsApp messages", webhookUrl: "https://n8n.aloeducation.com/webhook/wa-ai-reply", triggerType: "WHATSAPP_REPLY", status: true, triggerCount: 156 },
    { name: "Weekly Campaign Report", description: "Generate and email weekly marketing report every Monday", webhookUrl: "https://n8n.aloeducation.com/webhook/weekly-report", triggerType: "CAMPAIGN_REPORT", status: true, triggerCount: 4 },
    { name: "Counselor Notification", description: "Notify assigned counselor when a student sends a message", webhookUrl: "https://n8n.aloeducation.com/webhook/counselor-notify", triggerType: "COUNSELOR_NOTIFY", status: false, triggerCount: 0 },
  ];
  for (const w of workflows) {
    await db.n8nWorkflow.create({ data: w });
  }

  // ─── Marketing User Access ───
  const marketingManager = await db.user.findFirst({ where: { role: "MARKETING_MANAGER" } });
  if (marketingManager) {
    await db.marketingUserAccess.create({
      data: { userId: marketingManager.id, accessLevel: "FULL", status: true, permissions: JSON.stringify(["*"]), approvedBy: "system" },
    });
  }
  // 3 approved marketing users
  const marketingUsers = await db.user.findMany({ where: { role: "MARKETING" } }).catch(() => []);
  // If no MARKETING role users, create access for some COUNSELOR users as marketing assistants
  const counselors = await db.user.findMany({ where: { role: "COUNSELOR" }, take: 3 });
  for (let i = 0; i < Math.min(3, counselors.length); i++) {
    await db.marketingUserAccess.create({
      data: {
        userId: counselors[i].id,
        accessLevel: "LIMITED",
        status: true,
        permissions: JSON.stringify(["social.reply", "post.draft", "comment.automate", "ai.draft"]),
        approvedBy: marketingManager?.id || "system",
      },
    });
  }

  // ─── Lead Outreach ───
  const leads = await db.lead.findMany({ take: 5 });
  for (let i = 0; i < leads.length; i++) {
    await db.leadOutreach.create({
      data: {
        leadId: leads[i].id,
        sourceName: leads[i].sourceDetail || leads[i].source,
        sourceType: "ORGANIC",
        channel: "WHATSAPP",
        consentStatus: i % 3 === 0 ? "OPTED_IN" : "UNKNOWN",
        outreachHistory: JSON.stringify([{ date: new Date().toISOString(), channel: "WHATSAPP", message: "Welcome message sent", result: "PENDING" }]),
        status: true,
      },
    });
  }

  console.log("Marketing automation seed complete!");
  console.log(`- Brand assets: ${await db.brandAsset.count()}`);
  console.log(`- Keyword triggers: ${await db.keywordTrigger.count()}`);
  console.log(`- Social inbox messages: ${await db.socialInboxMessage.count()}`);
  console.log(`- Campaign posts: ${await db.campaignPost.count()}`);
  console.log(`- n8n workflows: ${await db.n8nWorkflow.count()}`);
  console.log(`- Marketing user access: ${await db.marketingUserAccess.count()}`);
  console.log(`- Lead outreach: ${await db.leadOutreach.count()}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
