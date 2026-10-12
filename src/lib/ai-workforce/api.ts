/**
 * ALO AI Workforce — API response envelope and safe error handling.
 *
 * Responses follow the project convention documented in §39:
 *   { success, status, message, data, timestamp }
 *
 * Internals (stack traces, provider credentials, filesystem paths, system
 * prompts, raw memory) are never serialised to a client.
 */
import { NextResponse } from 'next/server';

export interface ApiEnvelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  timestamp: string;
  correlationId?: string;
}

const SENSITIVE_PATTERNS = [
  /\/home\/[^\s"']+/g,
  /[A-Za-z]:\\[^\s"']+/g,
  /\b(sk|pk|rk)-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._-]{8,}/gi,
  /\b[A-Za-z0-9_]*(?:API_KEY|SECRET|PASSWORD|TOKEN)[A-Za-z0-9_]*\s*[:=]\s*\S+/gi,
];

/** Strip anything that could leak infrastructure or credentials. */
export function sanitizeMessage(message: string): string {
  let out = String(message || '').slice(0, 500);
  for (const pattern of SENSITIVE_PATTERNS) out = out.replace(pattern, '[redacted]');
  return out;
}

export function ok<T>(data: T, message = 'OK', status = 200, correlationId?: string): NextResponse {
  const body: ApiEnvelope<T> = {
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...(correlationId ? { correlationId } : {}),
  };
  return NextResponse.json(body, { status });
}

export function fail(message: string, status = 400, correlationId?: string): NextResponse {
  const body: ApiEnvelope<null> = {
    success: false,
    status,
    message: sanitizeMessage(message),
    data: null,
    timestamp: new Date().toISOString(),
    ...(correlationId ? { correlationId } : {}),
  };
  return NextResponse.json(body, { status });
}

/** Map a thrown error onto a safe envelope. Never leaks the original text verbatim. */
export function failFromError(error: unknown, fallback = 'Request failed', status = 500, correlationId?: string): NextResponse {
  const raw = error instanceof Error ? error.message : '';
  const known = /^[A-Z0-9_]+:/.test(raw) || raw.startsWith('AWF_');
  return fail(known ? raw : fallback, status, correlationId);
}
