#!/bin/bash
# ============================================================================
# start-prod.sh — Alaminn.info production launcher (VPS / standalone)
# ----------------------------------------------------------------------------
# Starts the Next.js standalone server with ALL required environment
# variables. Secrets are generated ONCE and persisted to .env.prod-secrets
# so sessions survive restarts.
#
# Usage:
#   ./start-prod.sh              # generate secrets if missing, then start
#   ./start-prod.sh --build      # run npm run build first, then start
# ============================================================================

set -euo pipefail
cd "$(dirname "$0")"

# ── 1. Ensure a production build exists ─────────────────────────────────────
if [[ "${1:-}" == "--build" ]] || [[ ! -f .next/standalone/server.js ]]; then
  echo "[start-prod] Building production bundle..."
  npm run build
fi

if [[ ! -f .next/standalone/server.js ]]; then
  echo "[start-prod] FATAL: .next/standalone/server.js not found after build." >&2
  exit 1
fi

# ── 2. Persist secrets to .env.prod-secrets (generated once) ────────────────
SECRETS_FILE=".env.prod-secrets"
if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "[start-prod] Generating persistent secrets ($SECRETS_FILE)..."
  cat > "$SECRETS_FILE" <<EOF
# Auto-generated persistent secrets — do NOT delete. chmod 600 recommended.
AUTH_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
HIGHER_STUDY_REFERRAL_SECRET=$(openssl rand -hex 32)
ENGLISH_LEARNING_REFERRAL_SECRET=$(openssl rand -hex 32)
EOF
  chmod 600 "$SECRETS_FILE"
  echo "[start-prod] Secrets written to $SECRETS_FILE (chmod 600)."
fi

# ── 3. Load secrets ──────────────────────────────────────────────────────────
set -a
# shellcheck disable=SC1090
source "$SECRETS_FILE"
set +a

# ── 4. Set remaining environment ─────────────────────────────────────────────
export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"
export DATABASE_URL="${DATABASE_URL:-file:$(pwd)/db/custom.db}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://alaminn.info}"
export EMAIL_FROM="${EMAIL_FROM:-noreply@alaminn.info}"
export EMAIL_REPLY_TO="${EMAIL_REPLY_TO:-hello@alaminn.info}"

# SMTP is optional in dev; warn if missing in prod
if [[ -z "${SMTP_HOST:-}" ]]; then
  echo "[start-prod] WARNING: SMTP_HOST not set — emails will not be sent." >&2
fi

echo "[start-pro] Starting Next.js standalone on port $PORT..."
exec node .next/standalone/server.js
