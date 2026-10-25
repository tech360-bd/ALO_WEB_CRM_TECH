import { z } from 'zod';
import { db } from '@/lib/db';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/notifications — in-app notifications for the signed-in actor only.
export const GET = phdRoute(async ({ actor }) => {
  const notifications = await db.phdNotification.findMany({
    where: { userId: actor.userId },
    orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  });
  return phdJson({ success: true, notifications });
});

const readSchema = z.object({ id: z.string().min(1).max(64), read: z.boolean() });

// PATCH /api/phd/notifications — marks one notification read/unread.
export const PATCH = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, readSchema);
  const updated = await db.phdNotification.updateMany({
    where: { id: input.id, userId: actor.userId },
    data: { readAt: input.read ? new Date() : null },
  });
  return phdJson({ success: true, updated: updated.count });
});
