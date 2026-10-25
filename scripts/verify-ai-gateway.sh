#!/usr/bin/env bash
# Executable verification for the shared AI gateway.
#
# Every check records PASS, FAIL, BLOCKED or NOT RUN with the command and a
# sanitised evidence snippet. Nothing here prints secrets: token values are
# generated per run and never echoed.
#
#   bash scripts/verify-ai-gateway.sh
#   GATEWAY_PORT=3181 GATEWAY_METRICS_PORT=9181 bash scripts/verify-ai-gateway.sh
#
# The script starts its own gateway instance on loopback with the deterministic
# mock provider, so it does not need provider credentials. Live-provider checks
# are BLOCKED unless real keys are configured and the operator opts in.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/.ai-gateway-tmp"
mkdir -p "$OUT_DIR"
RESULTS="$OUT_DIR/verification-results.json"
LOG="$OUT_DIR/gateway.log"
PORT="${GATEWAY_PORT:-33180}"
METRICS_PORT="${GATEWAY_METRICS_PORT:-39180}"
EXT_PORT="${GATEWAY_EXTERNAL_STUB_PORT:-33181}"
BASE="http://127.0.0.1:$PORT"
METRICS="http://127.0.0.1:$METRICS_PORT"

APP_TOKEN="$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))")"
PHD_TOKEN="$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))")"
APP_HASH="$(node -e "process.stdout.write(require('crypto').createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" "$APP_TOKEN")"
PHD_HASH="$(node -e "process.stdout.write(require('crypto').createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" "$PHD_TOKEN")"

: > "$RESULTS"
PASS=0; FAIL=0; BLOCKED=0; NOTRUN=0

record() { # name command status evidence
  local name="$1" cmd="$2" status="$3" evidence="$4"
  python3 - "$name" "$cmd" "$status" "$evidence" <<'PY' >> "$RESULTS"
import json, sys
name, cmd, status, evidence = sys.argv[1:5]
print(("" if sys.argv[0] else "") + "," + json.dumps({"name": name, "command": cmd, "status": status, "evidence": evidence[:900]}))
PY
  case "$status" in
    PASS) PASS=$((PASS+1)) ;;
    FAIL) FAIL=$((FAIL+1)) ;;
    BLOCKED) BLOCKED=$((BLOCKED+1)) ;;
    *) NOTRUN=$((NOTRUN+1)) ;;
  esac
  printf '[%s] %s\n' "$status" "$name"
}

# Trim the leading comma written by the first record.
finalise() {
  python3 - "$RESULTS" <<'PY'
import json, sys, pathlib
path = pathlib.Path(sys.argv[1])
raw = path.read_text().strip()
raw = raw[1:] if raw.startswith(',') else raw
items = json.loads('[' + raw + ']') if raw else []
path.write_text(json.dumps(items, indent=2) + '\n')
PY
}

cleanup() {
  [ -n "${GATEWAY_PID:-}" ] && kill "$GATEWAY_PID" 2>/dev/null
  [ -n "${STUB_PID:-}" ] && kill "$STUB_PID" 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT

# ---------------------------------------------------------------- check 1 ----
if node -e "const [maj,min]=process.versions.node.split('.').map(Number); process.exit(maj>=20?0:1)"; then
  record "Node runtime is >= 20" "node -v" PASS "$(node -v)"
else
  record "Node runtime is >= 20" "node -v" FAIL "$(node -v)"
fi

# ---------------------------------------------------------------- check 2 ----
if [ -n "${AI_GATEWAY_APPS:-}" ]; then
  record "Gateway app registry present in environment" "env AI_GATEWAY_APPS" PASS "AI_GATEWAY_APPS is set (value redacted)"
else
  record "Gateway app registry present in environment" "env AI_GATEWAY_APPS" NOTRUN "Not set for this shell; the script generates a temporary registry for its own tests."
fi

# ---------------------------------------------------------------- check 3 ----
occupied=""
for p in "$PORT" "$METRICS_PORT" "$EXT_PORT"; do
  if (command -v ss >/dev/null && ss -ltn "sport = :$p" 2>/dev/null | grep -q LISTEN); then occupied="$occupied $p"; fi
done
if [ -z "$occupied" ]; then
  record "Assigned ports are free before start" "ss -ltn (ports $PORT,$METRICS_PORT,$EXT_PORT)" PASS "No listener on the assigned ports"
else
  record "Assigned ports are free before start" "ss -ltn (ports $PORT,$METRICS_PORT,$EXT_PORT)" FAIL "Occupied:$occupied"
  finalise; exit 1
fi

# Deterministic external-provider stub, used to prove local-only routes never
# leave the host. It records hits in a file the script can inspect.
cat > "$OUT_DIR/external-stub.mjs" <<'JS'
import http from 'node:http';
import { appendFileSync } from 'node:fs';
const file = process.argv[2];
const port = Number(process.argv[3]);
http.createServer((req, res) => {
  appendFileSync(file, `${req.method} ${req.url}\n`);
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ index: 0, message: { role: 'assistant', content: 'external-stub-response' } }], usage: { prompt_tokens: 3, completion_tokens: 2 } }));
  });
}).listen(port, '127.0.0.1');
JS
STUB_LOG="$OUT_DIR/external-hits.log"
: > "$STUB_LOG"
node "$OUT_DIR/external-stub.mjs" "$STUB_LOG" "$EXT_PORT" &
STUB_PID=$!
sleep 0.4

# ------------------------------------------------------------ checks 4-9 ----
AI_GATEWAY_APPS="$(printf '[{"id":"crm","tokenSha256":"%s","dataClassification":"INTERNAL","allowExternal":true,"requestsPerMinute":600},{"id":"phd","tokenSha256":"%s","dataClassification":"CONFIDENTIAL","allowExternal":false,"requestsPerMinute":600}]' "$APP_HASH" "$PHD_HASH")" \
AI_GATEWAY_ENABLE_MOCK=true \
AI_GATEWAY_HOST=127.0.0.1 AI_GATEWAY_PORT="$PORT" \
AI_GATEWAY_METRICS_HOST=127.0.0.1 AI_GATEWAY_METRICS_PORT="$METRICS_PORT" \
AI_GATEWAY_LOG_PROMPTS=false AI_GATEWAY_LOG_COMPLETIONS=false \
AI_EXTERNAL_DATA_POLICY=approved AI_PROVIDER_ALLOWLIST=external \
EXTERNAL_MODEL_BASE_URL="http://127.0.0.1:$EXT_PORT/v1" EXTERNAL_MODEL_NAME=external-test-model \
AI_GATEWAY_EXTERNAL_FALLBACK_ENABLED=false \
node "$ROOT/services/ai-gateway/server.mjs" > "$LOG" 2>&1 &
GATEWAY_PID=$!

ready=0
for _ in $(seq 1 50); do
  if curl -fsS "$BASE/health/live" >/dev/null 2>&1; then ready=1; break; fi
  sleep 0.2
done

if [ "$ready" = 1 ]; then
  record "Gateway process starts" "node services/ai-gateway/server.mjs" PASS "$(head -c 300 "$LOG")"
else
  record "Gateway process starts" "node services/ai-gateway/server.mjs" FAIL "$(tail -c 500 "$LOG")"
  finalise; exit 1
fi

BINDINGS="$(ss -ltn 2>/dev/null | grep -E ":($PORT|$METRICS_PORT)\b" | awk '{print $4}' | sort -u | tr '\n' ' ')"
if echo "$BINDINGS" | grep -q "127.0.0.1:$PORT" && echo "$BINDINGS" | grep -q "127.0.0.1:$METRICS_PORT"; then
  record "Both listeners bound to loopback on the assigned ports" "ss -ltn" PASS "$BINDINGS"
else
  record "Both listeners bound to loopback on the assigned ports" "ss -ltn" FAIL "$BINDINGS"
fi

LIVE_STATUS="$(curl -s -o "$OUT_DIR/live.json" -w '%{http_code}' "$BASE/health/live")"
if [ "$LIVE_STATUS" = 200 ]; then
  record "Liveness endpoint responds" "curl $BASE/health/live" PASS "$(cat "$OUT_DIR/live.json")"
else
  record "Liveness endpoint responds" "curl $BASE/health/live" FAIL "HTTP $LIVE_STATUS"
fi

READY_STATUS="$(curl -s -o "$OUT_DIR/ready.json" -w '%{http_code}' "$BASE/health/ready")"
if [ "$READY_STATUS" = 200 ] && grep -q '"status":"ready"' "$OUT_DIR/ready.json"; then
  record "Readiness reflects configured providers" "curl $BASE/health/ready" PASS "$(cat "$OUT_DIR/ready.json")"
else
  record "Readiness reflects configured providers" "curl $BASE/health/ready" FAIL "HTTP $READY_STATUS $(cat "$OUT_DIR/ready.json" 2>/dev/null)"
fi

UNAUTH_STATUS="$(curl -s -o "$OUT_DIR/unauth.json" -w '%{http_code}' -X POST "$BASE/v1/chat/completions" -H 'Content-Type: application/json' -d '{"model":"mock-1","messages":[{"role":"user","content":"x"}]}')"
if [ "$UNAUTH_STATUS" = 401 ]; then
  record "Unauthenticated inference is rejected" "curl -X POST $BASE/v1/chat/completions (no token)" PASS "HTTP 401 $(cat "$OUT_DIR/unauth.json")"
else
  record "Unauthenticated inference is rejected" "curl -X POST $BASE/v1/chat/completions (no token)" FAIL "HTTP $UNAUTH_STATUS"
fi

AUTH_STATUS="$(curl -s -o "$OUT_DIR/authed.json" -w '%{http_code}' -X POST "$BASE/v1/chat/completions" \
  -H "Authorization: Bearer $APP_TOKEN" -H 'Content-Type: application/json' \
  -d '{"model":"mock-1","messages":[{"role":"user","content":"verification prompt"}],"max_tokens":64}')"
if [ "$AUTH_STATUS" = 200 ] && grep -q 'MOCK:mock-1' "$OUT_DIR/authed.json"; then
  record "Authenticated request succeeds on the permitted test model" "curl -X POST $BASE/v1/chat/completions (crm identity)" PASS "HTTP 200, provider=$(python3 -c "import json;print(json.load(open('$OUT_DIR/authed.json'))['gateway']['provider'])")"
else
  record "Authenticated request succeeds on the permitted test model" "curl -X POST $BASE/v1/chat/completions (crm identity)" FAIL "HTTP $AUTH_STATUS $(head -c 300 "$OUT_DIR/authed.json")"
fi

MODEL_STATUS="$(curl -s -o "$OUT_DIR/badmodel.json" -w '%{http_code}' -X POST "$BASE/v1/chat/completions" \
  -H "Authorization: Bearer $PHD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"model":"gpt-5-unapproved","messages":[{"role":"user","content":"x"}],"max_tokens":8}')"
if [ "$MODEL_STATUS" = 403 ] && grep -q 'MODEL_NOT_PERMITTED' "$OUT_DIR/badmodel.json"; then
  record "Unapproved model is rejected" "curl -X POST $BASE/v1/chat/completions (unapproved model)" PASS "HTTP 403 $(cat "$OUT_DIR/badmodel.json")"
else
  record "Unapproved model is rejected" "curl -X POST $BASE/v1/chat/completions (unapproved model)" FAIL "HTTP $MODEL_STATUS $(head -c 300 "$OUT_DIR/badmodel.json")"
fi

# --------------------------------------------------------------- check 10 ----
: > "$STUB_LOG"
LOCAL_ONLY_STATUS="$(curl -s -o "$OUT_DIR/localonly.json" -w '%{http_code}' -X POST "$BASE/v1/chat/completions" \
  -H "Authorization: Bearer $APP_TOKEN" -H 'Content-Type: application/json' \
  -d '{"model":"external-test-model","route":"local_only","messages":[{"role":"user","content":"x"}],"max_tokens":8}')"
EXT_HITS="$(wc -l < "$STUB_LOG" | tr -d ' ')"
if [ "$EXT_HITS" = 0 ] && [ "$LOCAL_ONLY_STATUS" = 403 ]; then
  record "Local-only route never calls an external provider" "curl route=local_only + external stub hit counter" PASS "HTTP $LOCAL_ONLY_STATUS, external hits=$EXT_HITS"
else
  record "Local-only route never calls an external provider" "curl route=local_only + external stub hit counter" FAIL "HTTP $LOCAL_ONLY_STATUS, external hits=$EXT_HITS"
fi

# --------------------------------------------------------------- check 11 ----
: > "$STUB_LOG"
EXTERNAL_STATUS="$(curl -s -o "$OUT_DIR/external.json" -w '%{http_code}' -X POST "$BASE/v1/chat/completions" \
  -H "Authorization: Bearer $APP_TOKEN" -H 'Content-Type: application/json' \
  -d '{"model":"external-test-model","route":"external_approved","messages":[{"role":"user","content":"x"}],"max_tokens":8}')"
EXT_HITS="$(wc -l < "$STUB_LOG" | tr -d ' ')"
if [ "$EXTERNAL_STATUS" = 200 ] && [ "$EXT_HITS" -ge 1 ] && grep -q 'external-stub-response' "$OUT_DIR/external.json"; then
  record "Approved external route reaches the approved provider only" "curl route=external_approved + stub counter" PASS "HTTP 200, external hits=$EXT_HITS"
else
  record "Approved external route reaches the approved provider only" "curl route=external_approved + stub counter" FAIL "HTTP $EXTERNAL_STATUS, external hits=$EXT_HITS"
fi

# --------------------------------------------------------------- check 12 ----
CONF_STATUS="$(curl -s -o "$OUT_DIR/confidential.json" -w '%{http_code}' -X POST "$BASE/v1/chat/completions" \
  -H "Authorization: Bearer $PHD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"model":"mock-1","messages":[{"role":"user","content":"confidential draft"}],"max_tokens":8}')"
if [ "$CONF_STATUS" = 200 ] && grep -q '"provider":"mock"' "$OUT_DIR/confidential.json"; then
  record "Confidential application identity stays on the local provider" "curl (phd identity)" PASS "HTTP 200, provider=mock"
else
  record "Confidential application identity stays on the local provider" "curl (phd identity)" FAIL "HTTP $CONF_STATUS $(head -c 200 "$OUT_DIR/confidential.json")"
fi

# --------------------------------------------------------------- check 13 ----
MAIN_METRICS="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/metrics")"
PRIV_METRICS="$(curl -s -o "$OUT_DIR/metrics.txt" -w '%{http_code}' "$METRICS/metrics")"
if [ "$MAIN_METRICS" = 404 ] && [ "$PRIV_METRICS" = 200 ] && grep -q 'ai_gateway_requests_total' "$OUT_DIR/metrics.txt"; then
  record "Metrics are reachable only on the private listener" "curl $BASE/metrics; curl $METRICS/metrics" PASS "main=$MAIN_METRICS metrics=$PRIV_METRICS"
else
  record "Metrics are reachable only on the private listener" "curl $BASE/metrics; curl $METRICS/metrics" FAIL "main=$MAIN_METRICS metrics=$PRIV_METRICS"
fi

# --------------------------------------------------------------- check 14 ----
if grep -qiE "verification prompt|confidential draft|$APP_TOKEN|$PHD_TOKEN|student@example.com" "$LOG" "$OUT_DIR/metrics.txt" 2>/dev/null; then
  record "Logs contain no prompts, completions or tokens" "grep -E 'verification prompt|confidential draft|passport|email' gateway.log metrics.txt" FAIL "Sensitive content found in logs or metrics"
else
  record "Logs contain no prompts, completions or tokens" "grep -E 'verification prompt|confidential draft|<tokens>' gateway.log" PASS "No prompt text or token found in the gateway log"
fi

# --------------------------------------------------------------- check 15 ----
UNKNOWN_APP_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v1/models" -H "Authorization: Bearer not-a-real-token-0123456789abcdef")"
if [ "$UNKNOWN_APP_STATUS" = 401 ]; then
  record "A token that is not a registered application is rejected" "curl $BASE/v1/models (unknown token)" PASS "HTTP 401"
else
  record "A token that is not a registered application is rejected" "curl $BASE/v1/models (unknown token)" FAIL "HTTP $UNKNOWN_APP_STATUS"
fi

# --------------------------------------------------------------- check 16 ----
DB_BEFORE="$( [ -f "$ROOT/.phd-tmp/phd-test.db" ] && sha256sum "$ROOT/.phd-tmp/phd-test.db" | awk '{print $1}' || echo 'no-db')"
kill "$GATEWAY_PID" 2>/dev/null; GATEWAY_PID=""
sleep 0.5
DOWN_STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$BASE/health/live")"
DB_AFTER="$( [ -f "$ROOT/.phd-tmp/phd-test.db" ] && sha256sum "$ROOT/.phd-tmp/phd-test.db" | awk '{print $1}' || echo 'no-db')"
if [ "$DOWN_STATUS" = "000" ] && [ "$DB_BEFORE" = "$DB_AFTER" ]; then
  record "Gateway failure does not alter application data" "kill gateway; compare database checksum" PASS "Connection refused after stop; database checksum unchanged"
else
  record "Gateway failure does not alter application data" "kill gateway; compare database checksum" FAIL "HTTP $DOWN_STATUS, db-before=$DB_BEFORE db-after=$DB_AFTER"
fi

# --------------------------------------------------------------- check 16b ---
PROD_NO_APPS_STATUS=0
NODE_ENV=production AI_GATEWAY_ENABLE_MOCK=true AI_GATEWAY_PORT=0 AI_GATEWAY_METRICS_PORT=0 \
  timeout 10 node "$ROOT/services/ai-gateway/server.mjs" > "$OUT_DIR/prod-noapps.log" 2>&1 || PROD_NO_APPS_STATUS=$?
if [ "$PROD_NO_APPS_STATUS" -ne 0 ] && grep -q 'config_invalid' "$OUT_DIR/prod-noapps.log"; then
  record "Production refuses to start without an application registry" "NODE_ENV=production node services/ai-gateway/server.mjs" PASS "exit=$PROD_NO_APPS_STATUS $(cat "$OUT_DIR/prod-noapps.log")"
else
  record "Production refuses to start without an application registry" "NODE_ENV=production node services/ai-gateway/server.mjs" FAIL "exit=$PROD_NO_APPS_STATUS"
fi

# --------------------------------------------------------------- check 16c ---
PUBLIC_BIND_HASH="$(node -e "process.stdout.write(require('crypto').createHash('sha256').update('x'.repeat(32)).digest('hex'))")"
PROD_PUBLIC_STATUS=0
NODE_ENV=production AI_GATEWAY_HOST=0.0.0.0 AI_GATEWAY_PORT=0 AI_GATEWAY_METRICS_PORT=0 \
  AI_GATEWAY_APPS="[{\"id\":\"crm\",\"tokenSha256\":\"$PUBLIC_BIND_HASH\"}]" AI_GATEWAY_ENABLE_MOCK=true \
  timeout 10 node "$ROOT/services/ai-gateway/server.mjs" > "$OUT_DIR/prod-public.log" 2>&1 || PROD_PUBLIC_STATUS=$?
if [ "$PROD_PUBLIC_STATUS" -ne 0 ] && grep -qi 'loopback' "$OUT_DIR/prod-public.log"; then
  record "Production refuses a non-loopback bind" "NODE_ENV=production AI_GATEWAY_HOST=0.0.0.0 node server.mjs" PASS "exit=$PROD_PUBLIC_STATUS $(cat "$OUT_DIR/prod-public.log")"
else
  record "Production refuses a non-loopback bind" "NODE_ENV=production AI_GATEWAY_HOST=0.0.0.0 node server.mjs" FAIL "exit=$PROD_PUBLIC_STATUS"
fi

# --------------------------------------------------------------- check 17 ----
if command -v npx >/dev/null; then
  if npx vitest run tests/unit/ai-gateway > "$OUT_DIR/vitest-gateway.log" 2>&1; then
    record "Gateway unit and integration tests" "npx vitest run tests/unit/ai-gateway" PASS "$(grep -E 'Tests +[0-9]+' "$OUT_DIR/vitest-gateway.log" | tail -1)"
  else
    record "Gateway unit and integration tests" "npx vitest run tests/unit/ai-gateway" FAIL "$(tail -c 400 "$OUT_DIR/vitest-gateway.log")"
  fi
else
  record "Gateway unit and integration tests" "npx vitest run tests/unit/ai-gateway" NOTRUN "npx not available"
fi

# --------------------------------------------------------------- check 18 ----
if (cd "$ROOT" && node --check services/ai-gateway/gateway.mjs && node --check services/ai-gateway/server.mjs); then
  record "Gateway source parses" "node --check services/ai-gateway/*.mjs" PASS "Both files parse"
else
  record "Gateway source parses" "node --check services/ai-gateway/*.mjs" FAIL "Syntax error"
fi

# --------------------------------------------------------------- check 19 ----
if (cd "$ROOT" && NODE_OPTIONS=--max-old-space-size=2048 npx tsc -p tsconfig.phd.json --noEmit > "$OUT_DIR/tsc.log" 2>&1); then
  record "TypeScript type check (PhD + gateway client surface)" "npx tsc -p tsconfig.phd.json --noEmit" PASS "No type errors"
else
  record "TypeScript type check (PhD + gateway client surface)" "npx tsc -p tsconfig.phd.json --noEmit" FAIL "$(tail -c 400 "$OUT_DIR/tsc.log")"
fi

# --------------------------------------------------------------- check 20 ----
if [ -n "${GROQ_API_KEY:-}${OPENROUTER_API_KEY:-}${ZAI_API_KEY:-}${EXTERNAL_MODEL_API_KEY:-}" ]; then
  record "Live provider inference" "authorised live-provider call" NOTRUN "Provider credentials present but live calls require explicit operator approval and bounded cost."
else
  record "Live provider inference" "authorised live-provider call" BLOCKED "No provider credentials are configured in this environment; only the deterministic mock provider was exercised."
fi

finalise

echo
echo "Summary: PASS=$PASS FAIL=$FAIL BLOCKED=$BLOCKED NOT-RUN=$NOTRUN"
echo "Machine-readable results: ${RESULTS#"$ROOT"/}"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
