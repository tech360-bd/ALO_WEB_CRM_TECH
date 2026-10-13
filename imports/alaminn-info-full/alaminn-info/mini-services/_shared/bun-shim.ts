/**
 * mini-services/_shared/bun-shim.ts
 * ------------------------------------------------------------------
 * Node.js compatibility shim for Bun APIs used by Alaminn.info mini-services.
 *
 * Allows mini-services to run with EITHER:
 *   - Bun:   `bun --hot index.ts`  (fastest, native)
 *   - Node:  `npx tsx index.ts`    (for cPanel/Node-only environments)
 *
 * Provides:
 *   - Bun.serve() → wraps node:http.createServer with a Web Request/Response API
 *   - Bun.serve() return value: { port, stop() }
 *
 * Usage (in a mini-service index.ts):
 *   import { Bun_ } from "../_shared/bun-shim";
 *   const server = await Bun_.serve({ port: 3002, fetch(req) { ... } });
 *
 * When running under real Bun, this re-exports the native Bun.serve.
 * When running under Node, it polyfills using node:http.
 */

type ServeHandler = (req: Request) => Response | Promise<Response>;

interface ServeOptions {
  port: number;
  fetch: ServeHandler;
  hostname?: string;
}

interface ServerLike {
  port: number;
  hostname: string;
  stop: (closeConnections?: boolean) => void;
}

// Detect runtime
const isBun =
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" &&
  typeof (globalThis as { Bun?: { serve?: unknown } }).Bun?.serve === "function";

async function nodeServe(opts: ServeOptions): Promise<ServerLike> {
  const { createServer } = await import("node:http");
  const server = createServer(
    async (nodeReq, nodeRes) => {
      try {
        const protocol = "http:";
        const host = nodeReq.headers.host || `localhost:${opts.port}`;
        const url = `${protocol}//${host}${nodeReq.url}`;
        const headers = new Headers();
        for (const [k, v] of Object.entries(nodeReq.headers)) {
          if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
          else if (v !== undefined) headers.set(k, v);
        }
        const method = nodeReq.method || "GET";
        const hasBody = method !== "GET" && method !== "HEAD";
        const body = hasBody
          ? (nodeReq as unknown as BodyInit)
          : undefined;
        const webReq = new Request(url, {
          method,
          headers,
          body,
          // @ts-expect-error: duplex is a valid Node streams option
          duplex: "half",
        });

        const webRes = await opts.fetch(webReq);

        nodeRes.statusCode = webRes.status;
        webRes.headers.forEach((v, k) => nodeRes.setHeader(k, v));
        if (webRes.body) {
          const reader = webRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            nodeRes.write(value);
          }
        }
        nodeRes.end();
      } catch (err) {
        if (!nodeRes.headersSent) {
          nodeRes.statusCode = 500;
          nodeRes.setHeader("Content-Type", "application/json");
        }
        nodeRes.end(
          JSON.stringify({
            success: false,
            error: "Internal server error",
            message: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    },
  );

  await new Promise<void>((resolve) => {
    server.listen(opts.port, opts.hostname || "0.0.0.0", () => resolve());
  });

  return {
    port: opts.port,
    hostname: opts.hostname || "0.0.0.0",
    stop: (_closeConnections?: boolean) => {
      server.close();
    },
  };
}

export const Bun_ = {
  serve: isBun
    ? (opts: ServeOptions) =>
        (globalThis as { Bun: { serve: (o: ServeOptions) => ServerLike } }).Bun.serve(opts)
    : (opts: ServeOptions) => nodeServe(opts),
};

export default Bun_;
