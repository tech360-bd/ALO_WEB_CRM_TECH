// GET   /api/super-admin/settings  — settings grouped by category
// PATCH /api/super-admin/settings  — update settings (audited)
//
// Sensitive values (integration secrets) are never returned: the API emits
// `null` plus `isSensitive: true`. Writing a sensitive key requires an extra
// confirmation flag so a mis-click cannot rotate a live credential.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';

export const dynamic = 'force-dynamic';

interface SettingRow {
  id: string;
  key: string;
  value: string;
  valueType: string;
  category: string;
  label: string;
  description: string;
  isSensitive: boolean;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

interface SettingDefinition {
  key: string;
  category: string;
  label: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
}

/** Shipped defaults for the settings the specification names. */
export const DEFAULT_SETTINGS: readonly SettingDefinition[] = [
  { key: 'company.name', category: 'company', label: 'Company name', value: 'ALO Education', valueType: 'string' },
  { key: 'company.supportEmail', category: 'company', label: 'Support email', value: '', valueType: 'string' },
  { key: 'mock.freeRules.fullStudent', category: 'english_test', label: 'Free full mocks — ALO full student', value: '3', valueType: 'number' },
  { key: 'mock.freeRules.englishOnly', category: 'english_test', label: 'Free mocks — English-test-only student', value: '1', valueType: 'number' },
  { key: 'documents.maxUploadMb', category: 'documents', label: 'Maximum upload size (MB)', value: '20', valueType: 'number' },
  { key: 'approvals.requireForPublish', category: 'approvals', label: 'Public publish requires approval', value: 'true', valueType: 'boolean' },
  { key: 'ai.requireApprovalForRisky', category: 'ai', label: 'Risky AI actions require approval', value: 'true', valueType: 'boolean' },
  { key: 'sla.firstResponseMinutes', category: 'sla', label: 'First response SLA (minutes)', value: '60', valueType: 'number' },
  { key: 'audit.retentionDays', category: 'audit', label: 'Audit retention (days)', value: '2555', valueType: 'number' },
  { key: 'system.maintenanceMode', category: 'system', label: 'Maintenance mode', value: 'false', valueType: 'boolean' },
] as const;

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const stored = await safe<SettingRow[]>(
      () => db.systemSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }),
      [],
    );
    const storedByKey = new Map<string, SettingRow>(stored.map((row) => [row.key, row] as [string, SettingRow]));

    const merged: Array<{
      key: string; category: string; label: string; valueType: string; value: string | null;
      isSensitive: boolean; updatedBy: string | null; updatedAt: string | null; persisted: boolean;
    }> = DEFAULT_SETTINGS.map((definition) => {
      const row = storedByKey.get(definition.key);
      return {
        key: definition.key,
        category: row?.category || definition.category,
        label: row?.label || definition.label,
        valueType: row?.valueType || definition.valueType,
        value: row?.value ?? definition.value,
        isSensitive: row?.isSensitive ?? false,
        updatedBy: row?.updatedBy || null,
        updatedAt: row?.updatedAt?.toISOString() || null,
        persisted: Boolean(row),
      };
    });

    for (const row of stored) {
      if (DEFAULT_SETTINGS.some((definition) => definition.key === row.key)) continue;
      merged.push({
        key: row.key,
        category: row.category,
        label: row.label || row.key,
        valueType: row.valueType,
        // Never leak a sensitive stored value through this endpoint.
        value: row.isSensitive ? null : row.value,
        isSensitive: row.isSensitive,
        updatedBy: row.updatedBy || null,
        updatedAt: row.updatedAt.toISOString(),
        persisted: true,
      });
    }

    return NextResponse.json({
      success: true,
      settings: merged,
      categories: [...new Set(merged.map((row) => row.category))].sort(),
      maintenanceMode: merged.find((row) => row.key === 'system.maintenanceMode')?.value === 'true',
    });
  } catch (error) {
    console.error('[super-admin/settings GET] failed', error);
    return NextResponse.json({ success: false, error: 'Settings are temporarily unavailable.' }, { status: 503 });
  }
}

const Body = z.object({
  updates: z.array(z.object({
    key: z.string().trim().min(3).max(120).regex(/^[a-zA-Z0-9_.]+$/),
    value: z.string().max(4000),
    isSensitive: z.boolean().optional(),
  })).min(1).max(50),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
  confirmSensitive: z.boolean().optional(),
}).strict();

async function handlePatch(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }
  const { updates, reason, confirmSensitive } = parsed.data;

  const touchingSensitive = updates.some((update) => update.isSensitive);
  if (touchingSensitive && !confirmSensitive) {
    return NextResponse.json(
      { success: false, error: 'Writing a sensitive setting requires confirmSensitive: true.' },
      { status: 400 },
    );
  }

  try {
    const saved = await db.$transaction(async (tx) => {
      const results: Array<{ key: string; before: string | null; after: string }> = [];
      for (const update of updates) {
        const previous = await tx.systemSetting.findUnique({ where: { key: update.key } });
        await tx.systemSetting.upsert({
          where: { key: update.key },
          update: {
            value: update.value,
            isSensitive: update.isSensitive ?? previous?.isSensitive ?? false,
            updatedBy: auth.actorUserId,
          },
          create: {
            key: update.key,
            value: update.value,
            isSensitive: update.isSensitive ?? false,
            category: update.key.split('.')[0] || 'general',
            label: update.key,
            updatedBy: auth.actorUserId,
          },
        });
        results.push({
          key: update.key,
          // Sensitive before-values are not written into the audit payload.
          before: previous?.isSensitive ? null : previous?.value ?? null,
          after: update.isSensitive ? '[redacted]' : update.value,
        });
      }
      await writePortalAudit(tx, auth, 'SYSTEM_SETTINGS_UPDATED', 'SystemSetting', 'bulk', {
        reason,
        confirmSensitive: Boolean(confirmSensitive),
        changes: results,
      }, request);
      return results;
    });

    return NextResponse.json({ success: true, updated: saved.length });
  } catch (error) {
    console.error('[super-admin/settings PATCH] failed', error);
    return NextResponse.json({ success: false, error: 'Settings could not be saved and audited.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
