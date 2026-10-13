import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/**
 * ALO Marketing Auto-Publisher
 * ──────────────────────────────
 * Finds CampaignPost records where:
 *   - approvalStatus = 'SCHEDULED'
 *   - scheduledAt <= now()
 *
 * Sets approvalStatus to 'PUBLISHED' and publishedAt to now().
 * Creates in-app notifications for the creator that the post went live.
 *
 * Run as:  bun index.ts
 * Cron:    */5 * * * *   (every 5 minutes)
 */

const RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function processScheduledPosts() {
  const now = new Date();

  // CampaignPost.scheduledAt is a String, so we need to compare as strings
  // Format expected: ISO 8601 or similar parseable date string
  const duePosts = await db.campaignPost.findMany({
    where: {
      approvalStatus: "SCHEDULED",
      scheduledAt: { not: null },
    },
    take: 100,
  });

  if (duePosts.length === 0) {
    console.log(`[${now.toISOString()}] No scheduled posts due.`);
    return;
  }

  let publishedCount = 0;

  for (const post of duePosts) {
    if (!post.scheduledAt) continue;

    const scheduledDate = new Date(post.scheduledAt);
    if (isNaN(scheduledDate.getTime())) continue;

    // Only publish if scheduled time has passed
    if (scheduledDate > now) continue;

    // Check if already published (race condition guard)
    if (post.approvalStatus === "PUBLISHED") continue;

    // Update the post
    await db.campaignPost.update({
      where: { id: post.id },
      data: {
        approvalStatus: "PUBLISHED",
        publishedAt: now,
      },
    });

    // Notify the creator
    if (post.createdBy) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Dedup: don't notify if we already did today
      const existing = await db.notification.findFirst({
        where: {
          userId: post.createdBy,
          type: "POST_PUBLISHED",
          data: { contains: post.id },
          createdAt: { gte: todayStart },
        },
      });

      if (!existing) {
        await db.notification.create({
          data: {
            userId: post.createdBy,
            type: "POST_PUBLISHED",
            title: `Post Published: ${post.title}`,
            message: `Your scheduled post "${post.title}" (${post.platform}) has been automatically published.`,
            data: JSON.stringify({
              postId: post.id,
              title: post.title,
              platform: post.platform,
              category: post.category,
            }),
            channel: "IN_APP",
          },
        });
      }
    }

    publishedCount++;
    console.log(
      `  ✓ Published: "${post.title}" (${post.platform}) — scheduled for ${post.scheduledAt}`
    );
  }

  console.log(
    `[${now.toISOString()}] Checked ${duePosts.length} scheduled posts. Published ${publishedCount}.`
  );
}

async function main() {
  console.log(
    "📢 ALO Marketing Auto-Publisher started — checking every 5 minutes"
  );

  try {
    await processScheduledPosts();
  } catch (e) {
    console.error("Marketing publisher error:", e);
  }

  while (true) {
    await new Promise((r) => setTimeout(r, RUN_INTERVAL_MS));
    try {
      await processScheduledPosts();
    } catch (e) {
      console.error("Marketing publisher error:", e);
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
