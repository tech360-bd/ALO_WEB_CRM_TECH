# notification-service (port 3001)

A lightweight, dependency-free notification ingestion service built on Bun's
built-in HTTP server. Receives notification requests from the main Next.js app
(and other mini-services), stores them in an in-memory FIFO log (max 1000
entries), and exposes the log for debugging.

## Endpoints

| Method | Path                      | Description                                              |
|--------|---------------------------|----------------------------------------------------------|
| POST   | `/notify`                 | Accepts `{ type, recipient, subject, message, meta }`   |
| GET    | `/notifications`          | Returns the notification log (`?limit=`, `?type=`)      |
| GET    | `/health`                 | `{ status, uptime, count, capacity }`                   |
| OPTIONS| *                         | CORS preflight                                          |

## Usage from the main Next.js app

The main app can call this service through the Caddy gateway using the
`XTransformPort` query parameter:

```ts
await fetch(`/api/notify?XTransformPort=3001`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "login_alert",
    recipient: "user@example.com",
    subject: "New login detected",
    message: "5 failed login attempts were detected on your account.",
    meta: { ipHash: "abc123", source: "auth" },
  }),
});
```

## Run

```bash
cd mini-services/notification-service
bun run dev   # bun --hot index.ts — auto-restarts on file change
```

## Notes

- **In-memory only.** The log is lost on restart. Designed for ephemeral
  debugging/notification fan-out, not durable storage.
- **FIFO eviction** — keeps the most recent 1000 entries.
- **Structured JSON logging** to stdout.
- **No external dependencies** — uses only `Bun.serve`.
