import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const INTAKE_SESSION_COOKIE = 'alo_intake_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function intakeSessionSecret(env: Record<string, string | undefined> = process.env): string | null {
  const secret = env.INTAKE_SESSION_SECRET || env.NEXTAUTH_SECRET || env.SESSION_SECRET || env.AUTH_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function createIntakeSession(secret: string): { id: string; cookie: string } {
  const id = randomUUID();
  return { id, cookie: sign(id, secret) };
}

export function verifyIntakeSession(cookie: string | null | undefined, secret: string): string | null {
  if (!cookie) return null;
  const separator = cookie.lastIndexOf('.');
  if (separator <= 0) return null;
  const id = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{40,60}$/.test(signature)) return null;
  const expected = createHmac('sha256', secret).update(id).digest('base64url');
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  return id;
}

export function intakeSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/api/ai/student-intake',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function sign(id: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(id).digest('base64url');
  return `${id}.${signature}`;
}
