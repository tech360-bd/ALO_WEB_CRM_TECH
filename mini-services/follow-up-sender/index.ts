import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const SEQUENCE = [3, 7, 14, 21, 25, 30];
function nextDayInSequence(currentDay: number): number | null {
  const idx = SEQUENCE.indexOf(currentDay);
  if (idx === -1 || idx >= SEQUENCE.length - 1) return null;
  return SEQUENCE[idx + 1];
}

async function processFollowUps() {
  const due = await db.followUpSchedule.findMany({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
    take: 100,
  });
  if (due.length === 0) return;

  for (const sched of due) {
    const contact = await db.whatsAppContact.findUnique({ where: { id: sched.contactId } });
    if (!contact || contact.consentStatus === "OPTED_OUT") {
      await db.followUpSchedule.update({ where: { id: sched.id }, data: { status: "SKIPPED", skipReason: contact ? "Opted out" : "Contact not found" } });
      continue;
    }
    let template = sched.templateId ? await db.whatsAppTemplate.findUnique({ where: { id: sched.templateId } }) : null;
    if (!template) {
      template = await db.whatsAppTemplate.findFirst({ where: { purpose: "FOLLOW_UP", day: sched.dayNumber, language: "en", active: true, approvalStatus: "APPROVED" } });
    }
    if (!template) {
      await db.followUpSchedule.update({ where: { id: sched.id }, data: { status: "SKIPPED", skipReason: "No matching template" } });
      continue;
    }
    const student = sched.studentId ? await db.student.findUnique({ where: { id: sched.studentId }, select: { fullName: true, studentId: true, counselorId: true, studyDestination: true, intake: true } }) : null;
    const counselor = student?.counselorId ? await db.user.findUnique({ where: { id: student.counselorId }, select: { name: true } }) : null;
    const name = student?.fullName || contact.displayName || "Student";
    const studentCode = student?.studentId || "ALO-S-XXXX";
    const counselorName = counselor?.name || "ALO Education";
    const country = student?.studyDestination || "your chosen destination";
    const intake = student?.intake || "upcoming";
    const portalLink = "https://aloeducation.com/login";
    const branchName = "ALO Education";

    let body = template.body || template.content || "";
    body = body.replace(/\{\{name\}\}/g, name).replace(/\{\{student_code\}\}/g, studentCode).replace(/\{\{portal_link\}\}/g, portalLink).replace(/\{\{counselor_name\}\}/g, counselorName).replace(/\{\{branch_name\}\}/g, branchName).replace(/\{\{country\}\}/g, country).replace(/\{\{intake\}\}/g, intake);

    let conversation = sched.conversationId ? await db.whatsAppConversation.findUnique({ where: { id: sched.conversationId } }) : null;
    if (!conversation) {
      conversation = await db.whatsAppConversation.findFirst({ where: { contactId: contact.id } }) || null;
      if (!conversation) {
        conversation = await db.whatsAppConversation.create({ data: { contactId: contact.id, conversationStatus: "OPEN" } });
      }
    }
    const senderNumber = sched.senderNumberId ? await db.whatsAppNumber.findUnique({ where: { id: sched.senderNumberId } }) : await db.whatsAppNumber.findFirst({ where: { OR: [{ isFollowUp: true }, { isDefault: true }] } });
    if (!senderNumber) {
      await db.followUpSchedule.update({ where: { id: sched.id }, data: { status: "SKIPPED", skipReason: "No sender number", retryCount: { increment: 1 } } });
      continue;
    }
    await db.whatsAppMessage.create({ data: { conversationId: conversation.id, senderNumberId: senderNumber.id, contactId: contact.id, messageType: "TEXT", body, direction: "OUTBOUND", deliveryStatus: "SENT", sentAt: new Date() } });
    await db.communicationMessage.create({ data: { channel: "WHATSAPP", direction: "OUTBOUND", fromPhone: senderNumber.phoneNumber, toPhone: contact.phoneNumber, body, studentId: sched.studentId || undefined, counselorId: student?.counselorId || undefined, humanApproved: true, receivedAt: new Date(), sentAt: new Date() } });
    await db.whatsAppConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date(), lastMessageText: body, receivingNumberId: senderNumber.id } });
    await db.followUpSchedule.update({ where: { id: sched.id }, data: { status: "SENT", sentAt: new Date(), templateId: template.id, senderNumberId: senderNumber.id } });

    const nextDay = nextDayInSequence(sched.dayNumber);
    if (nextDay && sched.studentId) {
      const nextTemplate = await db.whatsAppTemplate.findFirst({ where: { purpose: "FOLLOW_UP", day: nextDay, language: "en", active: true, approvalStatus: "APPROVED" } });
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (nextDay - sched.dayNumber));
      await db.followUpSchedule.create({ data: { studentId: sched.studentId, leadId: sched.leadId, conversationId: conversation.id, contactId: contact.id, dayNumber: nextDay, status: "PENDING", scheduledAt: nextDate, templateId: nextTemplate?.id, senderNumberId: senderNumber.id } });
    }
    console.log(`[${new Date().toISOString()}] Sent follow-up Day ${sched.dayNumber} to ${contact.phoneNumber}`);
  }
}

async function main() {
  console.log("📤 ALO Follow-up Sender started — polling every 5min");
  while (true) {
    try { await processFollowUps(); } catch (e) { console.error("Follow-up error:", e); }
    await new Promise(r => setTimeout(r, 300000));
  }
}
process.on("SIGINT", () => { db.$disconnect(); process.exit(0); });
process.on("SIGTERM", () => { db.$disconnect(); process.exit(0); });
main().catch(e => { console.error(e); process.exit(1); });
