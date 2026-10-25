# Monitoring and alerts

## 1. What exists now

| Component | Status |
|---|---|
| Gateway metrics endpoint | **Implemented** — `/metrics` on the private listener |
| Prometheus scrape config | **Written** — `monitoring/prometheus/ai-gateway-scrape.yml` |
| Alert rules | **Written** — `monitoring/prometheus/ai-gateway-alerts.yml` (staged dashboard-only) |
| Grafana dashboard | **Written** — `monitoring/grafana/ai-gateway-dashboard.json` (6 panels) |
| Prometheus / Grafana / node-exporter | **Not installed** in this environment |
| Notification channel | **Not configured** |

No duplicate monitoring stack was installed. The configuration is provided so the
existing host can adopt it without a parallel deployment.

## 2. Metric catalogue

All labels are from a fixed vocabulary. No user ids, emails, document names or
request ids appear as labels.

| Metric | Type | Labels | Meaning |
|---|---|---|---|
| `ai_gateway_requests_total` | counter | `app`, `model`, `outcome` (`success`/`error`/`rejected`) | Requests by outcome |
| `ai_gateway_request_duration_seconds` | histogram | — | Latency distribution (p50/p95/p99) |
| `ai_gateway_inflight_requests` | gauge | — | Concurrency |
| `ai_gateway_retries_total` | counter | — | Provider retries performed |
| `ai_gateway_fallbacks_total` | counter | — | Requests completed by a fallback provider |
| `ai_gateway_policy_denials_total` | counter | `reason` (`external_not_allowed`, `local_only_unavailable`, `model_not_allowed`) | Policy refusals |
| `ai_gateway_rate_limited_total` | counter | `app` | Quota refusals |
| `ai_gateway_tokens_total` | counter | `app`, `model`, `kind` (`input`/`output`) | Token volume (**estimate**, not billed cost) |
| `ai_gateway_circuit_open` | gauge | `provider` | `1` when the breaker is open |

Deliberately absent: provider price, cost in currency, prompt sizes, completion
text, user identity, document identifiers.

## 3. Dashboard panels

1. Gateway availability (`up{job="ai-gateway"}`).
2. Request rate by outcome.
3. Latency p50 / p95 / p99.
4. Retries, fallbacks and circuit state.
5. Usage and denials by application.
6. Estimated token volume — labelled as an estimate, not billed cost.

Import: Grafana → Dashboards → Import → upload
`monitoring/grafana/ai-gateway-dashboard.json` (UID `alo-ai-gateway`).

## 4. Alert rules

| Alert | Expression summary | For | Severity |
|---|---|---|---|
| `AiGatewayDown` | `up{job="ai-gateway"} == 0` | 2m | critical |
| `AiGatewayNotReady` | errors present while scrape succeeds | 15m | warning |
| `AiGatewayHighErrorRate` | error ratio > 10% | 10m | warning |
| `AiGatewaySlowRequests` | p95 > 20 s | 10m | warning |
| `AiGatewayCircuitOpen` | `ai_gateway_circuit_open == 1` | 5m | warning |
| `AiGatewayFallbackSpike` | > 10 fallbacks / 15m | 5m | info |
| `AiGatewayAuthFailures` | > 20 rejected / 15m | 5m | warning |
| `HostDiskPressure` | < 15% free on `/` | 15m | warning |
| `HostMemoryPressure` | RAM > 90% | 15m | warning |

### Staging policy

`ALERTS_ENABLED=false` (default) and `stage: dashboard-only` on every rule. Do
**not** route to email/Slack until:

1. Prometheus loads the rules without error (`promtool check rules`);
2. a synthetic trip has been observed in the dashboard;
3. a test notification has been delivered and the recipients have approved it.

TLS certificate expiry alerting needs the reverse-proxy exporter or an external
probe; neither is installed, so it is listed as **BLOCKED** rather than claimed.

## 5. Log handling

Gateway stdout is one JSON object per line. Suggested retention (host-managed):

```
/var/log/alo/ai-gateway.log {
  daily
  rotate 30
  compress
  delaycompress
  missingok
  notifempty
  create 0640 alo-gateway alo-gateway
}
```

Audit lines contain no prompt text, completion text, tokens or personal data; log
retention therefore does not create a new personal-data store.

## 6. Verification performed

| Check | Result |
|---|---|
| `/metrics` on the API port | `404` (PASS) |
| `/metrics` on the metrics port | `200`, Prometheus text format (PASS) |
| Metric names match the catalogue | PASS |
| Log contains no test prompt / token | PASS |
| Prometheus scrapes the gateway | **BLOCKED** — Prometheus is not installed |
| Dashboard renders real data | **BLOCKED** — Grafana is not installed |
| Alert delivery | **BLOCKED** — no notification credentials |

## 7. What an operator should watch first

1. `ai_gateway_requests_total{outcome="rejected"}` rising — a caller is sending
   disallowed requests (wrong model, wrong class) rather than a provider fault.
2. `ai_gateway_circuit_open` — a provider is failing; do not raise timeouts to
   hide it.
3. `ai_gateway_inflight_requests` at the cap — concurrency saturation; the
   symptom is `503 OVERLOADED`, not slow success.
4. Token volume growth without a matching feature release — check for a retry
   loop in a calling application.
