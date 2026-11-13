// GET   /api/super-admin/settings/maintenance-mode — current switch + who set it
// PATCH /api/super-admin/settings/maintenance-mode — turn it on/off (audited)
//
// The switch lives in `system_settings` under `platform.maintenance_mode`.
// Turning it ON requires a message shown to end users; turning it OFF requires
// no message. The write is audited with before/after so the timeline is clear.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const KEY = 'platform.maintenance_mode';
const MESSAGE_KEY = 'platform.maintenance_message';

async function readSetting(key: string) {
  return db.systemSetting.findUnique({ where: { key } }).catch(() => null);
}

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const [mode, message] = await Promise.all([readSetting(KEY), readSetting(MESSAGE_KEY)]);
    return NextResponse.json({
      success: true,
      maintenanceMode: mode?.value === 'true',
      message: message?.value || '',
      updatedBy: mode?.updatedBy || null,
      updatedAt: mode?.updatedAt?.toISOString() || null,
      known: Boolean(mode),
      note: mode ? undefined : 'The switch has never been written; the platform is treated as live.',
    });
  } catch (error) {
    return unavailable('super-admin/settings/maintenance-mode GET', error);
  }
}

const Body = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(500).default(''),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { enabled, message, reason } = parsed.data;

  if (enabled && message.trim().length < 10) {
    return badRequest('Turning maintenance mode ON requires a user-facing message of at least 10 characters.');
  }

  try {
    const before = await readSetting(KEY);

    await db.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: KEY },
        create: {
          key: KEY,
          value: String(enabled),
          valueType: 'boolean',
          category: 'platform',
          label: 'Maintenance mode',
          description: 'When true, the public site shows the maintenance notice instead of live pages.',
          updatedBy: auth.actorUserId,
        },
        update: { value: String(enabled), updatedBy: auth.actorUserId },
      });
      if (message) {
        await tx.systemSetting.upsert({
          where: { key: MESSAGE_KEY },
          create: {
            key: MESSAGE_KEY,
            value: message,
            valueType: 'string',
            category: 'platform',
            label: 'Maintenance message',
            description: 'Message shown to users while the platform is under maintenance.',
            updatedBy: auth.actorUserId,
          },
          update: { value: message, updatedBy: auth.actorUserId },
        });
      }
      await writePortalAudit(tx, auth, enabled ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED', 'SystemSetting', KEY, {
        reason,
        message,
        before: { value: before?.value ?? null },
        after: { value: String(enabled) },
      }, request);
    });

    return NextResponse.json({
      success: true,
      maintenanceMode: enabled,
      message,
      // Be explicit: writing the switch does not by itself stop traffic. The
      // middleware/edge layer must read this key for the mode to take effect.
      note: 'Switch stored. Enforcement happens in the request middleware that reads `platform.maintenance_mode`.',
    });
  } catch (error) {
    return unavailable('super-admin/settings/maintenance-mode PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
