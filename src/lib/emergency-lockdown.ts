// ============================================================
// ALO EDUCATION — EMERGENCY LOCKDOWN (durable + enforced)
//
// The legacy implementation kept the lockdown flag in a module-level variable:
// every server process had its own copy, it was lost on restart, and — most
// importantly — nothing read it, so "activate lockdown" only wrote an audit row
// while every normal user kept working. That is a UI-only safety control.
//
// This module is the single source of truth:
//   • state is persisted in `system_settings` under one key, so every instance
//     and every restart sees the same value;
//   • a 5-second in-process cache keeps the check off the hot path;
//   • `isEmergencyLockdownActive()` is consulted by the auth middleware, so a
//     lockdown really does block non-Super-Admin API access;
//   • a read failure FAILS OPEN (returns inactive) — a database outage must not
//     be able to lock the platform out of its own recovery path.
// ============================================================

import { db } from '@/lib/db';

export const LOCKDOWN_SETTING_KEY = 'system.emergency_lockdown';

export interface LockdownState {
  active: boolean;
  reason: string;
  activatedBy: string;
  activatedAt: string | null;
  deactivatedAt: string | null;
}

const INACTIVE: LockdownState = {
  active: false,
  reason: '',
  activatedBy: '',
  activatedAt: null,
  deactivatedAt: null,
};

const CACHE_TTL_MS = 5_000;

let cache: { state: LockdownState; readAt: number } | null = null;

function parseState(raw: string | null | undefined): LockdownState {
  if (!raw) return INACTIVE;
  try {
    const parsed = JSON.parse(raw) as Partial<LockdownState>;
    return {
      active: parsed.active === true,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      activatedBy: typeof parsed.activatedBy === 'string' ? parsed.activatedBy : '',
      activatedAt: typeof parsed.activatedAt === 'string' ? parsed.activatedAt : null,
      deactivatedAt: typeof parsed.deactivatedAt === 'string' ? parsed.deactivatedAt : null,
    };
  } catch {
    return INACTIVE;
  }
}

/** Reads the persisted lockdown state. Fails open on any storage error. */
export async function readEmergencyLockdown(force = false): Promise<LockdownState> {
  const now = Date.now();
  if (!force && cache && now - cache.readAt < CACHE_TTL_MS) return cache.state;

  try {
    const row = await db.systemSetting.findUnique({
      where: { key: LOCKDOWN_SETTING_KEY },
      select: { value: true },
    });
    const state = parseState(row?.value);
    cache = { state, readAt: now };
    return state;
  } catch {
    // Fail open: if the setting cannot be read the platform must keep working.
    cache = { state: INACTIVE, readAt: now };
    return INACTIVE;
  }
}

/** True when a lockdown is active. Used by the API auth middleware. */
export async function isEmergencyLockdownActive(): Promise<boolean> {
  return (await readEmergencyLockdown()).active;
}

/** Persists the next lockdown state and invalidates the cache. */
export async function writeEmergencyLockdown(
  next: LockdownState,
  updatedBy: string,
): Promise<LockdownState> {
  await db.systemSetting.upsert({
    where: { key: LOCKDOWN_SETTING_KEY },
    update: {
      value: JSON.stringify(next),
      valueType: 'json',
      updatedBy,
    },
    create: {
      key: LOCKDOWN_SETTING_KEY,
      value: JSON.stringify(next),
      valueType: 'json',
      category: 'security',
      label: 'Emergency lockdown',
      description:
        'When active, non-Super-Admin API access is refused. Written by /api/admin/security/lockdown and enforced by the auth middleware.',
      isSensitive: false,
      updatedBy,
    },
  });
  cache = { state: next, readAt: Date.now() };
  return next;
}

/** Test seam: forget the cached value. */
export function resetEmergencyLockdownCache(): void {
  cache = null;
}
