# email-worker (port 3002)

An in-memory retry queue for failed email sends. Other services (or the main
Next.js app) POST failed send descriptors to `/queue`; the worker then
attempts retries with **exponential backoff** (2s → 4s → 8s → 16s → 32s,
capped at 60s) up to a max of 6 attempts.

## Endpoints

| Method | Path                    | Description                                              |
|--------|-------------------------|----------------------------------------------------------|
| POST   | `/queue`                | Enqueue a failed send `{ messageId, recipient, subject, body, reason?, meta? }` |
| GET    | `/queue`                | List pending + recently processed items                 |
| POST   | `/retry/:messageId`     | Manually trigger a retry attempt immediately            |
| DELETE | `/queue/:messageId`     | Drop a queued item (give up)                            |
| GET    | `/health`               | `{ status, pending, processing, processed, failed, config }` |
| OPTIONS| *                       | CORS preflight                                          |

## Usage from the main Next.js app

```ts
await fetch(`/api/email-retry?XTransformPort=3002`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messageId: "msg_abc123",
    recipient: "user@example.com",
    subject: "Your verification code",
    body: "...",
    reason: "smtp_timeout",
    meta: { source: "newsletter", attempt: 0 },
  }),
});
```

## Backoff schedule

| Attempt | Wait before next attempt |
|--------:|--------------------------|
|       1 |  2s |
|       2 |  4s |
|       3 |  8s |
|       4 | 16s |
|       5 | 32s |
|       6 | (final — marked `failed`) |

## Run

```bash
cd mini-services/email-worker
bun run dev   # bun --hot index.ts — auto-restarts on file change
```

## Notes

- **In-memory only** — the queue is lost on restart.
- **No external dependencies** — uses only `Bun.serve`. The actual SMTP send
  is simulated (the main app's real transport lives in
  `src/lib/email/transport.ts`). This worker is a pluggable fallback retry
  layer.
- **Test modes**: set `meta.forceFail: true` to force every attempt to fail
  (useful for observing backoff); set `meta.flaky: true` for a 50% transient
  failure rate on the first attempt only.
- Retention: keeps the last 200 terminal items (delivered/failed/dropped) for
  inspection via `GET /queue`.
