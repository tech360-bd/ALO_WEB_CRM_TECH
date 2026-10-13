/**
 * API route observability wrapper.
 * --------------------------------
 * Combines three concerns for every wrapped route handler:
 *
 *   1. Request context — establishes an AsyncLocalStorage context so
 *      `getRequestId()` works anywhere inside the handler (logging,
 *      error blocks, downstream services).
 *
 *   2. Timing — logs a structured `http_request` event with method,
 *      path, status, and durationMs. Lets you spot slow endpoints in
 *      the log stream without a separate APM agent.
 *
 *   3. Response correlation — attaches `X-Request-Id` to the outgoing
 *      response so clients, support staff, and error reports can
 *      cross-reference logs.
 *
 * Usage:
 *   import { withObservability } from "@/lib/observability";
 *
 *   export const POST = withObservability(async (req) => {
 *     ...
 *     return ok({ reference });
 *   });
 *
 * `withTiming` is exported as an alias for callers that only care about
 * the timing aspect.
 */
import { NextResponse, type NextRequest } from "next/server";
import { generateRequestId, runWithRequestId } from "./request-context";
import { logger } from "./logger";

type RouteHandler<TArgs = unknown> = (
  req: NextRequest,
  args: TArgs
) => Promise<Response> | Response;

function pathOf(req: NextRequest): string {
  try {
    return req.nextUrl?.pathname || new URL(req.url).pathname;
  } catch {
    return req.url || "unknown";
  }
}

export function withObservability<TArgs = unknown>(handler: RouteHandler<TArgs>) {
  return async (req: NextRequest, args: TArgs): Promise<Response> => {
    // Prefer an ID propagated by middleware (X-Request-Id header),
    // otherwise generate one so every wrapped route always has a token.
    const incoming = req.headers.get("x-request-id");
    const requestId = incoming || generateRequestId();
    if (!incoming) {
      // Mirror into the request headers so downstream code reading
      // req.headers.get("x-request-id") sees the same ID.
      req.headers.set("x-request-id", requestId);
    }

    const start = performance.now();
    let status = 500;
    let response: Response;

    try {
      response = await runWithRequestId(requestId, () => handler(req, args));
      status = response.status;
    } catch (err) {
      status = 500;
      logger.error("http_request.unhandled_exception", {
        requestId,
        method: req.method,
        path: pathOf(req),
        error:
          err instanceof Error
            ? { name: err.name, message: err.message, stack: err.stack }
            : String(err),
      });
      // Same shape as the existing fail() helper, with an `errorId`
      // added to meta so support staff can locate the failing request.
      response = NextResponse.json(
        {
          success: false,
          message: "Internal error.",
          data: null,
          meta: { errorId: requestId },
          errors: ["server_error"],
        },
        { status: 500 }
      );
    } finally {
      const durationMs = Math.round(performance.now() - start);
      logger.info("http_request", {
        method: req.method,
        path: pathOf(req),
        status,
        durationMs,
      });
    }

    // Attach X-Request-Id to the outgoing response (middleware already
    // does this, but we re-set it here so wrapped routes work even if
    // middleware is bypassed, e.g. in tests or alternate entry points).
    try {
      response.headers.set("x-request-id", requestId);
    } catch {
      // Response headers may be immutable (e.g. cached Response);
      // clone defensively.
      const cloned = new Response(response.body, response);
      cloned.headers.set("x-request-id", requestId);
      return cloned;
    }

    return response;
  };
}

/** Alias for callers that only care about timing. */
export const withTiming = withObservability;
