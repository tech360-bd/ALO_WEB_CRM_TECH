import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/**
 * ALO Application Deadline Reminder
 * ──────────────────────────────────
 * Checks applications with upcoming deadlines:
 *   - 7 days before deadline
 *   - 3 days before deadline
 *   - 1 day before deadline
 *   - Past deadline (overdue)
 *
 * Creates in-app Notifications for the assigned counselor and app-team officer.
 * Deduplicates: only one notification per (application + reminder_type) per day.
 *
 * Run as:  bun index.ts
 * Cron:    0 9 * * *   (daily at 9 AM)
 */

const RUN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface DeadlineWindow {
  label: string;
  daysBefore: number; // negative = past deadline
  type: string;
}

const WINDOWS: DeadlineWindow[] = [
  { label: "7 days remaining", daysBefore: 7, type: "DEADLINE_7_DAYS" },
  { label: "3 days remaining", daysBefore: 3, type: "DEADLINE_3_DAYS" },
  { label: "1 day remaining", daysBefore: 1, type: "DEADLINE_1_DAY" },
  { label: "Deadline passed", daysBefore: -1, type: "DEADLINE_PASSED" },
];

function getApplicableWindows(deadlineStr: string | null | undefined): DeadlineWindow[] {
  if (!deadlineStr) return [];
  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime())) return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDay = new Date(deadlineDate);
  deadlineDay.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((deadlineDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return WINDOWS.filter((w) => {
    if (w.daysBefore < 0) {
      // Overdue: deadline passed, only trigger once (within 3 days after)
      return diffDays < 0 && diffDays >= -3;
    }
    // Exact match: today is exactly N days before deadline
    return diffDays === w.daysBefore;
  });
}

async function processDeadlineReminders() {
  const now = new Date();

  // Fetch all applications that have a deadline and are still in progress
  const activeStages = [
    "COUNSELING",
    "ELIGIBILITY_CHECKED",
    "DOCUMENTS_PENDING",
    "DOCUMENTS_RECEIVED",
    "UNIVERSITY_SHORTLISTED",
    "APPLICATION_PREPARING",
    "APPLICATION_SUBMITTED",
  ];

  const applications = await db.application.findMany({
    where: {
      deadline: { not: null },
      stage: { in: activeStages },
    },
    include: {
      student: {
        select: { id: true, studentId: true, fullName: true, counselorId: true },
      },
    },
    take: 500,
  });

  let createdCount = 0;

  for (const app of applications) {
    const windows = getApplicableWindows(app.deadline);
    if (windows.length === 0) continue;

    for (const window of windows) {
      // Check for duplicate notification today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const notifyTargets: string[] = [];
      if (app.student.counselorId) notifyTargets.push(app.student.counselorId);
      if (app.appTeamOfficerId) notifyTargets.push(app.appTeamOfficerId);

      if (notifyTargets.length === 0) continue;

      // Only check for dedup with the first target (counselor)
      const existing = await db.notification.findFirst({
        where: {
          userId: notifyTargets[0],
          type: window.type,
          data: { contains: app.id },
          createdAt: { gte: todayStart },
        },
      });

      if (existing) continue;

      const notificationData = JSON.stringify({
        applicationId: app.id,
        applicationNo: app.applicationId,
        studentId: app.student.id,
        studentName: app.student.fullName,
        university: app.university,
        course: app.course,
        country: app.country,
        deadline: app.deadline,
        window: window.label,
      });

      const urgencyPrefix =
        window.daysBefore <= 1 ? "⚠️ URGENT:" : "📅 Reminder:";

      for (const userId of notifyTargets) {
        await db.notification.create({
          data: {
            userId,
            type: window.type,
            title: `${urgencyPrefix} ${app.university} — ${window.label}`,
            message: `Application ${app.applicationId} for ${app.student.fullName} to ${app.university} (${app.course}) has ${window.label.toLowerCase()}. Deadline: ${app.deadline}.`,
            data: notificationData,
            channel: "IN_APP",
          },
        });
        createdCount++;
      }
    }
  }

  console.log(
    `[${now.toISOString()}] Checked ${applications.length} applications. Created ${createdCount} deadline notifications.`
  );
}

async function main() {
  console.log(
    "📅 ALO Deadline Reminder started — checking hourly"
  );

  try {
    await processDeadlineReminders();
  } catch (e) {
    console.error("Deadline reminder error:", e);
  }

  while (true) {
    await new Promise((r) => setTimeout(r, RUN_INTERVAL_MS));
    try {
      await processDeadlineReminders();
    } catch (e) {
      console.error("Deadline reminder error:", e);
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
