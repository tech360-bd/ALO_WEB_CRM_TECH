// ALO Education — Omnichannel Communication Center seed
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Seeding Omnichannel Communication Center data...");

  await db.consentRecord.deleteMany();
  await db.notificationEngine.deleteMany();
  await db.aiDocumentClassification.deleteMany();
  await db.documentReview.deleteMany();
  await db.documentVersion.deleteMany();
  await db.smsLog.deleteMany();
  await db.emailSync.deleteMany();
  await db.phoneCallLog.deleteMany();
  await db.connectedAccount.deleteMany();

  // ─── Connected Accounts ───
  const accounts = [
    { platform: "WHATSAPP", accountName: "ALO Education Official", accountId: "wa_business_001", connectionStatus: "CONNECTED", assignedTo: "COMPANY", lastSync: new Date(), lastActivity: new Date(), metadata: JSON.stringify({ phoneNumber: "+8801805020101" }) },
    { platform: "FACEBOOK", accountName: "ALO Education", accountId: "fb_page_123456789", connectionStatus: "CONNECTED", assignedTo: "COMPANY", lastSync: new Date(), lastActivity: new Date(Date.now() - 3600000) },
    { platform: "INSTAGRAM", accountName: "@alo.education", accountId: "ig_business_987654321", connectionStatus: "CONNECTED", assignedTo: "COMPANY", lastSync: new Date(), lastActivity: new Date(Date.now() - 86400000) },
    { platform: "GMAIL", accountName: "info@aloeducation.com", accountId: "gmail_workspace_001", connectionStatus: "EXPIRED", assignedTo: "COMPANY", tokenExpiry: new Date(Date.now() - 86400000), lastSync: new Date(Date.now() - 86400000) },
    { platform: "SMS_GATEWAY", accountName: "ALO SMS Gateway", accountId: "sms_gateway_001", connectionStatus: "CONNECTED", assignedTo: "COMPANY", lastSync: new Date() },
    { platform: "CALL_CENTER", accountName: "ALO Call Center", accountId: "cc_001", connectionStatus: "CONNECTED", assignedTo: "COMPANY", lastSync: new Date() },
    { platform: "TELEGRAM", accountName: "ALO Education Bot", accountId: "tg_bot_001", connectionStatus: "DISCONNECTED", assignedTo: "COMPANY" },
    { platform: "LINKEDIN", accountName: "ALO Education", accountId: "li_company_001", connectionStatus: "PERMISSION_ERROR", assignedTo: "COMPANY" },
  ];
  for (const a of accounts) {
    await db.connectedAccount.create({ data: a });
  }

  // ─── Phone Call Logs ───
  const calls = [
    { callType: "INCOMING", fromNumber: "+8801712345678", toNumber: "+8801805020101", duration: 180, disposition: "ANSWERED", callNotes: "Student called about UK September intake. Interested in MSc Computer Science." },
    { callType: "OUTGOING", fromNumber: "+8801805020101", toNumber: "+8801912345678", duration: 240, disposition: "ANSWERED", callNotes: "Called student to remind about document upload deadline." },
    { callType: "MISSED", fromNumber: "+8801823456789", toNumber: "+8801805020101", duration: 0, disposition: "MISSED", callNotes: null },
    { callType: "INCOMING", fromNumber: "+8801834567890", toNumber: "+8801805020101", duration: 90, disposition: "VOICEMAIL", callNotes: "Voicemail: Asked about scholarship options for Canada." },
  ];
  for (const c of calls) {
    await db.phoneCallLog.create({ data: c });
  }

  // ─── Email Sync ───
  const emails = [
    { fromEmail: "student@gmail.com", toEmail: "info@aloeducation.com", subject: "Inquiry about UK Universities", bodyText: "Hello, I want to study in UK. Can you help me?", folder: "INBOX", isRead: false, matchedToCRM: true },
    { fromEmail: "info@aloeducation.com", toEmail: "university@manchester.ac.uk", subject: "Application Status Check - Tanvir Ahmed", bodyText: "Dear Admissions, Please check the status of Tanvir Ahmed's application.", folder: "SENT", isRead: true, matchedToCRM: true },
    { fromEmail: "admissions@manchester.ac.uk", toEmail: "info@aloeducation.com", subject: "Conditional Offer - Tanvir Ahmed", bodyText: "We are pleased to offer a conditional place to Tanvir Ahmed for MSc Computer Science.", folder: "INBOX", isRead: false, matchedToCRM: true },
    { fromEmail: "partner@globaledu.com", toEmail: "info@aloeducation.com", subject: "New student referral - Canada intake", bodyText: "We have a student interested in Fanshawe College PG Diploma.", folder: "INBOX", isRead: true, matchedToCRM: true },
  ];
  for (const e of emails) {
    await db.emailSync.create({ data: e });
  }

  // ─── SMS Logs ───
  const sms = [
    { direction: "OUTBOUND", fromNumber: "ALOEDU", toNumber: "+8801712345678", messageText: "Your appointment with ALO Education is confirmed for tomorrow at 10 AM. Reply STOP to opt out.", deliveryStatus: "DELIVERED", readStatus: true },
    { direction: "INBOUND", fromNumber: "+8801712345678", toNumber: "ALOEDU", messageText: "Thank you, I'll be there", deliveryStatus: "DELIVERED", readStatus: true },
    { direction: "OUTBOUND", fromNumber: "ALOEDU", toNumber: "+8801912345678", messageText: "Your documents are under review. We'll update you within 24 hours.", deliveryStatus: "SENT", readStatus: false },
    { direction: "INBOUND", fromNumber: "+8801823456789", toNumber: "ALOEDU", messageText: "STOP", deliveryStatus: "DELIVERED", readStatus: true },
  ];
  for (const s of sms) {
    await db.smsLog.create({ data: s });
  }

  // ─── Document Versions (for existing documents) ───
  const documents = await db.document.findMany({ take: 5 });
  for (const doc of documents) {
    await db.documentVersion.create({
      data: {
        documentId: doc.id,
        version: 1,
        filePath: doc.storagePath || `/private/docs/${doc.studentId}/${doc.category}.pdf`,
        fileSize: doc.fileSize || 240000,
        fileType: doc.fileType || "application/pdf",
        uploadedBy: doc.studentId,
        reviewStatus: doc.status === "APPROVED" ? "APPROVED" : doc.status === "REJECTED" ? "REJECTED" : "PENDING",
        reviewerId: doc.reviewedById,
        reviewerNote: doc.rejectionReason,
        reviewedAt: doc.reviewedAt,
        isLatest: true,
      },
    });
    // AI Classification
    await db.aiDocumentClassification.create({
      data: {
        documentId: doc.id,
        detectedType: doc.category,
        confidence: 0.85 + Math.random() * 0.14,
        extractedData: JSON.stringify({ detectedAt: new Date().toISOString(), method: "AI_OCR" }),
        ocrText: `Extracted text from ${doc.name}...`,
        autoFilled: false,
        humanVerified: doc.status === "APPROVED",
      },
    });
  }

  // ─── Notifications ───
  const notifications = [
    { recipientType: "EMPLOYEE", channel: "IN_APP", title: "New WhatsApp message", message: "A student sent a message about UK universities. Response needed within 40 minutes.", category: "COMMUNICATION", priority: "HIGH" },
    { recipientType: "STUDENT", channel: "IN_APP", title: "Document approved", message: "Your passport has been approved by the application team.", category: "DOCUMENT", priority: "NORMAL" },
    { recipientType: "EMPLOYEE", channel: "IN_APP", title: "Application deadline approaching", message: "University of Manchester application deadline is in 3 days.", category: "DEADLINE", priority: "URGENT" },
    { recipientType: "EMPLOYEE", channel: "IN_APP", title: "AI document classified", message: "AI detected a passport document from WhatsApp upload. Please verify.", category: "DOCUMENT", priority: "NORMAL" },
    { recipientType: "SUPER_ADMIN", channel: "IN_APP", title: "B2B follow-up due", message: "B2B provider response pending for 5 days. Follow-up required.", category: "APPLICATION", priority: "HIGH" },
  ];
  for (const n of notifications) {
    await db.notificationEngine.create({ data: { ...n, isRead: false, sentAt: new Date() } });
  }

  // ─── Consent Records ───
  const students = await db.student.findMany({ take: 5 });
  for (let i = 0; i < students.length; i++) {
    await db.consentRecord.create({
      data: {
        studentId: students[i].id,
        channel: "WHATSAPP",
        consentStatus: i % 4 === 0 ? "OPTED_OUT" : "OPTED_IN",
        preferredLanguage: "English",
        preferredChannel: "WHATSAPP",
        consentDate: new Date(Date.now() - 7 * 86400000),
        optOutDate: i % 4 === 0 ? new Date() : null,
        consentSource: "WHATSAPP",
      },
    });
  }

  console.log("Omnichannel Communication Center seed complete!");
  console.log(`- Connected accounts: ${await db.connectedAccount.count()}`);
  console.log(`- Phone call logs: ${await db.phoneCallLog.count()}`);
  console.log(`- Email sync: ${await db.emailSync.count()}`);
  console.log(`- SMS logs: ${await db.smsLog.count()}`);
  console.log(`- Document versions: ${await db.documentVersion.count()}`);
  console.log(`- Document reviews: ${await db.documentReview.count()}`);
  console.log(`- AI document classifications: ${await db.aiDocumentClassification.count()}`);
  console.log(`- Notifications: ${await db.notificationEngine.count()}`);
  console.log(`- Consent records: ${await db.consentRecord.count()}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
