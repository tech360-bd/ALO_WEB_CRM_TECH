# audit-worker (port 3003)

A **read-only** reporting & export service that compiles audit log summaries
from the main app's SQLite database (`/home/z/my-project/db/custom.db`).
Connects via Bun's built-in `bun:sqlite` driver — no Prisma, no external deps.
The DB is opened in **READ-ONLY** mode and this service **NEVER writes**.

## Endpoints

| Method | Path                              | Description                                              |
|--------|-----------------------------------|----------------------------------------------------------|
| GET    | `/report?from=ISO&to=ISO`         | Summary report (counts by action/resource, top actors, hourly timeline) |
| GET    | `/export?format=json\|csv&from=&to=&limit=` | Full export of audit log within range         |
| GET    | `/health`                         | `{ status, totalEvents, oldestEvent, newestEvent }`     |
| OPTIONS| *                                 | CORS preflight                                          |

## Default ranges

- `/report` — defaults to the **last 30 days** if no `from`/`to` supplied.
- `/export` — defaults to the **last 90 days**, capped at 10,000 rows
  (override with `?limit=` up to 100,000).

## Sample

```bash
# Summary report for the last 7 days
curl -s "http://localhost:3003/report?from=$(date -u -d '7 days ago' +%FT%TZ)&to=$(date -u +%FT%TZ)" | jq

# CSV export of all events
curl -s "http://localhost:3003/export?format=csv" -o audit.csv
```

## Run

```bash
cd mini-services/audit-worker
bun run dev   # bun --hot index.ts — auto-restarts on file change
```

## Notes

- **Read-only** — the DB is opened with `{ readonly: true }` and the service
  exposes no write endpoints.
- **DB path is hardcoded** to `/home/z/my-project/db/custom.db` to match the
  main app's Prisma SQLite datasource.
- **Schema assumption**: `AuditLog(id, actorId, action, resource, resourceId, meta, ipHash, createdAt)`.
- If the DB file is missing or the table doesn't exist yet, `/health`
  returns HTTP 503 with `status: "degraded"` and `dbAvailable: false`; other
  endpoints return a 503 with `error: "Database unavailable"`.
- `meta` is parsed as JSON when possible (otherwise returned as a raw string
  in the JSON export, and as-is in CSV).
