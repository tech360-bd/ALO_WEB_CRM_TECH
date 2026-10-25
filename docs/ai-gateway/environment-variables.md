# Gateway environment variables

Example file: `.env.ai-gateway.example` (placeholders only — no real secret is
committed). The gateway reads only the process environment; it never reads
`.env` files itself, so the values must be supplied by the service manager or a
secret file that the unit loads (`EnvironmentFile=`).

## 1. Required

| Variable | Format | Default | Read by | Notes |
|---|---|---|---|---|
| `AI_GATEWAY_APPS` | JSON array | none | gateway | **Required.** One entry per product. Startup/readiness fails without it. |
| `AI_GATEWAY_HOST` | IP | `127.0.0.1` | gateway | Production must stay loopback. |
| `AI_GATEWAY_PORT` | integer | `3180` | gateway | Verify free before deploy. |
| `AI_GATEWAY_METRICS_PORT` | integer | `9180` | gateway | Private listener only. |

### `AI_GATEWAY_APPS` entry

```json
{
  "id": "phd",
  "tokenSha256": "<64 lowercase hex characters>",
  "dataClassification": "CONFIDENTIAL",
  "allowExternal": false,
  "allowedModels": ["local-model"],
  "requestsPerMinute": 30,
  "maxInputBytes": 1048576,
  "monthlyBudgetMinor": null
}
```

* `id` — 3–40 characters `[a-z0-9_-]`; appears in metrics and audit events.
* `tokenSha256` — SHA-256 of a ≥32-character random token. The plaintext token is
  stored only in the consuming application's secret store.
* `dataClassification` — `PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED`.
* `allowExternal` — must be `true` **and** deployment policy approved for any
  external call.
* `allowedModels` — optional allowlist; omit to allow every configured model.

Generate a token and its hash:

```bash
node -e "const c=require('crypto');const t=c.randomBytes(32).toString('hex');console.log('token:',t);console.log('sha256:',c.createHash('sha256').update(t).digest('hex'))"
```

## 2. Optional — behaviour

| Variable | Default | Effect |
|---|---|---|
| `AI_GATEWAY_REQUEST_TIMEOUT_MS` | `120000` | Client-facing request budget (per provider attempt). |
| `AI_GATEWAY_MAX_RETRIES` | `2` | Total attempts = 1 + this value (hard max 4). |
| `AI_GATEWAY_RETRY_BASE_MS` | `120` | Base for exponential backoff; jitter is added. |
| `AI_GATEWAY_CIRCUIT_BREAKER_ENABLED` | `true` | Disable only for diagnosis. |
| `AI_GATEWAY_CIRCUIT_FAILURE_THRESHOLD` | `5` | Consecutive failures before opening. |
| `AI_GATEWAY_CIRCUIT_RESET_MS` | `30000` | Half-open probe interval. |
| `AI_GATEWAY_MAX_CONCURRENT_REQUESTS` | `8` | In-flight cap; excess returns `503`. |
| `AI_GATEWAY_MAX_INPUT_BYTES` | `1048576` | Hard body cap, before parsing. |
| `AI_GATEWAY_MAX_OUTPUT_TOKENS` | `4096` | Upper bound for `max_tokens`. |
| `AI_GATEWAY_LOG_PROMPTS` | `false` | **Refused in production.** `true` makes startup fail. |
| `AI_GATEWAY_LOG_COMPLETIONS` | `false` | Same. |
| `AI_GATEWAY_AUDIT_ENABLED` | `true` | Metadata audit lines. |
| `AI_GATEWAY_EXTERNAL_FALLBACK_ENABLED` | `false` | Permit external → local fallback only. |
| `AI_GATEWAY_METRICS_ENABLED` | `true` | Start the private metrics listener. |
| `AI_GATEWAY_ENABLE_MOCK` | `true` outside production | Deterministic mock provider for tests/verification. |
| `AI_GATEWAY_MOCK_MODEL` | `mock-1` | Mock model id. |

## 3. Optional — providers

| Variable | Required for | Notes |
|---|---|---|
| `LOCAL_MODEL_BASE_URL` | local adapter | OpenAI-compatible base URL, e.g. `http://127.0.0.1:11434/v1`. |
| `LOCAL_MODEL_NAME` | local adapter | Must match the server's model id. |
| `LOCAL_MODEL_API_KEY` | optional | Sent as `Authorization: Bearer` if set. |
| `LOCAL_MODEL_REQUEST_TIMEOUT_MS` | optional | `120000` default. |
| `EXTERNAL_MODEL_BASE_URL` | external adapter | OpenAI-compatible base URL. |
| `EXTERNAL_MODEL_NAME` | external adapter | Model id. |
| `EXTERNAL_MODEL_API_KEY` | external adapter | Server-side only. |
| `EXTERNAL_MODEL_REQUEST_TIMEOUT_MS` | optional | `60000` default. |
| `AI_EXTERNAL_DATA_POLICY` | external adapter | Must be `approved` or the adapter is disabled. Default `restricted`. |
| `AI_PROVIDER_ALLOWLIST` | external adapter | Comma list; must include `external`. |
| `AI_MONTHLY_BUDGET_LIMIT` / `AI_MAX_COST_PER_REQUEST` | — | **Documented but not enforced.** No verified price table exists, so the gateway does not pretend to enforce budgets. |

Adding a provider requires code (an adapter) and a review; it is not a
configuration-only change, by design.

## 4. Consuming-application variables

These are read by the application, not the gateway:

| Variable | Default | Effect |
|---|---|---|
| `PHD_AI_GATEWAY_ENABLED` | unset (`false`) | Enables the gateway path for the PhD module. |
| `AI_GATEWAY_BASE_URL` | unset | e.g. `http://127.0.0.1:3180`. |
| `PHD_AI_GATEWAY_TOKEN` | unset | The PhD application's own token (plaintext). |
| `PHD_AI_GATEWAY_MODEL` | falls back to `LOCAL_MODEL_NAME`, `AI_SMART_MODEL`, `AI_DEFAULT_MODEL` | Model id requested from the gateway. |
| `PHD_AI_GATEWAY_TIMEOUT_MS` | `120000` | Client-side timeout. |

With the flag off, `src/lib/phd/ai/client.ts` behaves exactly as before. With
the flag on but the URL/token missing, the client treats the gateway as *not*
configured and keeps the previous path — it never half-applies the change.

## 5. Secret handling and rotation

1. Create the token on the gateway host; write it to the application's secret
   file (`chmod 600`), not to an image, repo or chat message.
2. Add the matching SHA-256 to `AI_GATEWAY_APPS` and restart the gateway.
3. Restart the application; confirm `/v1/models` succeeds with the new token.
4. Remove the old hash and restart the gateway.

Two hashes may coexist during rotation. Never place a plaintext token in
`AI_GATEWAY_APPS`, Grafana, Prometheus labels or log output.

## 6. Startup behaviour

* Invalid JSON or a malformed entry → process exits non-zero with a
  `config_invalid` line (no secret values included).
* Production with no application registry, no usable provider, prompt logging,
  or a non-loopback bind → refuses to start.
* Non-production may start with problems but `/health/ready` reports `503` with a
  list of problems, so a verification run cannot mistake it for healthy.
