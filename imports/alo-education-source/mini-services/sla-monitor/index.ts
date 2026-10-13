import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const OFFICE_START = 9; // 9 AM
const OFFICE_END = 18; // 6 PM
const SATURDAY = 6; // Saturday = 6 (0=Sunday in JS)
const FRIDAY = 5;

function isOfficeHours(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  if (day === FRIDAY) return false; // Friday closed
  if (day === 0) return false; // Sunday closed
  return hour >= OFFICE_START && hour < OFFICE_END;
}

async function checkSLAs() {
  const events = await db.slaEvent.findMany({
    where: { status: { in: ["PENDING", "UNREAD", "ESCALATED_40", "ESCALATED_50"] } },
    take: 200,
  });
  if (events.length === 0) return;
  const now = new Date();
  const inOffice = isOfficeHours(now);
  for (const ev of events) {
    const created = new Date(ev.createdAt);
    const elapsedMin = Math.floor((now.getTime() - created.getTime()) / 60000);
    let level = 0;
    let escalatedTo = "";
    let newStatus = ev.status;
    if (elapsedMin > 30 && elapsedMin <= 50) { level = 1; escalatedTo = "counselor"; newStatus = "ESCALATED_40"; }
    else if (elapsedMin > 50 && elapsedMin <= 60) { level = 2; escalatedTo = "branch manager"; newStatus = "ESCALATED_50"; }
    else if (elapsedMin > 60) { level = 3; escalatedTo = "CEO/Super Admin"; newStatus = "MISSED"; }

    if (level > 0) {
      const existing = await db.slaEscalation.findFirst({ where: { slaEventId: ev.id, escalationLevel: level } });
      if (!existing) {
        await db.slaEscalation.create({ data: { slaEventId: ev.id, escalationLevel: level, escalatedTo, status: "PENDING", notes: `Auto-escalated (elapsed ${elapsedMin}m, threshold>${level === 1 ? 30 : level === 2 ? 50 : 60}m)` } });
        if (newStatus !== ev.status) {
          await db.slaEvent.update({ where: { id: ev.id }, data: { status: newStatus, escalatedTo } });
        }
        const conv = ev.conversationId ? await db.whatsAppConversation.findUnique({ where: { id: ev.conversationId } }) : null;
        const student = ev.studentId ? await db.student.findUnique({ where: { id: ev.studentId }, select: { fullName: true, mobile: true } }) : null;
        const phoneMasked = student?.mobile ? student.mobile.replace(/(\d{4})\d+(\d{2})/, "$1XXXX$2") : "unknown";
        await db.dashboardAlarm.create({ data: { conversationId: ev.conversationId || "", slaEventId: ev.id, studentId: ev.studentId || "", escalationLevel: level, message: level >= 3 ? `GLOBAL ALARM: CEO SLA overdue - Urgent WhatsApp student message pending. Reply now.` : `${escalatedTo} SLA overdue - ${elapsedMin}m elapsed`, studentName: student?.fullName || "Unknown", phoneMasked, branch: conv?.branch || "Unknown", assignedEmployee: conv?.counselorId || "Unassigned", soundEnabled: true, status: "ACTIVE" } });
        console.log(`[${new Date().toISOString()}] Escalated SLA ${ev.id} to Level ${level} (${escalatedTo}) - ${elapsedMin}m elapsed`);
      }
    }
  }
}

async function main() {
  console.log("🚨 ALO SLA Monitor started — polling every 60s");
  while (true) {
    try { await checkSLAs(); } catch (e) { console.error("SLA check error:", e); }
    await new Promise(r => setTimeout(r, 60000));
  }
}
process.on("SIGINT", () => { db.$disconnect(); process.exit(0); });
process.on("SIGTERM", () => { db.$disconnect(); process.exit(0); });
main().catch(e => { console.error(e); process.exit(1); });
