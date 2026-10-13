import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/**
 * ALO Invoice Overdue Notifier
 * ─────────────────────────────
 * Finds all Invoices where:
 *   - dueDate < now()
 *   - status != 'PAID'  (i.e. DRAFT, SENT, PARTIAL, OVERDUE)
 * Creates an in-app Notification for the student's counselor (or FINANCE team).
 * Updates invoice status to OVERDUE if not already.
 *
 * Run as:  bun index.ts
 * Cron:    */15 * * * *   (every 15 minutes)
 */

const RUN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function findFinanceUsers(): Promise<string[]> {
  const users = await db.user.findMany({
    where: { role: "FINANCE", status: "ACTIVE" },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

async function processOverdueInvoices() {
  const now = new Date();

  const overdueInvoices = await db.invoice.findMany({
    where: {
      dueDate: { lte: now },
      status: { notIn: ["PAID", "CANCELLED"] },
    },
    include: {
      student: {
        select: { id: true, studentId: true, fullName: true, email: true, counselorId: true },
      },
    },
    take: 200,
  });

  if (overdueInvoices.length === 0) {
    console.log(`[${now.toISOString()}] No overdue invoices found.`);
    return;
  }

  const financeUserIds = await findFinanceUsers();
  let updatedCount = 0;
  let notifiedCount = 0;

  for (const invoice of overdueInvoices) {
    // Mark as OVERDUE if it was in a pre-overdue status
    const previousStatus = invoice.status;
    if (invoice.status !== "OVERDUE") {
      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: "OVERDUE" },
      });
      updatedCount++;
    }

    // Create a notification for the student's counselor
    const notifyUserId = invoice.student.counselorId;

    // Check if we already sent a notification for this invoice today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingNotification = await db.notification.findFirst({
      where: {
        userId: notifyUserId || "SYSTEM",
        type: "INVOICE_OVERDUE",
        data: { contains: invoice.id },
        createdAt: { gte: todayStart },
      },
    });

    if (existingNotification) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - (invoice.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)
    );

    const notificationData = JSON.stringify({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      studentId: invoice.student.id,
      studentName: invoice.student.fullName,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      daysOverdue,
      previousStatus,
    });

    // Notify counselor (if assigned)
    if (notifyUserId) {
      await db.notification.create({
        data: {
          userId: notifyUserId,
          type: "INVOICE_OVERDUE",
          title: `Overdue Invoice: ${invoice.invoiceNo}`,
          message: `Invoice ${invoice.invoiceNo} for ${invoice.student.fullName} is ${daysOverdue} day(s) overdue. Amount: ${invoice.currency} ${invoice.totalAmount}.`,
          data: notificationData,
          channel: "IN_APP",
        },
      });
      notifiedCount++;
    }

    // Also notify finance team
    for (const financeId of financeUserIds) {
      if (financeId === notifyUserId) continue; // Avoid duplicate
      await db.notification.create({
        data: {
          userId: financeId,
          type: "INVOICE_OVERDUE",
          title: `Overdue Invoice: ${invoice.invoiceNo}`,
          message: `Invoice ${invoice.invoiceNo} for ${invoice.student.fullName} (${invoice.student.studentId}) is ${daysOverdue} day(s) overdue. Amount: ${invoice.currency} ${invoice.totalAmount}.`,
          data: notificationData,
          channel: "IN_APP",
        },
      });
      notifiedCount++;
    }
  }

  console.log(
    `[${now.toISOString()}] Processed ${overdueInvoices.length} overdue invoices. Updated ${updatedCount} to OVERDUE. Created ${notifiedCount} notifications.`
  );
}

async function main() {
  console.log(
    "💰 ALO Invoice Overdue Notifier started — checking every 15 minutes"
  );

  // Run once immediately on start
  try {
    await processOverdueInvoices();
  } catch (e) {
    console.error("Invoice notifier error:", e);
  }

  // Then poll
  while (true) {
    await new Promise((r) => setTimeout(r, RUN_INTERVAL_MS));
    try {
      await processOverdueInvoices();
    } catch (e) {
      console.error("Invoice notifier error:", e);
    }
  }
}

process.on("SIGINT", () => {
  db.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", () => {
  db.$disconnect();
  process.exit(0);
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
