import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { checkRateLimit } from '@/lib/rate-limiter';
import { PhdAccessError, type PhdActor } from './auth';

export function phdJson<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function phdError(message: string, status = 400, extra: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ success: false, error: message, ...extra }, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function handlePhdError(error: unknown): NextResponse {
  if (error instanceof PhdAccessError) return phdError(error.message, error.status);
  if (error instanceof ZodError) {
    return phdError('The submitted data did not pass validation.', 422, {
      issues: error.issues.slice(0, 20).map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  // Never leak SQL, stack traces, secrets or personal data in API responses.
  console.error('[phd-api] unhandled error', error instanceof Error ? error.message : 'unknown');
  return phdError('The request could not be completed. No changes were saved.', 500);
}

export async function readPhdJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new PhdAccessError('A valid JSON body is required.', 400);
  }
  return schema.parse(body);
}

export function enforceRateLimit(req: Request, actor: PhdActor, bucket: string, limit = 30, windowMs = 60_000): void {
  const key = `${bucket}:${actor.userId}`;
  const result = checkRateLimit(key, 'webhook');
  // The shared limiter has conservative defaults; module-level writes are
  // additionally bounded here to protect expensive exports and uploads.
  const windowKey = `${key}:${Math.floor(Date.now() / windowMs)}`;
  const counter = (globalThis as unknown as { __phdRate?: Map<string, number> }).__phdRate ?? new Map<string, number>();
  (globalThis as unknown as { __phdRate?: Map<string, number> }).__phdRate = counter;
  const count = (counter.get(windowKey) ?? 0) + 1;
  counter.set(windowKey, count);
  if (count > limit || !result.allowed) {
    throw new PhdAccessError('Too many requests. Please wait a moment and try again.', 429);
  }
  const url = req.url;
  void url;
}

export function parseIntParam(value: string | null, fallback: number, min = 1, max = 100): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function requireString(value: unknown, field: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim()) throw new PhdAccessError(`${field} is required.`, 422);
  return value.trim().slice(0, max);
}

export function safeFilename(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return cleaned || 'document';
}
