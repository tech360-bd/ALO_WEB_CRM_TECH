# Rollback

Rollback is designed to be a **flag flip plus a process stop**, not a database
restore. Nothing in this phase changes a schema, a record, a domain or TLS
configuration.

## 1. Triggers

Roll back immediately if any of the following is observed after enabling an
integration:

* the consuming application's health check fails;
* its error rate or p95 latency exceeds the agreed threshold;
* any unauthorised access or cross-application data exposure is detected;
* the gateway causes unexpected resource pressure on the host;
* a core workflow (proposal draft, application update, student record) breaks.

## 2. Order of operations

1. **Disable the integration** — set the application flag off and restart *only*
   that application:

   ```
   PHD_AI_GATEWAY_ENABLED=false
   ```

   The module then uses its previous provider path (`src/lib/ai.ts`), which was
   never removed.

2. **Confirm the application is healthy** on the old path:
   `curl -fsS http://127.0.0.1:<app-port>/api/health` (or the real health route),
   plus one manual action of the affected feature.

3. **Stop the gateway** through the real service manager:

   ```bash
   sudo systemctl stop alo-ai-gateway        # if systemd
   pm2 stop alo-ai-gateway                   # if PM2 — never `pm2 delete all`
   ```

4. **Revert configuration** only if the change itself was faulty (bad token,
   wrong port). Keep the service installed but disabled; do not uninstall during
   an incident.

5. **Monitoring** — remove the scrape target or rule files if they cause noise;
   they have no effect on application traffic.

6. **Code revert** — `git revert <commit>` on the deployment branch, redeploy the
   application only if application code changed.

7. **Preserve evidence** — copy `ai-gateway.log`, the audit lines and the
   verification JSON somewhere safe before rotating logs.

## 3. What must never be done as part of a rollback

* `pm2 delete all`, `pkill node`, `kill -9 -1` or any broad process kill.
* `prisma migrate reset`, `db push --force-reset`, dropping or restoring the
  application database over newer production data.
* Deleting uploaded documents, proposals or student records.
* Replacing the whole repository with an older checkout that discards committed
  work.
* Disabling TLS, opening a firewall port to "test", or publishing the gateway.

## 4. Verification after rollback

| Step | Command | Expected |
|---|---|---|
| Application health | existing health endpoint | 200 |
| Old AI path works | one non-critical AI action | succeeds, no gateway line in its log |
| Gateway stopped | `curl --max-time 2 127.0.0.1:3180/health/live` | connection refused |
| Data intact | row counts / one known record | unchanged |
| No orphan port | `ss -ltnp | grep -E ':(3180|9180)'` | no listener |

## 5. Rehearsal status

| Rollback step | Rehearsed here? | Evidence |
|---|---|---|
| Stop the gateway process | **Yes** | Verification check "Gateway failure does not alter application data" kills the process, observes connection refused, and compares the SQLite verification database checksum before/after. |
| Disable the application flag | **Yes (unit level)** | `tests/unit/phd/ai-gateway-client.test.ts` asserts the disabled state is a no-op and that `gatewayChat` refuses to call anything. |
| Restart the application | **No** | No application server runs in this environment (BLOCKED). |
| Service-manager stop/start | **No** | No PM2/systemd unit for these apps exists here (BLOCKED). |
| Reverse-proxy revert | **N/A** | No proxy was changed. |
| Database restore | **N/A** | No database change was made. Tested only in the sense that the verification DB checksum is unchanged. |

## 6. Recovery ownership

| Item | Owner (to be filled on the host) |
|---|---|
| Gateway process | |
| Application flag + restart | |
| Reverse proxy | |
| Monitoring | |
| Database backup/restore | |
| Incident record | |
