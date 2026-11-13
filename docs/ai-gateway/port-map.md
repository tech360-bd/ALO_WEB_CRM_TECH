# Port map and network boundaries

## 1. Verified inventory (this sandbox, 2026-10-25)

Command: `ss -ltn`

```
LISTEN 0 4096 0.0.0.0:111   0.0.0.0:*     # rpcbind — out of scope
LISTEN 0 4096 *:22          *:*           # sshd — out of scope
LISTEN 0 4096 *:49983       *:*           # sandbox ephemeral — out of scope
```

Nothing listened on 3180, 9180, 9090 or 3030 when the audit ran.

| Service | Port | Binding | State in this environment | Evidence |
|---|---:|---|---|---|
| Shared AI gateway API | 3180 | `127.0.0.1` | **implemented**, starts on demand | `scripts/verify-ai-gateway.sh` binds and finishes |
| Gateway metrics | 9180 | `127.0.0.1` | **implemented**, separate listener | `curl 127.0.0.1:9180/metrics` → 200; API port → 404 |
| Prometheus | 9090 | `127.0.0.1` | **not installed** | no binary, no service |
| Grafana | 3030 | `127.0.0.1` | **not installed**; dashboard JSON provided | `monitoring/grafana/ai-gateway-dashboard.json` |
| node-exporter | 9100 | `127.0.0.1` | **not installed**; referenced by scrape config | `monitoring/prometheus/ai-gateway-scrape.yml` |
| Local model runtime | provider-defined | loopback/private | **not configured** | `LOCAL_MODEL_*` empty |

The verification script deliberately uses **33180/39180/33181** rather than the
production defaults, so a verification run can never collide with (or be
mistaken for) a production gateway. `GATEWAY_PORT` and `GATEWAY_METRICS_PORT`
override them.

## 2. Occupied-port procedure

Never terminate a process to free a port. Instead:

1. `ss -ltnp | grep :<port>` and identify the owner (`sudo ss -ltnp` for the
   process name when permitted).
2. Decide whether the existing service is the intended one. A reverse proxy on
   3180 means the gateway needs a different port, not a kill.
3. Choose a verified free port and update **all** of: the gateway unit/config,
   each application's `AI_GATEWAY_BASE_URL`, the Prometheus scrape target, this
   document, and `scripts/verify-ai-gateway.sh`'s defaults.
4. Re-run the verification script before enabling any application.

## 3. Exposure rules

| Surface | Allowed exposure |
|---|---|
| Gateway API (`/health/*`, `/v1/*`) | Loopback only. Externally reachable **only** through the existing authenticated reverse proxy, and only after approval. |
| `/metrics` | Metrics listener only, loopback. Never proxied. Never scraped from the public API port (that port answers `404`). |
| Prometheus UI / Grafana | Loopback or VPN/SSH tunnel. Never public. |
| Local model runtime | Loopback/private network. No key in a browser. |

The gateway itself refuses to start in production unless it binds to loopback
(`assertProductionConfig`). This is a code-level guard, not only a convention.

## 4. Firewall checklist (production host)

- [ ] Default deny inbound; allow 22 (restricted), 80/443 (reverse proxy only).
- [ ] 3180 and 9180 are **not** in the public ruleset.
- [ ] 9090/3030 bound to loopback; reach them via SSH tunnel.
- [ ] Outbound allowlist includes only approved provider hosts and monitoring destinations.
- [ ] Local model port reachable only from the gateway process/network namespace.
- [ ] `ip -6 addr` checked: a service bound to `::1` is not the same as `127.0.0.1`; the gateway binds IPv4 loopback by default.

## 5. Health and metrics URLs

```
Live:    http://127.0.0.1:3180/health/live
Ready:   http://127.0.0.1:3180/health/ready
Models:  http://127.0.0.1:3180/v1/models          (Bearer required)
Metrics: http://127.0.0.1:9180/metrics            (no auth, loopback only)
```

`/health/live` answers `200` as soon as the process is serving. `/health/ready`
answers `503` when no application registry or no usable provider is configured —
so a container "running" is never reported as "ready".
