# health-monitor (port 3004)

A mesh health monitor. Every **30 seconds** it pings the main Next.js app
(`/api/health` on port 3000) and each sibling mini-service (`/health` on
ports 3001, 3002, 3003). The most recent check result for each target is
cached in memory; the last **100 check rounds** are retained for inspection.

## Endpoints

| Method | Path       | Description                                              |
|--------|------------|----------------------------------------------------------|
| GET    | `/status`  | Current status of every target + self (`main`, `notification`, `emailWorker`, `auditWorker`, `self`) |
| GET    | `/health`  | The monitor's own health                                 |
| GET    | `/metrics` | Uptime, total check rounds, last check time, per-target up/down counts, last 10 round summaries |
| OPTIONS| *          | CORS preflight                                          |

## Targets monitored

| Key           | URL                                  |
|---------------|--------------------------------------|
| `main`        | `http://localhost:3000/api/health`   |
| `notification`| `http://localhost:3001/health`       |
| `emailWorker` | `http://localhost:3002/health`       |
| `auditWorker` | `http://localhost:3003/health`       |
| `self`        | (always `up` — it's this service)    |

## Sample

```bash
curl -s http://localhost:3004/status | jq
curl -s http://localhost:3004/metrics | jq
```

## Run

```bash
cd mini-services/health-monitor
bun run dev   # bun --hot index.ts — auto-restarts on file change
```

## Notes

- **In-memory only** — check history is lost on restart.
- **5-second per-target timeout** — a slow/hanging target is recorded as
  `down` with `error: "The operation was aborted due to timeout"` (or
  similar).
- **First check runs ~500ms after boot** (so siblings have a chance to be
  listening if started in sequence). Subsequent checks run every 30s.
- **Logging** — emits a structured `check.round_completed` info log when all
  targets are up, and a `check.round_completed_with_down` warning (listing
  the down targets) when any target is down.
