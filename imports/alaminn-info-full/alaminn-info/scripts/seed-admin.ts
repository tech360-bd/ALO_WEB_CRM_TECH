/**
 * Seed the initial OWNER admin account.
 *
 * Usage:
 *   AUTH_SECRET="..." ADMIN_EMAIL="owner@alaminn.info" ADMIN_PASSWORD="..." bun run scripts/seed-admin.ts
 *
 * This script is idempotent — if the email already exists, it updates the
 * password hash and role. It NEVER prints the password. It writes the
 * audit log entry directly.
 *
 * SECURITY: Run this once during initial deployment, then rotate the
 * password from inside the Command Center. Never commit the password
 * to version control or store it in plain text.
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "owner@alaminn.info").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Al Aminn";
  const role = "OWNER";

  if (!password) {
    console.error("ERROR: ADMIN_PASSWORD environment variable is required.");
    console.error("Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... bun run scripts/seed-admin.ts");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ERROR: ADMIN_PASSWORD must be at least 12 characters long.");
    process.exit(1);
  }

  console.log(`Seeding admin account: ${email} (${role})`);
  const passwordHash = hashPassword(password);

  const existing = await db.user.findUnique({ where: { email } });
  let user;
  if (existing) {
    user = await db.user.update({
      where: { email },
      data: { passwordHash, role, name, status: "active" },
    });
    console.log(`Updated existing user: ${user.id}`);
  } else {
    user = await db.user.create({
      data: { email, name, role, status: "active", passwordHash },
    });
    console.log(`Created new user: ${user.id}`);
  }

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.provisioned",
      resource: "user",
      resourceId: user.id,
      meta: JSON.stringify({ email, role, method: "seed-admin-script" }),
      ipHash: "seed-script",
    },
  });

  console.log("Done. You can now sign in to the Command Center.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
