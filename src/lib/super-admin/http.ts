// ============================================================
// ALO EDUCATION — Super Admin route helpers
//
// Shared, boring plumbing so every /api/super-admin/* route behaves the
// same way: consistent error shape, safe logging, and no duplicated
// try/catch boilerplate that drifts between routes.
// ============================================================

import { NextResponse } from 'next/server';

/** Degrades a failing read query to a typed empty result. */
export async function safeRows<T>(fn: () => Promise<unknown>, fallback: T[] = []): Promise<T[]> {
  try {
    return (await fn()) as T[];
  } catch {
    return fallback;
  }
}

/** Degrades a failing scalar read to null so a KPI can report "unavailable". */
export async function safeCount(fn: () => Promise<number>): Promise<number | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export function unavailable(scope: string, error: unknown): NextResponse {
  console.error(`[${scope}] failed`, error);
  return NextResponse.json(
    { success: false, error: 'This section is temporarily unavailable.' },
    { status: 503 },
  );
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function notFound(message = 'Record not found.'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 409 });
}

/** Short, stable, human-readable code, e.g. ALO-RPT-20261027-4F2A. */
export function shortCode(prefix: string, random = Math.random): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.floor(random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `${prefix}-${stamp}-${suffix}`;
}

export function jsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function jsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
