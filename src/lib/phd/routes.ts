import { handlePhdError, safeFilename } from './api';
import { isNextResponse, requirePhdActor, type PhdActor } from './auth';

/**
 * Shared wrapper for every PhD API route.
 *
 * - resolves the actor server-side (NextAuth, student session or portal session)
 *   and returns 401 when there is none;
 * - never trusts a client-supplied user id or role;
 * - converts thrown `PhdAccessError` / `ZodError` into safe JSON responses via
 *   `handlePhdError`, so a stack trace, SQL fragment or personal record can
 *   never reach the browser;
 * - awaits Next.js route params (Promise-based since Next 15).
 */
export type PhdRouteParams = Record<string, string>;

export function phdRoute<P extends PhdRouteParams = PhdRouteParams>(
  handler: (args: { actor: PhdActor; req: Request; params: P }) => Promise<Response>,
): (req: Request, context?: { params?: Promise<P> }) => Promise<Response> {
  return async (req, context) => {
    const actor = await requirePhdActor(req);
    if (isNextResponse(actor)) return actor;
    try {
      const params = (context?.params ? await context.params : ({} as P));
      return await handler({ actor, req, params });
    } catch (error) {
      return handlePhdError(error);
    }
  };
}

/** Binary response with a safe, non-guessable filename and no caching. */
export function phdFileResponse(buffer: Buffer, filename: string, contentType: string): Response {
  const safe = safeFilename(filename);
  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(buffer.byteLength),
      'Content-Disposition': `attachment; filename="${safe}"`,
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Reads a bounded string query parameter. */
export function queryParam(req: Request, name: string, max = 200): string {
  const value = new URL(req.url).searchParams.get(name) ?? '';
  return value.trim().slice(0, max);
}

export function queryFlag(req: Request, name: string): boolean {
  const value = new URL(req.url).searchParams.get(name);
  return value === '1' || value === 'true';
}
