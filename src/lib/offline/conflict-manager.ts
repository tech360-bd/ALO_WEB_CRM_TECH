// ─── Conflict Detection & Resolution ────────────────────────
// Compares local vs server data and provides resolution strategies.

import { put as idbPut, type StoreName } from './db';

// ─── Types ──────────────────────────────────────────────────

export type ConflictResolution = 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE';

export interface ConflictRecord {
  localVersion: string;
  serverVersion: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  entity: string;
  entityId: string;
  resolvedAt?: string;
  resolution?: ConflictResolution;
}

/**
 * Extract the version/timestamp from a data record.
 * Checks updatedAt, then version, then createdAt fields.
 */
function extractVersion(data: Record<string, unknown>): string {
  if (typeof data.updatedAt === 'string') return data.updatedAt;
  if (typeof data.version === 'string') return data.version;
  if (typeof data.version === 'number') return String(data.version);
  if (typeof data.createdAt === 'string') return data.createdAt;
  return '';
}

/**
 * Shallow merge two objects — server wins on conflicts unless local is newer.
 */
function mergeObjects(
  local: Record<string, unknown>,
  server: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...server };

  for (const key of Object.keys(local)) {
    // Always prefer server system fields
    if (['id', 'createdAt', 'createdBy'].includes(key)) continue;
    // Local fields that should win if present
    merged[key] = local[key];
  }

  return merged;
}

/**
 * Detect a conflict between local and server data by comparing
 * updatedAt/version timestamps. Returns a ConflictRecord if the
 * server version is newer than the local version (meaning someone
 * else changed the data while we were offline).
 */
export function detectConflict(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  entity?: string,
  entityId?: string
): ConflictRecord | null {
  const localVersion = extractVersion(localData);
  const serverVersion = extractVersion(serverData);

  // No conflict if versions match or either is empty
  if (!localVersion || !serverVersion || localVersion === serverVersion) {
    return null;
  }

  // If server is newer, there's a potential conflict
  const localTime = new Date(localVersion).getTime();
  const serverTime = new Date(serverVersion).getTime();

  // If the server version is strictly newer, it means someone else
  // modified the record while we were offline
  if (serverTime > localTime) {
    return {
      localVersion,
      serverVersion,
      localData,
      serverData,
      entity: entity ?? 'unknown',
      entityId: entityId ?? (localData.id as string) ?? '',
    };
  }

  return null;
}

/**
 * Resolve a conflict by applying the chosen resolution strategy.
 *
 * - KEEP_LOCAL: Keep the local version and push to server later
 * - KEEP_SERVER: Discard local changes, use server version
 * - MERGE: Shallow merge, with local fields taking priority on non-system fields
 *
 * Also logs the conflict resolution to /api/audit-logs.
 */
export async function resolveConflict(
  conflict: ConflictRecord,
  resolution: ConflictResolution
): Promise<Record<string, unknown>> {
  let resolvedData: Record<string, unknown>;

  switch (resolution) {
    case 'KEEP_LOCAL':
      resolvedData = conflict.localData;
      break;

    case 'KEEP_SERVER':
      resolvedData = conflict.serverData;
      break;

    case 'MERGE':
      resolvedData = mergeObjects(conflict.localData, conflict.serverData);
      break;

    default:
      resolvedData = conflict.serverData;
  }

  // Mark conflict as resolved
  const resolvedConflict: ConflictRecord = {
    ...conflict,
    resolvedAt: new Date().toISOString(),
    resolution,
  };

  // Update local IndexedDB with resolved data
  const storeName = conflict.entity as StoreName;
  try {
    await idbPut(storeName, resolvedData);
  } catch {
    // IndexedDB write failure should not block conflict resolution
  }

  // Log the conflict resolution to audit logs (fire-and-forget)
  logConflictAudit(resolvedConflict).catch(() => {
    // Audit logging should never break the main flow
  });

  return resolvedData;
}

/**
 * Log a conflict resolution to the server audit log.
 * Fire-and-forget — errors are swallowed.
 */
async function logConflictAudit(conflict: ConflictRecord): Promise<void> {
  try {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'OFFLINE_CONFLICT_RESOLVED',
        resource: conflict.entity,
        resourceId: conflict.entityId,
        details: {
          resolution: conflict.resolution,
          localVersion: conflict.localVersion,
          serverVersion: conflict.serverVersion,
          resolvedAt: conflict.resolvedAt,
        },
      }),
    });
  } catch {
    // Intentionally swallowed
  }
}
