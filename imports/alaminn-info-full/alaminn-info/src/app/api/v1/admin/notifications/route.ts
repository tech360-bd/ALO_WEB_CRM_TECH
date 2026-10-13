import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/notifications — list current user's notifications */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "1";
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    OR: [{ userId: guard.session.userId }, { userId: null }],
    ...(unreadOnly ? { read: false } : {}),
  };
  const [items, total] = await Promise.all([
    db.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.notification.count({ where }),
  ]);
  return ok(items, "Notifications loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** POST /api/v1/admin/notifications — create a notification (or mark all read via action=markAllRead) */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;

  // Special action: mark all read
  if (b.action === "markAllRead") {
    await db.notification.updateMany({
      where: { OR: [{ userId: guard.session.userId }, { userId: null }], read: false },
      data: { read: true },
    });
    return ok({ marked: true }, "All notifications marked as read.");
  }

  const { type, title, message, link, userId } = b as Record<string, string>;
  if (!type || !title || !message) return fail("type, title, message are required.", ["missing_fields"]);
  try {
    const note = await db.notification.create({
      data: {
        type,
        title,
        message,
        link: link || null,
        userId: userId || guard.session.userId,
      },
    });
    await writeAudit(guard.session, "notification.create", "Notification", note.id, { type });
    return ok(note, "Notification created.", {}, 201);
  } catch (e) {
    return fail("Failed to create notification.", [(e as Error).message], 500);
  }
}
