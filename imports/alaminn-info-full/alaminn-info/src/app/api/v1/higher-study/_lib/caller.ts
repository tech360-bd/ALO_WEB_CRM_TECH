/**
 * Shared helpers for Higher Study "personal list" public APIs
 * (saved items, comparisons, alerts).
 *
 * These APIs support BOTH anonymous callers (identified by a
 * client-generated `sessionId` stored in localStorage) AND authenticated
 * Alaminn.info users (identified by the signed session cookie).
 *
 * The lookup key is `userId` if authenticated, else `sessionId`.
 * Anonymous callers MUST provide a sessionId — anonymous writes without
 * one are rejected.
 */
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { safeString } from "@/lib/higher-study/api-helpers";

export interface CallerContext {
  userId: string | null;
  sessionId: string | null;
  /** `true` if the caller is authenticated (userId present). */
  authenticated: boolean;
}

/**
 * Resolve the caller from a request. Authenticated sessions take
 * precedence; otherwise the caller must provide a `sessionId` query
 * param (GET) or `sessionId` body field (POST/DELETE).
 */
export function resolveCaller(
  req: NextRequest,
  body?: Record<string, unknown> | null,
): CallerContext {
  const session = getSessionFromRequest(req);
  if (session?.userId) {
    return { userId: session.userId, sessionId: null, authenticated: true };
  }
  const url = new URL(req.url);
  const sessionId =
    safeString(body?.sessionId as string | undefined) ||
    safeString(url.searchParams.get("sessionId"));
  return {
    userId: null,
    sessionId: sessionId || null,
    authenticated: false,
  };
}

/**
 * Returns the Prisma where-clause fragment identifying a caller's
 * personal list items. Returns `null` if the caller provided neither
 * a userId nor a sessionId (must reject).
 */
export function callerWhere(ctx: CallerContext): Record<string, string> | null {
  if (ctx.userId) return { userId: ctx.userId };
  if (ctx.sessionId) return { sessionId: ctx.sessionId };
  return null;
}
